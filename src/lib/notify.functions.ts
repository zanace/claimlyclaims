import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const input = z.object({
  programName: z.string().min(1).max(200),
  status: z.string().min(1).max(80),
  reviewerNote: z.string().max(1000).optional().nullable(),
});

/**
 * Sends a "your submission was processed" email to the signed-in applicant.
 * The recipient is always the authenticated user's own account email - it can
 * never be supplied by the caller.
 * Requires the Resend connector to be linked so RESEND_API_KEY is available.
 */
export const sendStatusEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const to = (context.claims as { email?: string } | null)?.email;
    if (!to) {
      return { ok: false, reason: "no_recipient" as const };
    }
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      return { ok: false, reason: "email_not_configured" as const };
    }
    const subject = `Your ${data.programName} application was ${data.status.toLowerCase()}`;
    const note = data.reviewerNote
      ? `<p style="margin:16px 0;padding:14px 16px;background:#f4f6f2;border-radius:12px;color:#1f2a1f"><strong>Reviewer note:</strong> ${escapeHtml(data.reviewerNote)}</p>`
      : "";
    const html = `<!doctype html>
<html><body style="font-family:Inter,system-ui,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 12px">Update on your Claimly application</h1>
  <p>Your <strong>${escapeHtml(data.programName)}</strong> application has been processed by our review team.</p>
  <p>New status: <strong>${escapeHtml(data.status)}</strong>.</p>
  ${note}
  <p style="margin-top:24px">You can view the full application and download a copy any time from your Claimly account.</p>
  <p style="color:#6b6b6b;font-size:12px;margin-top:32px">You're receiving this because a claim tied to this email address was reviewed. Reply to this email if you didn't submit an application.</p>
</body></html>`;
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "Claimly <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[sendStatusEmail] ${res.status} ${body}`);
      return { ok: false, reason: "provider_error" as const, status: res.status };
    }
    return { ok: true };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}