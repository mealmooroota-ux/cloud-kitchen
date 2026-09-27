"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Media } from "@/lib/types";
import { addMedia, makeCover, removeMedia } from "@/app/admin/actions";
import { CloudinaryUpload } from "./CloudinaryUpload";

export function MediaManager({ productId, media }: { productId: string; media: Media[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (f: () => Promise<unknown>) => start(async () => { await f(); router.refresh(); });
  return (
    <section className="flex flex-col gap-4 rounded-[12px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Photos and video</h2>
        <CloudinaryUpload folder="cloud-kitchen/products" label="Upload photo or video" onUploaded={(r) => act(() => addMedia(productId, r.publicId, r.kind, ""))} /></div>
      <p className="text-sm text-muted">The first photo is the cover on menu cards. Real, well-lit photos of the actual dish work best. Images are resized and compressed automatically.</p>
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${pending ? "opacity-60" : ""}`}>
        {media.map((m, i) => (
          <div key={m.id} className="flex flex-col gap-1.5">
            <div className="relative aspect-square overflow-hidden rounded-[8px] bg-raised">
              {m.kind === "image" ? <Image src={m.public_id} alt="" fill sizes="200px" className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Video</div>}
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-xs text-ground">Cover</span>}
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              {i > 0 && m.kind === "image" && <button type="button" className="text-brand" onClick={() => act(() => makeCover(m.id, productId))}>Make cover</button>}
              <button type="button" className="text-danger" onClick={() => confirm("Remove this file from the dish?") && act(() => removeMedia(m.id, productId))}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
