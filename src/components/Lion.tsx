// The app's lion. Its mood follows your streak: happy, neutral, sad, and a drooping mane after 3 missed days.
export type Mood = "happy" | "neutral" | "sad" | "droopy";

const MANE_OUTER = "M256.0 126.0 L274.2 177.3 L306.1 133.2 L309.2 187.6 L352.2 154.3 L339.8 207.3 L390.5 187.4 L363.7 234.8 L417.9 230.1 L378.8 267.9 L432.2 278.7 L384.0 304.0 L432.2 329.3 L378.8 340.1 L417.9 377.9 L363.7 373.2 L390.5 420.6 L339.8 400.7 L352.2 453.7 L309.2 420.4 L306.1 474.8 L274.2 430.7 L256.0 482.0 L237.8 430.7 L205.9 474.8 L202.8 420.4 L159.8 453.7 L172.2 400.7 L121.5 420.6 L148.3 373.2 L94.1 377.9 L133.2 340.1 L79.8 329.3 L128.0 304.0 L79.8 278.7 L133.2 267.9 L94.1 230.1 L148.3 234.8 L121.5 187.4 L172.2 207.3 L159.8 154.3 L202.8 187.6 L205.9 133.2 L237.8 177.3Z";
const MANE_INNER = "M266.7 154.4 L279.8 194.6 L308.4 163.5 L309.7 205.7 L345.9 183.9 L335.2 224.8 L376.1 214.1 L354.3 250.3 L396.5 251.6 L365.4 280.2 L405.6 293.3 L367.7 312.0 L402.6 335.9 L360.9 343.1 L387.7 375.9 L345.7 371.1 L362.1 410.1 L323.1 393.7 L327.9 435.7 L295.1 408.9 L287.9 450.6 L264.0 415.7 L245.3 453.6 L232.2 413.4 L203.6 444.5 L202.3 402.3 L166.1 424.1 L176.8 383.2 L135.9 393.9 L157.7 357.7 L115.5 356.4 L146.6 327.8 L106.4 314.7 L144.3 296.0 L109.4 272.1 L151.1 264.9 L124.3 232.1 L166.3 236.9 L149.9 197.9 L188.9 214.3 L184.1 172.3 L216.9 199.1 L224.1 157.4 L248.0 192.3Z";

export function Lion({ mood, size = 160 }: { mood: Mood; size?: number }) {
  const sad = mood === "sad" || mood === "droopy";
  const droopy = mood === "droopy";
  return (
    <svg className={"lion lion-" + mood} width={size} height={size} viewBox="60 108 392 392" style={{ overflow: "visible", flexShrink: 0 }} role="img" aria-label={`Your lion looks ${mood === "happy" ? "happy" : mood === "neutral" ? "a bit bored" : mood === "sad" ? "sad" : "very sad"}`}>
      <g className="lion-body">
        <g className="lion-mane">
          <path d={MANE_OUTER} fill={droopy ? "#8E7550" : "#B07A2A"} stroke={droopy ? "#8E7550" : "#B07A2A"} strokeWidth="10" strokeLinejoin="round" />
          <path d={MANE_INNER} fill={droopy ? "#A68B5E" : "#C9933A"} stroke={droopy ? "#A68B5E" : "#C9933A"} strokeWidth="8" strokeLinejoin="round" />
        </g>
        <path d="M256 200 C316 200 348 244 346 300 C344 356 306 398 256 404 C206 398 168 356 166 300 C164 244 196 200 256 200 Z" fill={droopy ? "#D9B46E" : "#E6B65A"} />
        {/* brows */}
        <path className="lion-fade" d={sad ? "M198 276 C210 268 226 262 238 258" : "M196 270 C210 258 228 258 238 268"} stroke="#7A4E1C" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path className="lion-fade" d={sad ? "M314 276 C302 268 286 262 274 258" : "M316 270 C302 258 284 258 274 268"} stroke="#7A4E1C" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* eyes */}
        <g className="lion-eyes">
          <path d="M204 292 C214 282 228 282 236 292 C228 300 214 300 204 292 Z" fill="#2B1D18" />
          <path d="M308 292 C298 282 284 282 276 292 C284 300 298 300 308 292 Z" fill="#2B1D18" />
        </g>
        {droopy && (
          <g>
            <path d="M200 291 C212 280 228 280 240 291 Z" fill="#D9B46E" />
            <path d="M312 291 C300 280 284 280 272 291 Z" fill="#D9B46E" />
          </g>
        )}
        <path d="M256 300 L256 322" stroke="#B88638" strokeWidth="5" strokeLinecap="round" />
        <path d="M226 356 C226 334 286 334 286 356 C286 378 226 378 226 356 Z" fill="#F4DDA2" />
        <path d="M238 324 L274 324 C274 338 266 346 256 348 C246 346 238 338 238 324 Z" fill="#2B1D18" />
        {/* mouth */}
        <path d="M256 348 L256 360" stroke="#2B1D18" strokeWidth="6" strokeLinecap="round" />
        {mood === "happy" && <path d="M228 362 C240 378 252 374 256 362 C260 374 272 378 284 362" stroke="#2B1D18" strokeWidth="6" strokeLinecap="round" fill="none" />}
        {mood === "neutral" && <path d="M234 366 L278 366" stroke="#2B1D18" strokeWidth="6" strokeLinecap="round" />}
        {sad && <path d="M230 376 C242 362 270 362 282 376" stroke="#2B1D18" strokeWidth="6" strokeLinecap="round" fill="none" />}
      </g>
    </svg>
  );
}
