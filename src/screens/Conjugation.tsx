import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { conjugate, TENSES, type Tense } from "../lib/conjugate";
import { useFavorites } from "../lib/favorites";
import { speak } from "../lib/speech";
import { Header, Icon, Star } from "../components/ui";

export default function Conjugation() {
  const { verb } = useParams();
  const c = useMemo(() => conjugate(decodeURIComponent(verb || "")), [verb]);
  const [sel, setSel] = useState<Tense[]>(["present", "passe"]);
  const { favs, toggle } = useFavorites("verb");

  if (!c.supported)
    return (
      <div className="screen">
        <Header title={c.infinitive} />
        <div className="card"><p className="small">We can’t conjugate “{c.infinitive}” yet. Check the spelling: French verbs end in -er, -ir, -re or -oir.</p></div>
      </div>
    );

  const toggleTense = (t: Tense) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <div className="screen">
      <Header title={c.infinitive} right={<button className="icon-btn" onClick={() => toggle(c.infinitive)} aria-label="Favorite"><Star on={favs.has(c.infinitive)} size={24} /></button>} />
      <div className="row wrap" style={{ gap: 8 }}>
        {c.en && <span className="small muted">{c.en}</span>}
        {c.irregular && <span className="chip red">irregular</span>}
        <span className="chip">auxiliary: {c.aux}</span>
      </div>
      <div className="hscroll">
        {TENSES.map((t) => <button key={t.id} className={"pill" + (sel.includes(t.id) ? " on" : "")} onClick={() => toggleTense(t.id)}>{t.label}</button>)}
      </div>
      {TENSES.filter((t) => sel.includes(t.id)).map((t) => (
        <div className="card" key={t.id} style={{ padding: 16, gap: 6 }}>
          <div className="row between">
            <h3>{t.label}</h3>
            <button className="icon-btn" onClick={() => speak(c.forms[t.id].filter(Boolean).join(". ").replace(/ \/ elle/g, "").replace(/ \/ elles/g, ""))} aria-label="Listen"><Icon name="speaker" size={18} color="#B9592D" /></button>
          </div>
          <table className="table">
            <tbody>
              {c.forms[t.id].map((f, i) => {
                if (!f) return null;
                const m = f.match(/^(j’|je |tu |il \/ elle |il |nous |vous |ils \/ elles )(.*)$/);
                return (
                  <tr key={i}>
                    <td>{m ? m[1].trim() : ""}</td>
                    <td className={c.irregularForms[t.id][i] ? "irr" : ""} style={{ fontWeight: 600 }}>{m ? m[2] : f}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {c.irregular && <p className="xs muted">Irregular forms are shown in red.</p>}
    </div>
  );
}
