import React from "react";
import { cldOptimize } from "../../utils/cloudinaryUrl";
import { imageOf, titleOf } from "../../lib/blog";

/** Article image: Cloudinary-optimised, lazy unless `priority`, always has alt text. */
export default function BlogImage({ blog, width = 800, priority = false, className = "", alt }) {
  const src = imageOf(blog);
  if (!src) return <div aria-hidden className={`bg-[#FFFBEA] ${className}`} />;
  return (
    <img
      src={cldOptimize(src, { width })} alt={alt ?? (blog.imageAlt || titleOf(blog))}
      loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
      width={width} className={className}
    />
  );
}
