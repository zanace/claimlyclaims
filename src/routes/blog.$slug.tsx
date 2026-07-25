import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getArticle, relatedArticles, type Article } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }): { article: Article; related: Article[] } => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article, related: relatedArticles(params.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Guide not found | Claimly" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `${loaderData.article.title} | Claimly`;
    const d = loaderData.article.summary;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article, related } = Route.useLoaderData() as { article: Article; related: Article[] };
  const mid = Math.ceil(article.body.length / 2);

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← All guides
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1">{article.category}</span>
          <span>
            {new Date(article.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>{article.readTime}</span>
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">
          {article.title}
        </h1>

        <article className="mt-8 space-y-8">
          {article.body.map((section, i) => (
            <div key={i} className="space-y-4">
              {section.heading && (
                <h2 className="font-display text-3xl tracking-tight">{section.heading}</h2>
              )}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {i === mid - 1 && (
                <div className="rounded-2xl border border-border bg-secondary/50 p-6">
                  <h3 className="font-display text-2xl tracking-tight">
                    Not sure if you qualify?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check in 2 minutes. No SSN, no documents.
                  </p>
                  <Link
                    to="/eligibility"
                    className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    Check eligibility
                  </Link>
                </div>
              )}
            </div>
          ))}
        </article>

        <div className="mt-14 rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="font-display text-3xl tracking-tight">See what you qualify for</h2>
          <p className="mt-3 opacity-90">About four minutes, and it's free to look.</p>
          <Link
            to="/eligibility"
            className="mt-6 inline-block rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground"
          >
            Start the check
          </Link>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-3xl tracking-tight">Related guides</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                to="/blog/$slug"
                params={{ slug: item.slug }}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <span className="text-xs text-muted-foreground">{item.category}</span>
                <h3 className="mt-2 text-base font-semibold leading-snug">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
