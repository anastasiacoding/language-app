import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type WordRow } from "../lib/supabase";
import { Header, Icon, Seg, Spinner, Meaning, Pron } from "../components/ui";

type Filter = "all" | "pronunciation" | "meaning";

export default function MyWords() {
  const [words, setWords] = useState<WordRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const nav = useNavigate();

  useEffect(() => {
    supabase.from("words").select("*").order("created_at", { ascending: false }).then(({ data }) => setWords(data ?? []));
  }, []);

  const remove = async (id: string) => {
    setWords((w) => w!.filter((x) => x.id !== id));
    await supabase.from("words").delete().eq("id", id);
  };

  if (!words) return <div className="screen" style={{ alignItems: "center", paddingTop: 80 }}><Spinner /></div>;
  const n = (r: Filter) => (r === "all" ? words.length : words.filter((w) => w.reason === r).length);
  const list = words.filter((w) => filter === "all" || w.reason === filter);
  const due = words.filter((w) => !w.learned);

  const Mode = ({ icon, label, to, soon }: { icon: string; label: string; to?: string; soon?: boolean }) => (
    <button
      className="card"
      style={{ flex: 1, alignItems: "center", padding: "16px 6px", gap: 8, cursor: soon ? "default" : "pointer", background: soon ? "var(--bg)" : undefined, borderStyle: soon ? "dashed" : "solid" }}
      onClick={() => to && due.length && nav(to)}
      aria-disabled={soon || !due.length}
    >
      <Icon name={icon} size={24} color={soon ? "#C5C8CC" : "#A4161A"} />
      <span className="xs" style={{ fontWeight: 600 }}>{label}</span>
      {soon && <span className="xs muted">soon</span>}
    </button>
  );

  return (
    <div className="screen">
      <Header title="My words" />
      <Seg items={[{ id: "all", label: `All ${n("all")}` }, { id: "pronunciation", label: `Sounds ${n("pronunciation")}` }, { id: "meaning", label: `Meaning ${n("meaning")}` }]} value={filter} onChange={setFilter} />
      <div className="row" style={{ gap: 10, alignItems: "stretch" }}>
        <Mode icon="mic" label="Read aloud" to="/review/read" />
        <Mode icon="lang" label="Translate" to="/review/translate" />
        <Mode icon="pen" label="Write" soon />
      </div>
      {words.length === 0 ? (
        <p className="empty small">Words you mispronounce or don’t know in a reading session will appear here.</p>
      ) : (
        <>
          <span className="label">To review · {due.length}</span>
          <div className="card flat">
            {list.map((w) => (
              <div className="list-row" key={w.id} style={{ cursor: "default" }}>
                <div className="grow">
                  <div className="t" style={{ textDecoration: w.learned ? "line-through" : "none", color: w.learned ? "var(--muted)" : undefined }}>{w.word} <Pron word={w.word} size={13} quiet /></div>
                  <div className="s"><Meaning word={w.word} fallback={w.translation} /></div>
                </div>
                <span className={"chip" + (w.reason === "pronunciation" ? " red" : "")}>{w.reason === "pronunciation" ? "pronunciation" : "meaning"}</span>
                <button className="icon-btn" onClick={() => remove(w.id)} aria-label={`Delete ${w.word}`}><Icon name="trash" size={18} color="#6B5850" /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
