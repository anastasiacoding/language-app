import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

const redirectTo = () => window.location.origin + window.location.pathname;

function Brand() {
  return <img src={import.meta.env.BASE_URL + "app-icon.svg"} width={64} height={64} alt="" style={{ borderRadius: 16 }} />;
}

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [voice, setVoice] = useState(true);
  const [news, setNews] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Enter your name.");
    if (password.length < 8) return setErr("Use at least 8 characters for your password.");
    if (!age || !terms) return setErr("Confirm your age and accept the Terms and Privacy Policy to continue.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo(),
        data: { name: name.trim(), consents: { age, terms, voice, newsletter: news } },
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (!data.session) setSent(true);
  };

  if (sent)
    return (
      <div className="screen">
        <Brand />
        <h1>Check your email</h1>
        <p className="muted">We sent a confirmation link to {email}. Open it on this device to finish creating your account.</p>
        <Link className="btn" to="/login">Go to log in</Link>
      </div>
    );

  return (
    <form className="screen" onSubmit={submit}>
      <Brand />
      <h1>Bienvenue !</h1>
      <p className="muted small">French Lion: practice reading, grammar and conjugation. Make yourself proud.</p>
      <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" /></label>
      <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="field"><span>Password</span><input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
      <div className="card" style={{ gap: 14 }}>
        <label className="check"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /><span className="small">I’m 15 or older<br /><span className="xs" style={{ color: "var(--scarlet)" }}>required</span></span></label>
        <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="small">I accept the Terms of Use and <Link to="/privacy">Privacy Policy</Link><br /><span className="xs" style={{ color: "var(--scarlet)" }}>required</span></span></label>
        <label className="check"><input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /><span className="small">Process my voice to score reading and translation. Recordings are never stored<br /><span className="xs muted">optional · needed for speaking exercises</span></span></label>
        <label className="check"><input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} /><span className="small">Email me product news<br /><span className="xs muted">optional</span></span></label>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      <p className="center small muted">Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link></p>
      <p className="center xs"><Link to="/about" style={{ color: "var(--muted)" }}>About the app</Link></p>
      <p className="center small muted"><Link to="/reset">Forgot your password?</Link></p>
    </form>
  );
}

export function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
    else nav("/");
  };
  return (
    <form className="screen" onSubmit={submit}>
      <Brand />
      <h1>Bon retour !</h1>
      <p className="muted small">Log in to continue practicing.</p>
      <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="field"><span>Password</span><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <Link className="btn ghost" to="/reset">Forgot password?</Link>
      <p className="center small muted">New here? <Link to="/" style={{ fontWeight: 600 }}>Create an account</Link></p>
    </form>
  );
}

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("pw-reset-requested", String(Date.now()));
    } catch {
      /* storage unavailable */
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo() });
    if (error) setErr(error.message);
    else setDone(true);
  };
  return (
    <form className="screen" onSubmit={submit}>
      <Brand />
      <h1>Reset password</h1>
      {!done && <p className="muted small">Enter the email you signed up with. We’ll send you a link to choose a new password.</p>}
      {done ? (
        <p className="muted">If an account exists for {email}, you’ll get an email with a reset link. Open it on this device to choose a new password.</p>
      ) : (
        <>
          <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn primary">Send reset link</button>
        </>
      )}
      <Link className="btn ghost" to="/login">Back to log in</Link>
    </form>
  );
}

export function SetNewPassword({ onDone }: { onDone?: () => void } = {}) {
  const { setRecovering } = useAuth();
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setErr("Use at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setErr(error.message);
    setSaved(true);
    setTimeout(() => {
      setRecovering(false);
      onDone?.();
    }, 1200);
  };
  if (saved)
    return (
      <div className="screen">
        <Brand />
        <h1>Password saved</h1>
        <p className="muted">You’re signed in with your new password.</p>
      </div>
    );
  return (
    <form className="screen" onSubmit={submit}>
      <Brand />
      <h1>New password</h1>
      <p className="muted small">Choose a new password with at least 8 characters.</p>
      <label className="field"><span>New password</span><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn primary">Save password</button>
    </form>
  );
}
