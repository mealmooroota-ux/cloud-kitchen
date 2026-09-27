"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";

/** Uploads straight from the browser to Cloudinary with a server-issued signature (secret never reaches the browser). */
export function CloudinaryUpload({ folder, accept = "image/*,video/*", label = "Upload", onUploaded }: { folder: "cloud-kitchen/products" | "cloud-kitchen/site" | "cloud-kitchen/plans"; accept?: string; label?: string; onUploaded: (r: { publicId: string; kind: "image" | "video" }) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function upload(file: File) {
    if (file.size > 60 * 1024 * 1024) return setErr("Files must be under 60 MB.");
    setBusy(true); setErr(null);
    try {
      const s = await fetch("/api/cloudinary/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder }) }).then((r) => r.json());
      if (s.error) throw new Error(s.error.message);
      const kind = file.type.startsWith("video") ? "video" : "image";
      const fd = new FormData();
      fd.append("file", file); fd.append("api_key", s.apiKey); fd.append("timestamp", s.timestamp); fd.append("signature", s.signature); fd.append("folder", s.folder);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/${kind}/upload`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Upload failed");
      onUploaded({ publicId: j.public_id, kind });
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  }
  return (
    <div className="flex flex-col gap-1">
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : label}</Button>
      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}
