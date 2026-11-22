// Thin wrapper around the browser's Web Speech API.
// Chrome/Android uses Google's service; Safari/iOS uses Apple's. We only ever receive text.

export function speechSupported(): boolean {
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface Recorder {
  /** Stops listening and resolves with everything heard, waiting briefly for the last words. */
  stop: () => Promise<string>;
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
  let interim = "";
  let stopped = false;
  let rec: any = null;
  let endWaiter: (() => void) | null = null;

  const begin = () => {
    rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += (finalText ? " " : "") + r[0].transcript.trim();
        else live += r[0].transcript;
      }
      interim = live.trim();
      onUpdate(finalText, interim);
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
      if (stopped) {
        endWaiter?.();
        return;
      }
      try {
        begin();
      } catch {
        /* ignore */
      }
    };
    rec.start();
  };

  try {
    begin();
  } catch {
    onError?.("Could not start the microphone.");
  }

  return {
    stop: () =>
      new Promise<string>((resolve) => {
        const done = () => {
          endWaiter = null;
          resolve((finalText + " " + interim).trim());
        };
        if (stopped) return done();
        stopped = true;
        endWaiter = done;
        // Safari often delivers the last words only after stop(), so wait for onend (max 1.5 s).
        setTimeout(() => endWaiter && done(), 1500);
        try {
          rec?.stop();
        } catch {
          done();
        }
      }),
  };
}
