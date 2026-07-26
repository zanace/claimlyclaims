export type Attachment = {
  type: "file";
  mediaType: string;
  filename: string;
  url: string;
};

const MAX_BYTES = 8 * 1024 * 1024;

/** Turns picked image files into inline data URLs the assistant can read. */
export async function readAttachments(list: FileList | null): Promise<Attachment[]> {
  if (!list) return [];
  const files = Array.from(list).filter(
    (f) => f.type.startsWith("image/") && f.size <= MAX_BYTES,
  );
  return Promise.all(
    files.map(
      (file) =>
        new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              type: "file",
              mediaType: file.type,
              filename: file.name,
              url: String(reader.result),
            });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}
