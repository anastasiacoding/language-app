import { Header } from "../components/ui";

// Keep in sync with the Privacy Policy document. Fill in the controller details before publishing.
const CONTROLLER = "[Controller name]";
const CONTACT = "[privacy contact email]";

export default function Privacy() {
  return (
    <div className="screen prose">
      <Header title="Privacy policy" />
      <p className="xs muted">Last updated: 21 November 2026 · Test version</p>
      <p>We collect only what the app needs to help you learn French, we never sell your data, and we show no ads.</p>

      <h2>Who we are</h2>
      <p>The data controller is {CONTROLLER}. Contact for privacy questions: {CONTACT}.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> name, email, password (stored only as a secure hash).</li>
        <li><b>Learning content:</b> texts you add, saved words, favorite rules and verbs, daily goal.</li>
        <li><b>Learning results:</b> reading, translation and retelling scores, session dates and length.</li>
        <li><b>Consents:</b> what you agreed to or withdrew, and when.</li>
        <li><b>Technical:</b> IP address and browser data in our providers’ security logs.</li>
      </ul>
      <p>We do not store voice recordings or the photos you scan.</p>

      <h2>Why, and on what legal basis</h2>
      <ul>
        <li>Running your account and saving your progress: performance of a contract (GDPR Art. 6(1)(b)).</li>
        <li>Voice scoring and product news emails: your consent (Art. 6(1)(a)), which you can withdraw in Profile at any time.</li>
        <li>Security and fixing errors: our legitimate interest (Art. 6(1)(f)).</li>
        <li>Keeping a record of consents: legal obligation (Art. 6(1)(c)).</li>
      </ul>

      <h2>Voice, photos and translation</h2>
      <ul>
        <li><b>Voice:</b> your device’s speech recognition turns speech into text: Apple on iPhone and Safari, Google in Chrome and on Android, which may send audio to Google’s servers. We receive only the text.</li>
        <li><b>Photos:</b> text recognition runs on your device. The image never leaves your phone. The recognition model files are downloaded from the jsDelivr network the first time.</li>
        <li><b>Free books:</b> when you search Wikisource or Project Gutenberg, our server fetches the book for you, so these sites don’t see your IP address. Gallica opens in your own browser.</li>
        <li><b>Translation:</b> to translate and score your translations we send the French text (never your name or email) to MyMemory, operated by Translated srl in Italy.</li>
      </ul>

      <h2>Who processes data for us</h2>
      <ul>
        <li><b>Supabase</b>: database and sign-in, EU (Frankfurt, Germany).</li>
        <li><b>GitHub Pages</b>: hosts the app files, United States (EU–US Data Privacy Framework).</li>
        <li><b>MyMemory (Translated srl)</b>: machine translation, Italy.</li>
        <li><b>Apple or Google</b>: speech recognition on your device.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>Until you delete your account; then it is deleted immediately from the database and from backups within 30 days. Technical logs are kept by our providers for up to 90 days.</p>

      <h2>Your rights</h2>
      <ul>
        <li>Download all your data: Profile → Download my data.</li>
        <li>Delete everything: Profile → Delete account and all data.</li>
        <li>Withdraw consent: switch it off in Profile.</li>
        <li>Access, rectification, restriction and objection: write to {CONTACT}.</li>
        <li>Complain to the CNIL (cnil.fr) or your local data protection authority.</li>
      </ul>

      <h2>Age and storage</h2>
      <p>The app is for people aged 15 and over. It stores a sign-in token and a few settings in your browser so you stay signed in. These are strictly necessary. We use no tracking or advertising cookies.</p>
    </div>
  );
}
