import { supabase } from "./supabase";

export type Source = "wikisource" | "gutenberg";
export interface BookHit {
  id: string;
  title: string;
  author: string;
  year: string;
}
export interface Chapter {
  id?: string; // remote id (Wikisource sub-page)
  title: string;
  text?: string; // local text (split from a long book)
}
export type Opened = { kind: "text"; title?: string; text: string; note?: string } | { kind: "chapters"; title: string; chapters: { id: string; title: string }[] };

async function call<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("books", { body });
  if (error) {
    let msg = "The book service isn’t answering. Try again in a moment.";
    try {
      const j = await (error as any).context?.json?.();
      if (j?.error) msg = j.error;
    } catch {
      /* keep default message */
    }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const searchBooks = (source: Source, q: string) => call<{ results: BookHit[] }>({ action: "search", source, q }).then((r) => r.results);
export const openBook = (source: Source, id: string) => call<Opened>({ action: "open", source, id });
export const openLink = (url: string) => call<Opened>({ action: "url", id: url });
export const checkGrammar = (text: string) => call<{ issues: { message: string; text: string; fix: string[] }[] }>({ action: "grammar", q: text }).then((r) => r.issues);
export const sourceStatus = () => call<{ gutenberg: boolean }>({ action: "status" });

const MAX_CHUNK = 45000;

/** Splits a long book into chapters by headings, or into parts of about 8,000 characters. */
export function splitChapters(text: string): Chapter[] {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const isHeading = (p: string) =>
    p.length < 90 && (/^(chapitre|livre|partie|tome|acte|scène|conte|épisode)\b/i.test(p) || /^[IVXLC]{1,7}\.?$/.test(p) || /^\d{1,3}\.?$/.test(p));
  const idx = paras.map((p, i) => (isHeading(p) ? i : -1)).filter((i) => i >= 0);
  const out: Chapter[] = [];
  if (idx.length >= 3) {
    if (idx[0] > 0) {
      const pre = paras.slice(0, idx[0]).join("\n\n");
      if (pre.length > 800) out.push({ title: "Opening", text: pre });
    }
    idx.forEach((start, k) => {
      const end = k + 1 < idx.length ? idx[k + 1] : paras.length;
      let title = paras[start];
      let bodyStart = start + 1;
      if (/^([IVXLC]+|\d+)\.?$/.test(title) && paras[start + 1] && paras[start + 1].length < 90) {
        title = `${title}. ${paras[start + 1]}`;
        bodyStart++;
      }
      const body = paras.slice(bodyStart, end).join("\n\n");
      if (body.length > 200) out.push({ title, text: body });
    });
  }
  if (out.length < 2) {
    out.length = 0;
    let buf: string[] = [];
    let len = 0;
    for (const p of paras) {
      buf.push(p);
      len += p.length;
      if (len > 8000) {
        out.push({ title: `Part ${out.length + 1}`, text: buf.join("\n\n") });
        buf = [];
        len = 0;
      }
    }
    if (buf.length) out.push({ title: `Part ${out.length + 1}`, text: buf.join("\n\n") });
  }
  return out.map((c) => ({ ...c, text: c.text!.slice(0, MAX_CHUNK) }));
}

export function gallicaSearchUrl(q: string) {
  const query = `(gallica all "${q.replace(/"/g, "")}") and dc.language all "fre" and ocr.quality all "Texte disponible"`;
  return `https://gallica.bnf.fr/services/engine/search/sru?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(query)}`;
}

/** Turns a Gallica document link into its plain-text view, which the reader can copy. */
export function gallicaTextUrl(link: string): string | null {
  const m = link.match(/ark:\/12148\/[a-z0-9]+/i);
  return m ? `https://gallica.bnf.fr/${m[0]}.texteBrut` : null;
}
