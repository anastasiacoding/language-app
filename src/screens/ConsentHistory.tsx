import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Header, Spinner } from "../components/ui";

const LABEL: Record<string, string> = {
  age: "Confirmed age 15 or older",
  terms: "Terms of Use and Privacy Policy",
  voice: "Voice scoring",
  reminders: "Practice reminders",
  newsletter: "Product news by email",
};

export default function ConsentHistory() {
  const [rows, setRows] = useState<{ kind: string; granted: boolean; created_at: string }[] | null>(null);
  useEffect(() => {
    supabase.from("consents").select("kind, granted, created_at").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="screen">
      <Header title="Consent history" />
      {!rows ? (
        <Spinner />
      ) : (
        <div className="card flat">
          {rows.map((r, i) => (
            <div className="list-row" key={i} style={{ cursor: "default" }}>
              <div className="grow"><div className="t">{LABEL[r.kind] ?? r.kind}</div><div className="s">{new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div></div>
              <span className={"chip" + (r.granted ? "" : " red")}>{r.granted ? "given" : "withdrawn"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
