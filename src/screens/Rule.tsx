import { Link, useParams } from "react-router-dom";
import { RULE_MAP } from "../data/rules";
import { useFavorites } from "../lib/favorites";
import { Header, Star } from "../components/ui";

export default function Rule() {
  const { id } = useParams();
  const r = RULE_MAP.get(id!);
  const { favs, toggle } = useFavorites("rule");
  if (!r) return <div className="screen"><Header title="Rule" /><p className="muted">Rule not found.</p></div>;
  return (
    <div className="screen">
      <Header title={r.title} right={<button className="icon-btn" onClick={() => toggle(r.id)} aria-label="Favorite"><Star on={favs.has(r.id)} size={24} /></button>} />
      <div className="row" style={{ gap: 6 }}><span className="chip">{r.level}</span><span className="xs muted">{r.category}</span></div>
      <div className="card">{r.explain.map((p, i) => <p key={i} style={{ fontSize: 15 }}>{p}</p>)}</div>
      {r.table && (
        <div className="card flat">
          {r.table.map(([a, b, hl]) => (
            <div className="list-row" key={a} style={{ cursor: "default" }}>
              <span className="grow small" style={{ fontWeight: 600 }}>{a}</span>
              <span style={{ fontWeight: 700, color: hl ? "var(--scarlet)" : "var(--text)", textAlign: "right" }}>{b}</span>
            </div>
          ))}
        </div>
      )}
      <span className="label">Examples</span>
      <div className="card" style={{ gap: 12 }}>
        {r.examples.map(([fr, en]) => (
          <div key={fr} className="row" style={{ alignItems: "flex-start" }}>
            <div className="grow"><p style={{ fontWeight: 500 }}>{fr}</p><p className="small muted">{en}</p></div>
          </div>
        ))}
      </div>
      <Link to={`/practice/${r.id}`} className="btn primary">Practice ∞</Link>
    </div>
  );
}
