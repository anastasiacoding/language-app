import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RULES, LEVELS, CATEGORY_ORDER, type Level } from "../data/rules";
import { useFavorites } from "../lib/favorites";
import { Icon, Seg, Star } from "../components/ui";

type Tab = "all" | Level | "fav";

export default function Grammar() {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem("grammarTab") as Tab) || "all";
    } catch {
      return "all";
    }
  });
  const [q, setQ] = useState("");
  const { favs, toggle } = useFavorites("rule");
  const nav = useNavigate();
  const pickTab = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem("grammarTab", t);
    } catch {
      /* private mode */
    }
  };

  const query = q.trim().toLowerCase();
  const list = RULES.filter((r) => (tab === "fav" ? favs.has(r.id) : tab === "all" ? true : r.level === tab))
    .filter((r) => !query || (r.title + " " + r.short + " " + r.category).toLowerCase().includes(query))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  const levels = LEVELS.filter((l) => list.some((r) => r.level === l.id));

  return (
    <div className="screen">
      <h1>Grammar</h1>
      <label className="card row" style={{ padding: "12px 14px", gap: 10, flexDirection: "row" }}>
        <Icon name="search" size={20} color="#6B5850" />
        <input className="grow" style={{ border: 0, outline: 0, background: "none", fontSize: 16 }} placeholder={`Search ${RULES.length} rules`} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <Seg
        items={[{ id: "all", label: "All" }, ...LEVELS.map((l) => ({ id: l.id, label: l.id })), { id: "fav", label: `★ ${favs.size}` }]}
        value={tab}
        onChange={pickTab}
      />
      {list.length === 0 && <p className="empty small">{tab === "fav" ? "Tap the star on a rule to keep it here." : "No rules match."}</p>}
      {levels.map((l) => (
        <div className="stack" key={l.id}>
          <span className="label">{l.id} · {l.name}</span>
          <div className="card flat">
            {list.filter((r) => r.level === l.id).map((r) => (
              <div key={r.id} className="list-row" onClick={() => nav(`/grammar/${r.id}`)} role="button">
                <div className="grow">
                  <div className="t">{r.title}</div>
                  <div className="s">{r.short}</div>
                </div>
                <button className="icon-btn" aria-label={favs.has(r.id) ? "Remove from favorites" : "Add to favorites"} onClick={(e) => { e.stopPropagation(); toggle(r.id); }}>
                  <Star on={favs.has(r.id)} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
