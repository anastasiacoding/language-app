// Usage statistics through Google Tag Manager → Google Analytics 4.
// Nothing is loaded and nothing is sent unless the person turned on "Usage statistics" (consent kind "analytics").
// Events carry no name, email or text content: only the event, the screen, and a short detail (a score, a rule id…).

const GTM_ID = "GTM-WX32WCFZ";

type Detail = string | number | undefined;
let enabled = false;
let loaded = false;

function dl(): unknown[] {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}
// gtag-style commands for Consent Mode v2
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  dl().push(arguments);
}

function load() {
  if (loaded) return;
  loaded = true;
  // Consent Mode v2: statistics allowed, everything advertising-related refused.
  gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  gtag("set", { allow_google_signals: false, allow_ad_personalization_signals: false });
  dl().push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

/** Called with the person's current choice (after sign-in, and whenever they change it in Profile). */
export function setAnalyticsConsent(on: boolean) {
  enabled = on;
  if (on) {
    load();
    gtag("consent", "update", { analytics_storage: "granted" });
  } else if (loaded) {
    gtag("consent", "update", { analytics_storage: "denied" });
    // remove the analytics cookies Google set
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim();
      if (name.startsWith("_ga")) {
        for (const domain of ["", location.hostname, "." + location.hostname.split(".").slice(-2).join(".")])
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? "; domain=" + domain : ""}`;
      }
    }
  }
}

/** Sends one event, e.g. track("reading_done", "session", 85). Does nothing without consent. */
export function track(event: string, screen?: string, detail?: Detail) {
  if (!enabled) return;
  dl().push({ event, screen: screen ?? screenName(location.hash), detail: detail === undefined ? undefined : String(detail) });
}

/** "#/session/1f3a…" → "session" — never sends ids or text. */
export function screenName(hash: string) {
  const parts = hash.replace(/^#\/?/, "").split(/[/?]/).filter(Boolean);
  if (!parts.length) return "home";
  const [first, second] = parts;
  if (["grammar", "practice"].includes(first) && second) return `${first}/${second}`; // rule ids are public, e.g. grammar/y-en
  return first;
}
