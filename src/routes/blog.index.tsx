import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ARTICLES, BLOG_CATEGORIES } from "@/lib/blog";

const title = "Money guides & resources | Claimly";
const description =
  "Plain-English guides to the refunds and benefits you might be missing - taxes, food assistance, housing, family benefits, and unclaimed property.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [filter, setFilter] = useState<string>("All");
  const shown = filter === "All" ? ARTICLES : ARTICLES.filter((a) => a.category === filter);

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">Money guides</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Plain-English guides to the refunds and benefits you might be missing.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {["All", ...BLOG_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                filter === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((article) => (
            <Link
              key={article.slug}
              to="/blog/$slug"
              params={{ slug: article.slug }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {article.category}
              </span>
              <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight">
                {article.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{article.summary}</p>
              <span className="mt-4 text-xs text-muted-foreground">{article.readTime}</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
