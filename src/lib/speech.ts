// Thin wrapper around the browser's Web Speech API.
// Chrome/Android uses Google's service; Safari/iOS uses Apple's. We only ever receive text.

type Rec = any;

export function speechSupported(): boolean {
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface Recorder {
  stop: () => void;
}

/**
 * Starts continuous recognition. Calls onUpdate(finalText, interimText) as words arrive.
 * Restarts automatically if the browser stops after a pause, until stop() is called.
 */
export function startRecognition(
  lang: string,
  onUpdate: (finalText: string, interim: string) => void,
  onError?: (msg: string) => void,
): Recorder {
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  let finalText = "";
  let stopped = false;
  let rec: Rec = null;

  const begin = () => {
    rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += (finalText ? " " : "") + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      onUpdate(finalText, interim.trim());
    };
    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        onError?.("Microphone access was blocked. Allow it in your browser settings and try again.");
        return;
      }
      onError?.("Speech recognition error: " + e.error);
    };
    rec.onend = () => {
      if (!stopped) {
        try {
          begin();
        } catch {
          /* ignore */
        }
      }
    };
    rec.start();
  };

  try {
    begin();
  } catch (e: any) {
    onError?.("Could not start the microphone.");
  }

  return {
    stop: () => {
      stopped = true;
      try {
        rec?.stop();
      } catch {
        /* ignore */
      }
    },
  };
}

export function speak(text: string, lang = "fr-FR") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
