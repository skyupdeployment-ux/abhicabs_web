/**
 * src/utils/videoEmbed.js
 *
 * One robust place to turn a pasted video URL into an embeddable player.
 * Previously each surface (blog featured video, blog content image, CMS page
 * "Video Embed" section, section previews) had its own regex — some only
 * matched `watch?v=` / `youtu.be`, so Shorts, `/embed/`, `/live/` and param-
 * reordered links silently failed. Everything now imports from here.
 */

/** Extract a YouTube video id from any standard URL form, or null. */
export function getYouTubeId(url = "") {
  if (!url) return null;
  const patterns = [
    // watch?v=ID, watch?...&v=ID, youtu.be/ID, /embed/ID, /v/ID, /shorts/ID, /live/ID
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = String(url).match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** Extract a Vimeo video id, or null. */
export function getVimeoId(url = "") {
  const m = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/**
 * Build an embeddable iframe src for a YouTube/Vimeo URL, or null if the URL
 * isn't a recognised video. Pass { autoplay: true } for lightbox use.
 */
export function getEmbedSrc(url = "", { autoplay = false } = {}) {
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?rel=0${autoplay ? "&autoplay=1" : ""}`;
  const vi = getVimeoId(url);
  if (vi) return `https://player.vimeo.com/video/${vi}${autoplay ? "?autoplay=1" : ""}`;
  return null;
}

/** True when the URL is a recognised, embeddable video. */
export function isVideoUrl(url = "") {
  return !!getEmbedSrc(url);
}
