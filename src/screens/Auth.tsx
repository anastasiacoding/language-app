import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { supabaseLinks } from "../lib/supabase";
import { Seg } from "../components/ui";

const redirectTo = () => window.location.origin + window.location.pathname;
const standalone = typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);

function Brand() {
  return <img src={import.meta.env.BASE_URL + "app-icon.svg"} width={64} height={64} alt="" style={{ borderRadius: 16 }} />;
}

/** Compact header for the log-in and sign-up screens, with a switch between them right at the top. */
function AuthTop({ mode }: { mode: "login" | "signup" }) {
  const nav = useNavigate();
  return (
    <>
      <div className="row" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <img src={import.meta.env.BASE_URL + "app-icon.svg"} width={44} height={44} alt="" style={{ borderRadius: 12 }} />
        <b style={{ fontSize: 20 }}>French Lion</b>
      </div>
      <div data-nosnippet style={{ display: "contents" }}>
        <Seg items={[{ id: "login", label: "Log in" }, { id: "signup", label: "Create account" }]} value={mode} onChange={(m: string) => nav(m === "login" ? "/" : "/signup", { replace: true })} />
      </div>
    </>
  );
}

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [voice, setVoice] = useState(true);
  const [news, setNews] = useState(false);
  const [stats, setStats] = useState(false);
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
    const { data, error } = await supabaseLinks.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo(),
        data: { name: name.trim(), consents: { age, terms, voice, newsletter: news, analytics: stats } },
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (!data.session) setSent(true);
    else await supabase.auth.setSession(data.session); // email confirmation turned off: sign in right away
  };

  if (sent)
    return (
      <div className="screen">
        <Brand />
        <h1>Check your email</h1>
        <p className="muted">We sent a confirmation link to {email}. Open it to finish creating your account.</p>
        <Link className="btn" to="/login">Go to log in</Link>
      </div>
    );

  return (
    <form className="screen" onSubmit={submit}>
      <AuthTop mode="signup" />
      <h1>Bienvenue !</h1>
      <p className="muted small">Yet another language app, except this one is free. Read French out loud, drill grammar rules, and check noun genders and verb conjugations, at your own pace.</p>
      <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" /></label>
      <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="field"><span>Password</span><input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
      <div className="card" style={{ gap: 14 }}>
        <label className="check"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /><span className="small">I’m 15 or older<br /><span className="xs" style={{ color: "var(--scarlet)" }}>required</span></span></label>
        <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="small">I accept the Terms of Use and <Link to="/privacy">Privacy Policy</Link><br /><span className="xs" style={{ color: "var(--scarlet)" }}>required</span></span></label>
        <label className="check"><input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /><span className="small">Process my voice to score reading and translation. Recordings are never stored<br /><span className="xs muted">optional · needed for speaking exercises</span></span></label>
        <label className="check"><input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} /><span className="small">Email me product news<br /><span className="xs muted">optional</span></span></label>
        <label className="check"><input type="checkbox" checked={stats} onChange={(e) => setStats(e.target.checked)} /><span className="small">Share anonymous usage statistics (Google Analytics) to help improve the app<br /><span className="xs muted">optional · uses analytics cookies</span></span></label>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      <p className="center small muted">Already have an account? <Link to="/" style={{ fontWeight: 600 }}>Log in</Link></p>
      <p className="center xs"><Link to="/about" style={{ color: "var(--muted)" }}>About the app</Link></p>
    </form>
  );
}

export function LogIn() {
  const { linkError, setLinkError } = useAuth();
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
      <AuthTop mode="login" />
      <p className="small muted" style={{ margin: 0 }}>Welcome to yet another language app, except this one is free. Read French out loud, drill grammar rules, and check noun genders and verb conjugations, at your own pace.</p>
      {linkError && (
        <div className="card" style={{ borderColor: "var(--scarlet)", gap: 8 }}>
          <p className="small" style={{ margin: 0 }}>{linkError}</p>
          <Link className="btn sm" to="/reset" onClick={() => setLinkError("")}>Send a new link</Link>
        </div>
      )}
      {/* data-nosnippet: search engines describe the app, not the login form */}
      <div data-nosnippet style={{ display: "contents" }}>
      <h1>Bon retour !</h1>
      <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="field"><span>Password</span><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <Link className="btn ghost" to="/reset">Forgot password?</Link>
      <p className="center small muted">New here? <Link to="/signup" style={{ fontWeight: 600 }}>Create an account</Link></p>
      </div>

      {!standalone && (
        <div className="card tint" style={{ marginTop: 6, gap: 6 }}>
          <b className="small">Coming soon to the App Store and Google Play</b>
          <p className="small" style={{ margin: 0 }}>For now, add French Lion to your phone’s home screen: it opens like a regular app. <Link to="/install" style={{ fontWeight: 600 }}>How to install</Link></p>
        </div>
      )}
      <ExploreLinks />
    </form>
  );
}

/** Real links to the open pages: a menu for visitors, search engines and AI assistants. */
export function ExploreLinks() {
  const base = import.meta.env.BASE_URL;
  const links: [string, string][] = [[base + "grammar/", "French grammar A1–B2"], [base + "read-french-aloud/", "Read French aloud"], [base + "free-french-books/", "Free French books"]];
  return (
    <nav aria-label="Explore" className="center xs" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px" }}>
      {links.map(([href, label]) => <a key={href} href={href} style={{ color: "var(--muted)" }}>{label}</a>)}
      <Link to="/about" style={{ color: "var(--muted)" }}>About the app</Link>
    </nav>
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
    const { error } = await supabaseLinks.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo() });
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
