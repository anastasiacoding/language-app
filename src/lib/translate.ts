// Free machine translation through the MyMemory API (Translated srl, Italy).
// Only the text to translate is sent: never names, emails or account data.

const cache = new Map<string, string>();

export async function translateFrEn(text: string): Promise<string> {
  const q = text.trim().slice(0, 480);
  if (!q) return "";
  if (cache.has(q)) return cache.get(q)!;
  const url = `https://api.mymemory.translated.net/get?langpair=fr|en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation service unavailable");
  const json = await res.json();
  const t: string = json?.responseData?.translatedText ?? "";
  if (!t || /MYMEMORY WARNING/i.test(t)) throw new Error("Daily translation limit reached. Try again tomorrow.");
  const clean = t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  cache.set(q, clean);
  return clean;
}

/** Translates long text in sentence-sized chunks. */
export async function translateLong(text: string): Promise<string> {
  if (text.length <= 480) return translateFrEn(text);
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const p of parts) {
    if ((buf + p).length > 450) {
      out.push(await translateFrEn(buf));
      buf = "";
    }
    buf += p;
  }
  if (buf.trim()) out.push(await translateFrEn(buf));
  return out.join(" ");
}
