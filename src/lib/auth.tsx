import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  recovering: boolean;
  linkError: string;
  setLinkError: (m: string) => void;
  setRecovering: (v: boolean) => void;
  name: string;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [name, setName] = useState("");

  const refreshProfile = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setName("");
    const { data } = await supabase.from("profiles").select("name").eq("id", u.user.id).maybeSingle();
    setName(data?.name || (u.user.user_metadata?.name as string) || "");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const cleanUrl = () => window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    const expired = "This link has expired or was already used. Request a new one below.";

    if (tokenHash) {
      // Links from our emails carry a one-time token that works in any browser,
      // even if the reset was requested in the home-screen app and opened in Safari or Gmail.
      const type = (params.get("type") || "email") as "recovery" | "email" | "signup" | "magiclink";
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
        cleanUrl();
        if (error) setLinkError(expired);
        else {
          setSession(data.session);
          if (type === "recovery") setRecovering(true);
        }
        setLoading(false);
      });
    } else {
      supabase.auth.getSession().then(({ data, error }) => {
        // older links (?code=…) only work in the browser where they were requested
        if (params.has("code")) {
          cleanUrl();
          if (error || !data.session) setLinkError("This link has to be opened on the same device and in the same app where you requested it, or it has expired. Request a new one below.");
        }
        setSession(data.session);
        setLoading(false);
      });
    }
    // A reset link signs the user in. With the PKCE flow the event may arrive as SIGNED_IN,
    // so we also remember on this device that a reset was requested.
    const cameFromLink = new URLSearchParams(window.location.search).has("code");
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      let requested = 0;
      try {
        requested = Number(localStorage.getItem("pw-reset-requested") || 0);
      } catch {
        /* storage unavailable */
      }
      const recent = requested && Date.now() - requested < 2 * 3600 * 1000;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && cameFromLink && recent)) {
        setRecovering(true);
        try {
          localStorage.removeItem("pw-reset-requested");
        } catch {
          /* ignore */
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refreshProfile();
  }, [session?.user?.id]);

  return <Ctx.Provider value={{ session, loading, recovering, setRecovering, name, refreshProfile, linkError, setLinkError }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
