import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: docs } = await supabaseAdmin
      .from("document_uploads")
      .select("path")
      .eq("user_id", userId);
    const paths = (docs ?? []).map((d) => d.path).filter(Boolean);
    if (paths.length) await supabaseAdmin.storage.from("claim-docs").remove(paths);

    await supabaseAdmin.from("document_uploads").delete().eq("user_id", userId);
    await supabaseAdmin.from("applications").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });