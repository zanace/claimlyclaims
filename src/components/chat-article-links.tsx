import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import { ARTICLES } from "@/lib/blog";

/** Words that shouldn't trigger an article match on their own. */
const GENERIC = new Set(["help", "money", "benefits", "credit", "the", "and", "for"]);

/**
 * Surfaces Resources articles the assistant mentioned (by title, slug, or a
 * distinctive keyword) as tappable cards under the message.
 */
export function ChatArticleLinks({ text, compact = false }: { text: string; compact?: boolean }) {
  const matches = useMemo(() => {
    const haystack = text.toLowerCase();
    if (!haystack.trim()) return [];
    return ARTICLES.filter((a) => {
      if (haystack.includes(a.slug)) return true;
      if (haystack.includes(a.title.toLowerCase())) return true;
      const keywords = a.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 5 && !GENERIC.has(w));
      const hits = keywords.filter((w) => haystack.includes(w)).length;
      return hits >= 2;
    }).slice(0, 3);
  }, [text]);

  if (matches.length === 0) return null;

  return (
    <div className={compact ? "mt-2 space-y-1.5" : "mt-4 space-y-2"}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        From Claimly Resources
      </p>
      {matches.map((a) => (
        <Link
          key={a.slug}
          to="/blog/$slug"
          params={{ slug: a.slug }}
          className="flex items-start gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary"
        >
          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">{a.title}</span>
            <span className="block text-xs text-muted-foreground">
              {a.category} · {a.readTime}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
