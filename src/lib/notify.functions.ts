import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  programName: z.string().min(1).max(200),
  status: z.string().min(1).max(80),
  reviewerNote: z.string().max(1000).optional().nullable(),
  applicationId: z.string().max(120).optional().nullable(),
});

/**
 * Sends a "your submission was processed" email to the signed-in applicant.
 * The recipient is always the authenticated user's own account email - it can
 * never be supplied by the caller.
 */
export const sendStatusEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const to = (context.claims as { email?: string } | null)?.email;
    if (!to) {
      return { ok: false, reason: "no_recipient" as const };
    }
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const result = await sendTemplateEmail("application-confirmation", to, {
        templateData: {
          programName: data.programName,
          status: data.status,
          reviewerNote: data.reviewerNote ?? undefined,
        },
        idempotencyKey: `application-confirmation-${data.applicationId ?? `${data.programName}-${data.status}-${to}`}`,
      });
      if (!result.sent) {
        return { ok: false, reason: "recipient_suppressed" as const };
      }
      return { ok: true };
    } catch (error) {
      console.error("[sendStatusEmail] send failed", error);
      return { ok: false, reason: "provider_error" as const };
    }
  });