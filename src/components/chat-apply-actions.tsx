import { ListChecks, FileText, ArrowRight, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { PROGRAMS } from "@/lib/programs";
import { officialSourceFor } from "@/lib/official-links";
import { OfficialGuide } from "@/components/official-guide";
import { screenProgram, type Signals } from "@/lib/eligibility";
import { logContradiction } from "@/lib/tracker";
import { useEffect } from "react";

export type Confidence = "strong" | "maybe" | "not_fit";
export type ApplyTarget = {
  id: string;
  name: string;
  estimate?: string;
  confidence: Confidence;
  reason?: string;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Words that are too generic to identify a program on their own. */
const STOP = new Set([
  "the", "and", "for", "with", "your", "you", "program", "programs", "benefit",
  "benefits", "assistance", "help", "fund", "funds", "credit", "credits",
  "state", "federal", "local", "county", "support", "services", "service",
  "food", "cash", "housing", "health", "care", "tax", "free", "low", "income",
]);

type AcronymTarget = Omit<ApplyTarget, "confidence">;

/** Acronyms (SNAP, WIC, LIHEAP...) are assigned to the single shortest-named program that owns them. */
const ACRONYMS: Map<string, AcronymTarget> = (() => {
  const map = new Map<string, { name: string; target: AcronymTarget }>();
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

/** Classifies a window of text near a program mention. */
function classifyConfidence(chunk: string): Confidence {
  const s = chunk.toLowerCase();
  // Explicit "not a fit" signals take priority.
  if (
    /\bnot (?:a )?(?:good )?(?:fit|match)\b/.test(s) ||
    /\b(?:won'?t|does(?:n'?t| not)|do(?:es)? not) (?:qualify|be eligible|meet)\b/.test(s) ||
    /\b(?:above|over|exceeds?) (?:the )?(?:income )?(?:limit|threshold|cap|cutoff)\b/.test(s) ||
    /\bincome (?:is )?(?:too high|above)\b/.test(s) ||
    /\btoo (?:high|much) (?:for|to qualify)\b/.test(s) ||
    /\bunlikely to qualify\b/.test(s) ||
    /\bprobably (?:won'?t|will not|not)\b/.test(s) ||
    /\bskip\b|\bnot recommended\b/.test(s)
  ) return "not_fit";
  if (
    /\bstrong fit\b/.test(s) ||
    /\byou (?:likely )?qualify\b/.test(s) ||
    /\bclearly (?:qualify|eligible)\b/.test(s)
  ) return "strong";
  if (
    /\bmaybe(?: a)? (?:good )?fit\b/.test(s) ||
    /\bpossible fit\b/.test(s) ||
    /\bworth checking\b/.test(s) ||
    /\bmight\b|\bmaybe\b|\bcould\b|\bnear (?:the )?(?:limit|cutoff)\b/.test(s)
  ) return "maybe";
  return "strong";
}

/** Finds programs the assistant actually named in a message, tagged with confidence
 *  based on nearby wording. Uses a per-mention window instead of a whole paragraph
 *  so a "not a fit" verdict about one program can't taint siblings in the same chunk. */
export function programsMentioned(text: string): ApplyTarget[] {
  if (!text) return [];
  const found = new Map<string, ApplyTarget>();
  const tryAdd = (t: Omit<ApplyTarget, "confidence">, conf: Confidence) => {
    const existing = found.get(t.id);
    // Priority: not_fit > strong > maybe (an explicit not-a-fit verdict wins).
    const rank = { not_fit: 3, strong: 2, maybe: 1 } as const;
    if (!existing || rank[conf] > rank[existing.confidence]) {
      found.set(t.id, { ...t, confidence: conf });
    }
  };
  const hay = text.toLowerCase();
  const WINDOW = 160; // chars either side of the mention
  const localWindow = (idx: number, len: number) =>
    text.slice(Math.max(0, idx - WINDOW), Math.min(text.length, idx + len + WINDOW));

  for (const [key, target] of ACRONYMS) {
    const re = new RegExp(`\\b${escapeRe(key)}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(hay)) !== null) {
      tryAdd(target, classifyConfidence(localWindow(m.index, m[0].length)));
    }
  }
  for (const p of PROGRAMS) {
    const phrase = phraseFor(p.name);
    if (phrase.length <= 6 || STOP.has(phrase)) continue;
    let idx = hay.indexOf(phrase);
    while (idx !== -1) {
      tryAdd(
        { id: p.id, name: p.name, estimate: p.estimate },
        classifyConfidence(localWindow(idx, phrase.length)),
      );
      idx = hay.indexOf(phrase, idx + phrase.length);
    }
  }
  return [...found.values()].slice(0, 6);
}

export function ChatApplyActions({
  text,
  onApply,
  compact,
  signals,
}: {
  text: string;
  onApply?: (program: ApplyTarget) => void;
  compact?: boolean;
  signals?: Signals;
}) {
  const targets = useMemo(() => {
    const raw = programsMentioned(text);
    if (!signals) return raw;
    // Deterministic screen: override AI confidence when hard rules are broken.
    return raw.map((t) => {
      const verdict = screenProgram(t.id, signals);
      if (verdict.fit === "not_fit") {
        return { ...t, confidence: "not_fit" as Confidence, reason: verdict.reason };
      }
      return t;
    });
  }, [text, signals]);

  // Log any case where the engine had to demote an AI recommendation.
  useEffect(() => {
    if (!signals) return;
    const raw = programsMentioned(text);
    for (const t of raw) {
      const verdict = screenProgram(t.id, signals);
      if (verdict.fit === "not_fit" && t.confidence !== "not_fit") {
        logContradiction({
          programId: t.id,
          programName: t.name,
          aiConfidence: t.confidence,
          engineVerdict: "not_fit",
          reason: verdict.reason,
          signals,
          messageExcerpt: text,
        });
      }
    }
  }, [text, signals]);

  const [guide, setGuide] = useState<ApplyTarget | null>(null);
  if (!targets.length) return null;

  const strong = targets.filter((t) => t.confidence === "strong");
  const maybe = targets.filter((t) => t.confidence === "maybe");
  const notFit = targets.filter((t) => t.confidence === "not_fit");

  const renderCard = (p: ApplyTarget) => {
    const official = officialSourceFor(`${p.id} ${p.name}`);
    const dim = p.confidence === "not_fit";
    return (
      <div
        key={p.id}
        className={`rounded-2xl border p-3 ${
          dim
            ? "border-dashed border-border/60 bg-background/30 opacity-80"
            : "border-border bg-background/60"
        }`}
      >
        <p className="text-xs font-semibold">
          {p.name.replace(/\s*\([^)]*\)\s*/g, " ").trim()}
          {p.estimate ? <span className="ml-1 font-normal text-muted-foreground">· {p.estimate}</span> : null}
        </p>
        {dim && p.reason ? (
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
            {p.reason}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {p.confidence !== "not_fit" ? (
            <button
              type="button"
              onClick={() => onApply?.(p)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
            >
              Apply here
              <ArrowRight className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setGuide(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-semibold transition hover:bg-muted"
          >
            <ListChecks className="size-3.5" />
            Official steps for my state
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <FileText className="mt-0.5 size-3 shrink-0" />
          <span>
            <span className="font-medium">{official.label}.</span> Bring: {official.docs.join(", ")}.
          </span>
        </p>
      </div>
    );
  };

  const Section = ({
    title,
    subtitle,
    icon,
    items,
    tone,
  }: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    items: ApplyTarget[];
    tone: "primary" | "muted" | "warn";
  }) => {
    if (!items.length) return null;
    const toneClass =
      tone === "primary"
        ? "text-primary"
        : tone === "warn"
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground";
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${toneClass}`}>
          {icon}
          <span>{title}</span>
          {subtitle ? <span className="font-normal normal-case tracking-normal text-muted-foreground">- {subtitle}</span> : null}
        </div>
        <div className="space-y-2">{items.map(renderCard)}</div>
      </div>
    );
  };

  return (
    <div className={compact ? "mt-2 space-y-3" : "mt-3 space-y-4"}>
      <Section title="Recommended for you" items={strong} tone="primary" />
      <Section title="Might be a fit - worth checking" items={maybe} tone="muted" />
      <Section
        title="Might not be a good fit"
        subtitle="listed for reference"
        icon={<AlertTriangle className="size-3" />}
        items={notFit}
        tone="warn"
      />
      <OfficialGuide program={guide} open={!!guide} onClose={() => setGuide(null)} />
    </div>
  );
}
