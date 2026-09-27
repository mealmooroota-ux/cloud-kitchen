// next/image loader: Cloudinary public IDs get optimised URLs, local paths pass through.
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  if (src.startsWith("https://")) return src;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "zu6iogvj";
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_${quality ?? "auto"},w_${width},c_limit/${src}`;
}
