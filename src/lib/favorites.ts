import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useFavorites(kind: "rule" | "verb") {
  const [favs, setFavs] = useState<Set<string>>(new Set());
  useEffect(() => {
    supabase
      .from("favorites")
      .select("key")
      .eq("kind", kind)
      .then(({ data }) => setFavs(new Set((data ?? []).map((r) => r.key))));
  }, [kind]);

  const toggle = async (key: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const next = new Set(favs);
    if (next.has(key)) {
      next.delete(key);
      setFavs(next);
      await supabase.from("favorites").delete().eq("kind", kind).eq("key", key);
    } else {
      next.add(key);
      setFavs(next);
      await supabase.from("favorites").insert({ user_id: u.user.id, kind, key });
    }
  };
  return { favs, toggle };
}
