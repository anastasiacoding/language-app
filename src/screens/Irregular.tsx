import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IRREGULAR_TOP, verbEnglish } from "../lib/conjugate";
import { useFavorites } from "../lib/favorites";
import { Header, Seg, Star } from "../components/ui";

export default function Irregular() {
  const [tab, setTab] = useState<"all" | "fav">("all");
  const { favs, toggle } = useFavorites("verb");
  const nav = useNavigate();
  const list = tab === "all" ? IRREGULAR_TOP : Array.from(favs);
  return (
    <div className="screen">
      <Header title="Irregular verbs" />
      <Seg items={[{ id: "all", label: `All · ${IRREGULAR_TOP.length}` }, { id: "fav", label: `Favorites · ${favs.size}` }]} value={tab} onChange={setTab} />
      {list.length === 0 ? (
        <p className="empty small">Tap the star next to a verb to save it here.</p>
      ) : (
        <div className="card flat">
          {list.map((v) => (
            <div key={v} className="list-row" role="button" onClick={() => nav(`/reference/verb/${encodeURIComponent(v)}`)} style={{ paddingTop: 10, paddingBottom: 10 }}>
              <div className="grow"><div className="t">{v}</div><div className="s">{verbEnglish(v)}</div></div>
              <button className="icon-btn" aria-label="Favorite" onClick={(e) => { e.stopPropagation(); toggle(v); }}><Star on={favs.has(v)} size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
