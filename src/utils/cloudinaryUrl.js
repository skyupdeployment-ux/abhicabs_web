/**
 * src/utils/cloudinaryUrl.js
 *
 * Add Cloudinary delivery transforms to an upload URL so images ship in a
 * modern format (AVIF/WebP via f_auto) at an adaptive quality (q_auto) — and,
 * optionally, capped to a sensible width — without re-uploading anything.
 * Non-Cloudinary URLs (and already-optimized ones) pass straight through.
 */
export function cldOptimize(url, { width } = {}) {
  if (!url || typeof url !== "string") return url;
  if (!/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url;
  if (/\/upload\/[^/]*\bf_auto\b/.test(url)) return url; // already optimized
  const t = [];
  if (width) t.push(`w_${Math.round(width)}`, "c_limit");
  t.push("f_auto", "q_auto");
  return url.replace("/image/upload/", `/image/upload/${t.join(",")}/`);
}
