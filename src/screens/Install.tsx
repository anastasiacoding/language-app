import { useEffect, useState } from "react";
import { Header, Seg } from "../components/ui";

type Platform = "iphone" | "android" | "computer";

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  if (/Android/.test(ua)) return "android";
  return "computer";
}
const isInstalled = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;

// Android Chrome / Edge offer their own install prompt; we keep it to show a one-tap button.
let deferred: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
});

const STEPS: Record<Platform, { browser: string; steps: string[] }[]> = {
  iphone: [
    { browser: "Safari", steps: ["Open frenchlion.app in Safari.", "Tap the Share button: the square with an arrow pointing up, at the bottom of the screen (at the top on iPad).", "Scroll down and tap “Add to Home Screen”.", "Tap “Add”. The lion appears on your home screen."] },
    { browser: "Chrome, Edge or Firefox", steps: ["Open frenchlion.app.", "Tap the Share button in the address bar (in Chrome, at the top right).", "Tap “Add to Home Screen”, then “Add”.", "This works on iOS 16.4 and newer. On older iPhones, use Safari."] },
  ],
  android: [
    { browser: "Chrome", steps: ["Open frenchlion.app in Chrome.", "Tap the menu ⋮ at the top right.", "Tap “Install app” or “Add to Home screen”.", "Confirm with “Install”."] },
    { browser: "Samsung Internet", steps: ["Open frenchlion.app.", "Tap the menu ☰ at the bottom right.", "Tap “Add page to”, then “Home screen”."] },
    { browser: "Firefox", steps: ["Open frenchlion.app.", "Tap the menu ⋮.", "Tap “Install” (or “Add to Home screen”), then confirm."] },
  ],
  computer: [
    { browser: "Chrome or Edge", steps: ["Open frenchlion.app.", "Click the install icon at the right end of the address bar (a screen with a down arrow), or open the menu ⋮ → “Cast, save and share” → “Install page as app”.", "Click “Install”. French Lion opens in its own window."] },
    { browser: "Safari on Mac", steps: ["Open frenchlion.app.", "In the menu bar choose File → “Add to Dock”.", "Click “Add”."] },
  ],
};

export default function Install() {
  const [p, setP] = useState<Platform>(detect);
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [installed, setInstalled] = useState(isInstalled());

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      deferred = e;
      setCanPrompt(true);
    };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", on);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    if (r?.outcome === "accepted") setInstalled(true);
    deferred = null;
    setCanPrompt(false);
  };

  return (
    <div className="screen">
      <Header title="Install on your phone" />
      <p className="small">French Lion is coming soon to the App Store and Google Play. Until then, add it to your home screen: it opens full screen, like a regular app, and it’s free.</p>

      {installed ? (
        <div className="card tint"><b>It’s installed 🎉</b><p className="small" style={{ margin: 0 }}>Open French Lion from your home screen. You’ll need to log in once more there.</p></div>
      ) : (
        canPrompt && <button className="btn primary" onClick={install}>Install French Lion</button>
      )}

      <Seg items={[{ id: "iphone", label: "iPhone" }, { id: "android", label: "Android" }, { id: "computer", label: "Computer" }]} value={p} onChange={setP} />

      {STEPS[p].map((b) => (
        <div className="card" key={b.browser}>
          <b>{b.browser}</b>
          <ol className="small" style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {b.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
      ))}

      <p className="xs muted">After installing, open French Lion from the new icon and log in once more: the home-screen app keeps its own sign-in, separate from the browser.</p>
    </div>
  );
}
