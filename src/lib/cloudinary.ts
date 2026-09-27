const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "zu6iogvj";

/** Optimised Cloudinary URL: automatic format + quality, width-capped, smart crop. */
export function cld(publicId: string, opts: { w?: number; h?: number; crop?: "fill" | "limit"; video?: boolean } = {}) {
  const t = ["f_auto", "q_auto"];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.h) t.push(`h_${opts.h}`);
  t.push(opts.crop === "fill" || opts.h ? "c_fill,g_auto" : "c_limit");
  return `https://res.cloudinary.com/${CLOUD}/${opts.video ? "video" : "image"}/upload/${t.join(",")}/${publicId}`;
}
export function cldPoster(publicId: string, w = 1200) {
  return `https://res.cloudinary.com/${CLOUD}/video/upload/so_0,f_auto,q_auto,w_${w}/${publicId}.jpg`;
}
