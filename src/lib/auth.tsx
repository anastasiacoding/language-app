import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  recovering: boolean;
  setRecovering: (v: boolean) => void;
  name: string;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [name, setName] = useState("");

  const refreshProfile = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setName("");
    const { data } = await supabase.from("profiles").select("name").eq("id", u.user.id).maybeSingle();
    setName(data?.name || (u.user.user_metadata?.name as string) || "");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
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

  return <Ctx.Provider value={{ session, loading, recovering, setRecovering, name, refreshProfile }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
