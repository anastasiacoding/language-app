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
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refreshProfile();
  }, [session?.user?.id]);

  return <Ctx.Provider value={{ session, loading, recovering, setRecovering, name, refreshProfile }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
