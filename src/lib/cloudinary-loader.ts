// next/image loader.
// - Cloudinary public IDs -> optimised Cloudinary URL
// - Unsplash photo URLs (trial content) -> resized via Unsplash's image CDN
// - local paths / other URLs -> unchanged
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  if (src.startsWith("https://images.unsplash.com/")) {
    const base = src.split("?")[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=${quality ?? 70}`;
  }
  if (src.startsWith("https://")) return src;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "zu6iogvj";
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${quality ?? "auto"},w_${width},c_limit/${src}`;
}
