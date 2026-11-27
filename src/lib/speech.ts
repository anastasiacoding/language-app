// Thin wrapper around the browser's Web Speech API.
// Chrome/Android uses Google's service; Safari/iOS uses Apple's. We only ever receive text.

export function speechSupported(): boolean {
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface Recorder {
  /** Stops listening and resolves with everything heard, waiting briefly for the last words. */
  stop: () => Promise<string>;
  /** Stops immediately and throws away what was heard. */
  abort: () => void;
}

interface Handlers {
  onUpdate: (finalText: string, interim: string) => void;
  /** A real problem the person has to know about (blocked microphone, no internet…). */
  onError?: (msg: string) => void;
  /** The browser stopped listening on its own and can’t be restarted: finish with what was heard. */
  onAutoEnd?: () => void;
}

// Only one recognizer may run at a time: a forgotten one keeps the microphone busy.
let active: Recorder | null = null;

/**
 * Starts continuous recognition. Calls onUpdate(finalText, interimText) as words arrive.
 * Restarts quietly when the browser stops after a pause, until stop() or abort() is called.
 */
export function startRecognition(lang: string, onUpdate: Handlers["onUpdate"], onError?: Handlers["onError"], onAutoEnd?: Handlers["onAutoEnd"]): Recorder {
  active?.abort();
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  let finalText = "";
  let interim = "";
  let stopped = false;
  let rec: any = null;
  let endWaiter: (() => void) | null = null;
  let segments = 0; // how many times the browser has been (re)started
  let quietRestarts = 0; // restarts in a row without hearing anything

  const heardSomething = () => (finalText + interim).trim().length > 0;

  const fail = (msg: string) => {
    stopped = true;
    try {
      rec?.abort();
    } catch {
      /* already stopped */
    }
    endWaiter?.();
    onError?.(msg);
  };
  const autoEnd = () => {
    stopped = true;
    endWaiter?.();
    onAutoEnd?.();
  };

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
      quietRestarts = 0;
      onUpdate(finalText, interim);
    };
    rec.onerror = (e: any) => {
      if (stopped) return;
      switch (e.error) {
        case "no-speech":
        case "aborted":
          return; // onend follows and restarts
        case "not-allowed":
        case "service-not-allowed":
          // On iPhone a restart after a pause is sometimes refused: that isn't a blocked microphone.
          if (segments > 1) return autoEnd();
          return fail("Microphone access was blocked. Allow it for this site in your browser settings, then try again.");
        case "audio-capture":
          return fail("The microphone is busy or unavailable. Close other apps that use it and try again.");
        case "network":
          return heardSomething() ? autoEnd() : fail("Speech recognition needs an internet connection. Check your connection and try again.");
        default:
          return heardSomething() ? autoEnd() : fail("Recording stopped unexpectedly. Tap the microphone to try again.");
      }
    };
    rec.onend = () => {
      // Safari sometimes never marks the last words as final: keep them.
      if (interim) {
        finalText += (finalText ? " " : "") + interim;
        interim = "";
        onUpdate(finalText, "");
      }
      if (stopped) {
        endWaiter?.();
        return;
      }
      if (++quietRestarts > 6) return autoEnd(); // long silence: stop instead of restarting forever
      setTimeout(() => {
        if (stopped) return;
        try {
          segments++;
          begin();
        } catch {
          autoEnd();
        }
      }, 200);
    };
    rec.start();
  };

  const recorder: Recorder = {
    stop: () =>
      new Promise<string>((resolve) => {
        const done = () => {
          endWaiter = null;
          if (active === recorder) active = null;
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
    abort: () => {
      stopped = true;
      endWaiter?.();
      if (active === recorder) active = null;
      try {
        rec?.abort();
      } catch {
        /* already stopped */
      }
    },
  };
  active = recorder;

  try {
    segments = 1;
    begin();
  } catch {
    fail("Could not start the microphone. Close other apps that use it and try again.");
  }
  return recorder;
}
