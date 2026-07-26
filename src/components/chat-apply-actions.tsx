import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { PROGRAMS } from "@/lib/programs";

export type ApplyTarget = { id: string; name: string; estimate?: string };

/** Finds programs the assistant actually named in a message, so we can offer a real Apply button. */
export function programsMentioned(text: string): ApplyTarget[] {
  if (!text) return [];
  const hay = text.toLowerCase();
  const found: ApplyTarget[] = [];
  for (const p of PROGRAMS) {
    const name = p.name.toLowerCase();
    const alias = name.match(/\(([^)]+)\)/)?.[1];
    const base = name.replace(/\s*\([^)]*\)\s*/g, "").trim();
    const hit =
      (base.length > 3 && hay.includes(base)) ||
      (alias && alias.length > 2 && new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay));
    if (hit && !found.some((f) => f.id === p.id)) {
      found.push({ id: p.id, name: p.name, estimate: p.estimate });
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
    <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-2"}>
      {targets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onApply(p)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Apply here: {p.name.replace(/\s*\([^)]*\)\s*/g, " ").trim()}
          <ArrowRight className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
