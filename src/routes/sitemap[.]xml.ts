import { ARTICLES } from "@/lib/blog";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.9" },
          { path: "/programs", changefreq: "monthly", priority: "0.8" },
          { path: "/money-you-could-get", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          ...ARTICLES.map((a) => ({
            path: `/blog/${a.slug}`,
            changefreq: "monthly",
            priority: "0.6",
          })),
          { path: "/eligibility", changefreq: "monthly", priority: "0.9" },
          { path: "/claims", changefreq: "monthly", priority: "0.6" },
          { path: "/documents", changefreq: "monthly", priority: "0.7" },
          { path: "/legal", changefreq: "yearly", priority: "0.3" },
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
          { path: "/chat", changefreq: "monthly", priority: "0.7" },
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              `    <changefreq>${e.changefreq}</changefreq>`,
              `    <priority>${e.priority}</priority>`,
              `  </url>`,
            ].join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});