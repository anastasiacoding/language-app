import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, latestConsents, setConsent } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Header, Icon, Modal, Toggle } from "../components/ui";

const GOALS = [5, 10, 15, 20, 30, 45, 60];

export default function Profile() {
  const { session, name, refreshProfile } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [goal, setGoal] = useState(15);
  const [editName, setEditName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    latestConsents().then(setConsents);
    supabase.from("profiles").select("daily_goal").maybeSingle().then(({ data }) => data && setGoal(data.daily_goal));
  }, []);

  const flip = async (kind: "voice" | "newsletter", v: boolean) => {
    setConsents((c) => ({ ...c, [kind]: v }));
    await setConsent(kind, v);
  };

  const saveGoal = async (g: number) => {
    setGoal(g);
    await supabase.from("profiles").update({ daily_goal: g }).eq("id", session!.user.id);
  };

  const saveName = async () => {
    if (editName === null) return;
    await supabase.from("profiles").update({ name: editName.trim().slice(0, 80) }).eq("id", session!.user.id);
    setEditName(null);
    refreshProfile();
  };

  const download = async () => {
    const tables = ["profiles", "consents", "texts", "sessions", "words", "favorites"];
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), account: { id: session!.user.id, email: session!.user.email, created_at: session!.user.created_at } };
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my-french-app-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const deleteAccount = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("delete_my_account");
    setBusy(false);
    if (error) return alert("Couldn’t delete the account: " + error.message);
    await supabase.auth.signOut();
    nav("/");
  };

  const Row = ({ t, s, right, onClick, color }: any) => (
    <div className="list-row" onClick={onClick} role={onClick ? "button" : undefined} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="grow"><div className="t" style={{ color }}>{t}</div>{s && <div className="s">{s}</div>}</div>
      {right}
    </div>
  );
  const chev = <Icon name="chev" size={18} color="#6B5850" />;

  return (
    <div className="screen">
      <Header title="Profile" />
      <div className="card row" style={{ flexDirection: "row", gap: 14, padding: 16 }}>
        <div style={{ width: 56, height: 56, minWidth: 56, borderRadius: 28, background: "var(--scarlet)", color: "#FFF3E6", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 22 }}>{(name || "?").slice(0, 1).toUpperCase()}</div>
        <div className="grow">
          {editName === null ? (
            <>
              <div className="row" style={{ gap: 6 }}><b style={{ fontSize: 17 }}>{name || "Your name"}</b><button className="icon-btn" onClick={() => setEditName(name)} aria-label="Edit name"><Icon name="pen" size={16} color="#6B5850" /></button></div>
              <div className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user.email}</div>
              <div className="xs" style={{ color: "#5B4034", fontWeight: 500 }}>French</div>
            </>
          ) : (
            <div className="row"><input className="input" style={{ height: 40 }} value={editName} onChange={(e) => setEditName(e.target.value)} /><button className="btn sm primary" onClick={saveName}>Save</button></div>
          )}
        </div>
      </div>

      <span className="label">Settings</span>
      <div className="card flat">
        <Row t="Daily goal" right={<select className="chip" style={{ fontSize: 13, padding: "6px 8px" }} value={goal} onChange={(e) => saveGoal(Number(e.target.value))}>{GOALS.map((g) => <option key={g} value={g}>{g} min</option>)}</select>} />
      </div>

      <span className="label">Privacy and data</span>
      <div className="card tint" style={{ gap: 6 }}>
        <div className="row" style={{ gap: 8 }}><Icon name="shield" size={18} color="#5B4034" /><b className="small" style={{ color: "#5B4034" }}>Your data is protected</b></div>
        <p className="small" style={{ color: "#5B4034" }}>Voice recordings are never stored. Your texts and progress live on servers in the EU (Frankfurt). We don’t sell data or show ads.</p>
      </div>
      <div className="card flat">
        <Row t="Voice scoring" s="Needed for reading, translation and retelling" right={<Toggle label="Voice scoring" on={!!consents.voice} onChange={(v) => flip("voice", v)} />} />
        <Row t="Product news by email" right={<Toggle label="Product news" on={!!consents.newsletter} onChange={(v) => flip("newsletter", v)} />} />
      </div>
      <div className="card flat">
        <Row t="Download my data" s="A file with all your texts, words and progress" right={<Icon name="download" size={18} color="#6B5850" />} onClick={download} />
        <Row t="Privacy policy" right={chev} onClick={() => nav("/privacy")} />
        <Row t="Consent history" s="What you agreed to, and when" right={chev} onClick={() => nav("/consents")} />
        <Row t="Log out" right={chev} onClick={() => supabase.auth.signOut()} />
      </div>
      <div className="card flat">
        <Row t="Delete account and all data" s="This can’t be undone" color="var(--scarlet)" onClick={() => setConfirmDelete(true)} />
      </div>

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(false)}>
          <h2>Delete your account?</h2>
          <p className="small">Your account, texts, words, progress and consent history will be permanently deleted. Type DELETE to confirm.</p>
          <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" autoCapitalize="characters" />
          <button className="btn primary" disabled={typed !== "DELETE" || busy} onClick={deleteAccount}>{busy ? "Deleting…" : "Delete forever"}</button>
          <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </Modal>
      )}
      <p className="xs muted center">Version 0.1 · <Link to="/privacy">Privacy</Link></p>
    </div>
  );
}
