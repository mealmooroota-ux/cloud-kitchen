import Image from "next/image";

/** Real dish photo from Cloudinary, or a quiet named slot until a photo is uploaded in Admin. */
export function DishImage({ publicId, name, sizes, className = "", priority = false, aspect = "aspect-[4/3]" }:
  { publicId?: string | null; name: string; sizes: string; className?: string; priority?: boolean; aspect?: string }) {
  return (
    <div className={`relative overflow-hidden bg-raised ${aspect} ${className}`}>
      {publicId ? (
        <Image src={publicId} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center text-muted">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></svg>
          <span className="px-3 text-sm">{name}</span>
        </div>
      )}
    </div>
  );
}
