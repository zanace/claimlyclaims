import { ArrowRight, ExternalLink, FileText } from "lucide-react";
import { useMemo } from "react";
import { PROGRAMS } from "@/lib/programs";
import { officialSourceFor } from "@/lib/official-links";

export type ApplyTarget = { id: string; name: string; estimate?: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Words that are too generic to identify a program on their own. */
const STOP = new Set([
  "the", "and", "for", "with", "your", "you", "program", "programs", "benefit",
  "benefits", "assistance", "help", "fund", "funds", "credit", "credits",
  "state", "federal", "local", "county", "support", "services", "service",
  "food", "cash", "housing", "health", "care", "tax", "free", "low", "income",
]);

/** Acronyms (SNAP, WIC, LIHEAP...) are assigned to the single shortest-named program that owns them. */
const ACRONYMS: Map<string, ApplyTarget> = (() => {
  const map = new Map<string, { name: string; target: ApplyTarget }>();
  for (const p of PROGRAMS) {
    const tokens = p.name.match(/\b[A-Z][A-Za-z0-9-]{1,}\b/g) ?? [];
    for (const raw of tokens) {
      const token = raw.replace(/-/g, "");
      if (token.length < 3 || token !== token.toUpperCase()) continue;
      const key = token.toLowerCase();
      const existing = map.get(key);
      if (!existing || p.name.length < existing.name.length) {
        map.set(key, { name: p.name, target: { id: p.id, name: p.name, estimate: p.estimate } });
      }
    }
  }
  return new Map([...map].map(([k, v]) => [k, v.target]));
})();

/** Distinctive lowercase phrase for each program, e.g. "rental assistance" -> matched literally. */
function phraseFor(name: string) {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\b(program|programs|benefits|benefit|assistance)\b\s*$/g, "")
    .trim();
}

/** Finds programs the assistant actually named in a message, so we can offer a real Apply button. */
export function programsMentioned(text: string): ApplyTarget[] {
  if (!text) return [];
  const hay = text.toLowerCase();
  const found: ApplyTarget[] = [];
  const push = (t: ApplyTarget) => {
    if (!found.some((f) => f.id === t.id)) found.push(t);
  };

  // 1. Acronyms named in the message (SNAP, WIC, EITC, LIHEAP, TANF, SSI...).
  for (const [key, target] of ACRONYMS) {
    if (new RegExp(`\\b${escapeRe(key)}\\b`, "i").test(hay)) push(target);
    if (found.length >= 3) return found;
  }

  // 2. Full-phrase name matches.
  for (const p of PROGRAMS) {
    const phrase = phraseFor(p.name);
    if (phrase.length > 6 && !STOP.has(phrase) && hay.includes(phrase)) {
      push({ id: p.id, name: p.name, estimate: p.estimate });
    }
    if (found.length >= 3) break;
  }
  return found;
}

export function ChatApplyActions({
  text,
  onApply,
  compact,
}: {
  text: string;
  onApply: (program: ApplyTarget) => void;
  compact?: boolean;
}) {
  const targets = useMemo(() => programsMentioned(text), [text]);
  if (!targets.length) return null;

  return (
    <div className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
      {targets.map((p) => {
        const official = officialSourceFor(`${p.id} ${p.name}`);
        return (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-background/60 p-3"
          >
            <p className="text-xs font-semibold">
              {p.name.replace(/\s*\([^)]*\)\s*/g, " ").trim()}
              {p.estimate ? <span className="ml-1 font-normal text-muted-foreground">· {p.estimate}</span> : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onApply(p)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
              >
                Apply here
                <ArrowRight className="size-3.5" />
              </button>
              <a
                href={official.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold transition hover:border-primary"
              >
                <ExternalLink className="size-3.5" />
                Official form
              </a>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <FileText className="mt-0.5 size-3 shrink-0" />
              <span>
                <span className="font-medium">{official.label}.</span> Bring: {official.docs.join(", ")}.
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
