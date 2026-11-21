import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RULES } from "../data/rules";
import { useFavorites } from "../lib/favorites";
import { Icon, Seg, Star } from "../components/ui";

export default function Grammar() {
  const [tab, setTab] = useState<"all" | "fav">("all");
  const [q, setQ] = useState("");
  const { favs, toggle } = useFavorites("rule");
  const nav = useNavigate();

  const list = RULES.filter((r) => (tab === "fav" ? favs.has(r.id) : true)).filter((r) => (r.title + " " + r.short).toLowerCase().includes(q.toLowerCase()));
  const cats = Array.from(new Set(list.map((r) => r.category)));

  return (
    <div className="screen">
      <h1>Grammar</h1>
      <label className="card row" style={{ padding: "12px 14px", gap: 10, flexDirection: "row" }}>
        <Icon name="search" size={20} color="#6B5850" />
        <input className="grow" style={{ border: 0, outline: 0, background: "none", fontSize: 14 }} placeholder="Search rules" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <Seg items={[{ id: "all", label: "All rules" }, { id: "fav", label: `Favorites · ${favs.size}` }]} value={tab} onChange={setTab} />
      {list.length === 0 && <p className="empty small">{tab === "fav" ? "Tap the star on a rule to keep it here." : "No rules match."}</p>}
      {cats.map((c) => (
        <div className="stack" key={c}>
          <span className="label">{c}</span>
          <div className="card flat">
            {list.filter((r) => r.category === c).map((r) => (
              <div key={r.id} className="list-row" onClick={() => nav(`/grammar/${r.id}`)} role="button">
                <div className="grow"><div className="t">{r.title}</div><div className="s">{r.short}</div></div>
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
