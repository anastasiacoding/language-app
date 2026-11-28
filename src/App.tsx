import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { setAnalyticsConsent, track, screenName } from "./lib/analytics";
import { latestConsents } from "./lib/supabase";
import { useAuth } from "./lib/auth";
import { Spinner, TabBar } from "./components/ui";
import About from "./screens/About";
import Install from "./screens/Install";
import { SignUp, LogIn, ResetPassword, SetNewPassword } from "./screens/Auth";
import Library from "./screens/Library";
import AddText from "./screens/AddText";
import Session from "./screens/Session";
import Grammar from "./screens/Grammar";
import Rule from "./screens/Rule";
import Practice from "./screens/Practice";
import Reference from "./screens/Reference";
import Conjugation from "./screens/Conjugation";
import Irregular from "./screens/Irregular";
import Translate from "./screens/Translate";
import Progress from "./screens/Progress";
import MyWords from "./screens/MyWords";
import Review from "./screens/Review";
import Profile from "./screens/Profile";
import Privacy from "./screens/Privacy";
import ConsentHistory from "./screens/ConsentHistory";

const NO_TABS = ["/session", "/review", "/add", "/privacy", "/consents", "/practice"];

export default function App() {
  const { session, loading, recovering } = useAuth();
  const loc = useLocation();
  const uid = session?.user.id;

  // statistics only for people who agreed to them
  useEffect(() => {
    if (!uid) return setAnalyticsConsent(false);
    latestConsents().then((c) => {
      setAnalyticsConsent(!!c.analytics);
      track("page_view", screenName("#" + window.location.hash.slice(1)));
    });
  }, [uid]);
  useEffect(() => {
    track("page_view", screenName("#" + loc.pathname));
  }, [loc.pathname]);

  if (loading)
    return (
      <div className="app" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Spinner />
      </div>
    );

  if (recovering) return <div className="app"><SetNewPassword /></div>;

  if (!session)
    return (
      <div className="app">
        <Routes>
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
        <Route path="/install" element={<Install />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<LogIn />} />
        </Routes>
      </div>
    );

  const showTabs = !NO_TABS.some((p) => loc.pathname.startsWith(p));
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/add" element={<AddText />} />
        <Route path="/session/:id" element={<Session />} />
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/grammar/:id" element={<Rule />} />
        <Route path="/practice/:id" element={<Practice />} />
        <Route path="/reference" element={<Reference />} />
        <Route path="/reference/verb/:verb" element={<Conjugation />} />
        <Route path="/reference/irregular" element={<Irregular />} />
        <Route path="/reference/translate" element={<Translate />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/words" element={<MyWords />} />
        <Route path="/review/:mode" element={<Review />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/install" element={<Install />} />
        <Route path="/consents" element={<ConsentHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
    </div>
  );
}
