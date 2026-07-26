import { labelFor } from "@/lib/applicant-profile";
import type { SavedApplication } from "@/lib/smart-profile";

/** Print-ready HTML for an application record (opens in a tab, print -> Save as PDF). */
export function applicationHtml(app: SavedApplication) {
  const rows = Object.entries(app.answers)
    .filter(([, v]) => String(v ?? "").trim())
    .map(
      ([id, v]) =>
        `<tr><td style="padding:8px 14px;color:#555;border-bottom:1px solid #eee">${labelFor(id)}</td><td style="padding:8px 14px;border-bottom:1px solid #eee"><b>${String(v).replace(/</g, "&lt;")}</b></td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${app.programName} - ${app.id}</title>
<style>@page{size:letter;margin:18mm}</style></head>
<body style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:720px;margin:40px auto;color:#111">
<h1 style="margin:0;font-size:26px">${app.programName}</h1>
<p style="color:#666;margin:6px 0 2px">Application ID: <b>${app.id}</b></p>
<p style="color:#666;margin:0 0 24px">Prepared ${new Date(app.submittedAt).toLocaleString()} &middot; Status: ${app.status}${app.estimate ? ` &middot; Estimate: ${app.estimate}` : ""}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
<p style="margin-top:36px;font-size:13px;color:#444">Applicant signature: ______________________________ &nbsp;&nbsp; Date: ______________</p>
<p style="margin-top:28px;color:#888;font-size:12px">Prepared by Claimly. Completed application copy - hand this in to the agency listed in your Claimly steps.</p>
</body></html>`;
}

/** Opens the record in a new tab and triggers the print/save-as-PDF dialog. */
export function openApplicationPdf(app: SavedApplication, print = true): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(applicationHtml(app));
  w.document.close();
  if (print) setTimeout(() => w.print(), 400);
  return true;
}
