import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type DocUpload = {
  id: string;
  item: string;
  path: string;
  file_name: string | null;
  mime_type: string | null;
};

export function DocEvidence({
  item,
  userId,
  uploads,
  onChange,
}: {
  item: string;
  userId: string;
  uploads: DocUpload[];
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const paths = uploads.map((u) => u.path);
    if (paths.length === 0) {
      setUrls({});
      return;
    }
    supabase.storage
      .from("claim-docs")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!active || !data) return;
        const next: Record<string, string> = {};
        data.forEach((d) => {
          if (d.path && d.signedUrl) next[d.path] = d.signedUrl;
        });
        setUrls(next);
      });
    return () => {
      active = false;
    };
  }, [uploads]);

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Please keep uploads under 10 MB." });
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("claim-docs")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setBusy(false);
      toast.error("Upload failed", { description: upErr.message });
      return;
    }
    const { error } = await supabase.from("document_uploads").insert({
      user_id: userId,
      item,
      path,
      file_name: file.name.slice(0, 160),
      mime_type: file.type || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save", { description: error.message });
      return;
    }
    toast.success("Proof attached", { description: file.name });
    onChange();
  }

  async function remove(u: DocUpload) {
    setBusy(true);
    await supabase.storage.from("claim-docs").remove([u.path]);
    const { error } = await supabase.from("document_uploads").delete().eq("id", u.id);
    setBusy(false);
    if (error) {
      toast.error("Could not remove", { description: error.message });
      return;
    }
    onChange();
  }

  return (
    <div className="mt-3 ml-7 space-y-2">
      {uploads.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-secondary/40"
            >
              {u.mime_type?.startsWith("image/") && urls[u.path] ? (
                <a href={urls[u.path]} target="_blank" rel="noreferrer">
                  <img
                    src={urls[u.path]}
                    alt={u.file_name ?? "Uploaded proof"}
                    className="h-24 w-24 object-cover"
                    loading="lazy"
                  />
                </a>
              ) : (
                <a
                  href={urls[u.path]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-24 w-24 items-center justify-center p-2 text-center text-[11px] break-all text-muted-foreground"
                >
                  {u.file_name ?? "File"}
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(u)}
                aria-label="Remove file"
                className="absolute top-1 right-1 rounded-full bg-background/85 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
        {uploads.length ? "Add another photo or PDF" : "Attach photo or PDF as proof"}
      </button>
    </div>
  );
}