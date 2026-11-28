import { Link } from "react-router-dom";
import { Header } from "../components/ui";
import { Lion } from "../components/Lion";

export const APP_NAME = "French Lion";
export const FEEDBACK_URL = "mailto:hello@frenchlion.app?subject=" + encodeURIComponent("French Lion feedback");

export default function About() {
  return (
    <div className="screen prose">
      <Header title="About the app" />
      <div className="stack" style={{ alignItems: "center", gap: 6, margin: "4px 0 8px" }}>
        <Lion mood="happy" size={96} />
        <h2 style={{ margin: 0 }}>{APP_NAME}</h2>
        <p className="small muted center" style={{ margin: 0 }}>Practice French. Make yourself proud.</p>
      </div>

      <h2>Why this app exists</h2>
      <p>Sometimes the simplest things are the hardest to keep doing: reading a page out loud, remembering whether it’s <i>le</i> or <i>la</i>, or which tense goes where. {APP_NAME} was made to turn those small things into a calm daily habit.</p>

      <h2>What you can do</h2>
      <ul>
        <li><b>Texts.</b> Add any French text: a photo of a book page, a screenshot, a link or a paste. Read it aloud and get a pronunciation score, translate it by voice, then retell it in your own words.</li>
        <li><b>Grammar.</b> Browse the rules and practice them endlessly, with lots of words. No lessons to finish, no levels to unlock. Just practice until the rule sticks.</li>
        <li><b>Check.</b> Forgot an article or a conjugation? Look up a noun’s gender, conjugate any verb in every tense, or translate a word in seconds.</li>
        <li><b>Progress.</b> See your scores over time, the words that tripped you up, and your streak.</li>
      </ul>

      <h2>Your lion</h2>
      <p>The lion is all about pride. Practice every day and it smiles. Skip a few days and it gets a little sad, until you come back. Make yourself proud!</p>

      <h2>Free and private</h2>
      <p>{APP_NAME} is a personal, non-commercial project: free, with no ads. It uses free and openly licensed resources (Wiktionary, Lexique, Wikisource) and keeps only what it needs to save your progress. <Link to="/privacy">Privacy policy</Link></p>

      <h2>On your phone</h2>
      <p>{APP_NAME} is coming soon to the App Store and Google Play. Until then, you can add it to your home screen and use it like an app. <Link to="/install">How to install</Link></p>

      <h2>Tell me what you think</h2>
      <p>Something not working, a word that’s wrong, an idea for a new exercise? <a href={FEEDBACK_URL}>Send feedback</a> and I’ll read every message.</p>
    </div>
  );
}
