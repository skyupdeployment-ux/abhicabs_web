import { createElement } from "react";
import { getEmbedSrc } from "../../utils/videoEmbed";
import { cldOptimize } from "../../utils/cloudinaryUrl";
import { slugify } from "../../lib/blog";

/**
 * Renders a post's `sections` (the Blog Builder format): headings, paragraphs, lists, tables,
 * FAQs, images, video, quotes… Extracted unchanged from the previous detail page so every
 * existing article renders exactly as before; h2 headings now also get anchor ids for the TOC.
 */
export default function ArticleBody({ sections, onPlayVideo = () => {} }) {
  return (
    <div className="mt-6 space-y-3 blog-content">
              {(() => {
                      const used = new Map();
                      // Strip any manual numbering an author already typed into a
                      // question ("Q1. ", "1. ", "1) ") so every blog shows the
                      // same clean "N. " prefix, no matter how it was authored.
                      const stripManualNum = (t = "") => t.replace(/^\s*Q?\.?\s*\d+\s*[.):]\s*/i, "").trim();
      
                      // Turn any FAQ "ol" item into a clean { q, a } pair, no matter how
                      // the Blog Builder saved it: plain "Q?\nA", concatenated "Q?A", or
                      // rich HTML like `<span style="font-weight:bold">Q?<br></span>A` or
                      // `<p><span ...>Q?</span></p><p>A</p>`. The question always renders
                      // as plain text (the h3 supplies bold + size) and the answer keeps
                      // real inline formatting (links, emphasis) but drops wrapper markup,
                      // so every blog's FAQ looks identical.
                      const stripTags = (h = "") =>
                        h.replace(/<[^>]+>/g, "")
                          .replace(/&nbsp;/gi, " ")
                          .replace(/&amp;/gi, "&")
                          .replace(/&quot;/gi, '"')
                          .replace(/&#39;/gi, "'")
                          .replace(/\s+/g, " ")
                          .trim();
                      const parseFaqItem = (item = "") => {
                        // The question always ends at the first "?" that appears in the
                        // *visible text* (not inside a tag/attribute). Splitting there is
                        // format-agnostic: it works for plain "Q?\nA", concatenated "Q?A",
                        // `<span>Q?<br></span>A`, `<p>Q?</p><p>A</p>`, and Google-Docs
                        // pastes that wrap the whole Q&A in one <p> with nested spans.
                        let inTag = false;
                        let splitAt = -1;
                        for (let k = 0; k < item.length; k++) {
                          const c = item[k];
                          if (c === "<") inTag = true;
                          else if (c === ">") inTag = false;
                          else if (c === "?" && !inTag) { splitAt = k; break; }
                        }
      
                        let q, a;
                        if (splitAt === -1) {
                          // No question mark — treat the whole item as the question.
                          q = item;
                          a = "";
                        } else {
                          q = item.slice(0, splitAt + 1);
                          a = item.slice(splitAt + 1);
                        }
      
                        // Question renders as plain text (the h3 supplies bold + size).
                        q = stripManualNum(stripTags(q));
                        // Answer: drop wrapper/heading markup so it never inherits the
                        // bold/serif styling a paste carried in, but keep real inline
                        // formatting (links, emphasis).
                        a = a
                          .replace(/<\/?(p|div|span|font|h[1-6])[^>]*>/gi, "") // wrapper markup
                          .replace(/<br\s*\/?>/gi, " ")                        // no stray breaks
                          .replace(/&nbsp;/gi, " ")
                          .replace(/\s+/g, " ")                                // collapse whitespace
                          .replace(/^\s+|\s+$/g, "");                          // keeps <a>, <b>, <em>, <u>
                        return { q, a };
                      };
      
                      // Only treat an h2/h3 ending in "?" as an FAQ question once we're
                      // past a real "FAQ" / "Frequently Asked Questions" heading —
                      // otherwise an unrelated subheading that happens to end in "?"
                      // would get mistaken for one.
                      let faqLandmark = -1;
                      sections.forEach((s, idx) => {
                        if ((s.type === "h2" || s.type === "h3") && /^(faqs?|frequently asked questions)/i.test((s.text || "").trim())) {
                          faqLandmark = idx;
                        }
                      });
      
                      // One pass, in document order, numbering every FAQ item from
                      // whichever format it was authored in (heading+paragraph pairs,
                      // an "ol" list of concatenated Q&A, or a schema-style "faq" block).
                      let faqCount = 0;
                      const questionNumbers = new Map(); // h2/h3 index -> number
                      const olFaqStart = new Map();       // ol index -> starting number
                      const faqTypeStart = new Map();     // faq-type index -> starting number
                      sections.forEach((cur, idx) => {
                        if (!cur || faqLandmark === -1 || idx <= faqLandmark) return;
                        if (cur.type === "h2" || cur.type === "h3") {
                          const nxt = sections[idx + 1];
                          if ((cur.text || "").trim().endsWith("?") && nxt?.type === "p") {
                            faqCount += 1;
                            questionNumbers.set(idx, faqCount);
                          }
                        } else if (cur.type === "ol") {
                          const items = cur.text || [];
                          const isFaqStyle = items.length > 0 && items.every((item) => {
                            const qi = item.indexOf("?");
                            return qi > 0 && qi < item.length - 1;
                          });
                          if (isFaqStyle) {
                            olFaqStart.set(idx, faqCount + 1);
                            faqCount += items.length;
                          }
                        } else if (cur.type === "faq") {
                          const items = cur.items || [];
                          faqTypeStart.set(idx, faqCount + 1);
                          faqCount += items.length;
                        }
                      });
      
                      return sections.map((s, i) => {
      
                        // H2
                        if (s.type === "h2") {
                          const faqNum = questionNumbers.get(i);
                          if (faqNum) {
                            const cleanText = stripManualNum(s.text || "");
                            const base = slugify(cleanText);
                            const count = (used.get(base) || 0) + 1;
                            used.set(base, count);
                            const id = count === 1 ? base : `${base}-${count}`;
                            return (
                              <h3 key={i} id={id} className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]" style={{ textAlign: s.align || undefined }}>
                                {`${faqNum}. ${cleanText}`}
                              </h3>
                            );
                          }
                          return (
                            <h2 key={i} id={(() => { const b = slugify(s.text || ""); const c = (used.get(b) || 0) + 1; used.set(b, c); return c === 1 ? b : `${b}-${c}`; })()} className="scroll-mt-28 text-[20px] sm:text-[24px] font-bold mt-4" style={{ textAlign: s.align || undefined }}>
                              {s.text}
                            </h2>
                          );
                        }
      
                        // H3
                        if (s.type === "h3") {
                          const faqNum = questionNumbers.get(i);
                          const cleanText = faqNum ? stripManualNum(s.text || "") : (s.text || "");
                          const base = slugify(cleanText);
                          const count = (used.get(base) || 0) + 1;
                          used.set(base, count);
                          const id = count === 1 ? base : `${base}-${count}`;
                          return (
                            <h3 key={i} id={id} className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]" style={{ textAlign: s.align || undefined }}>
                              {faqNum ? `${faqNum}. ${cleanText}` : cleanText}
                            </h3>
                          );
                        }
      
                        // H1 / H4 / H5 / H6
                        if (["h1", "h4", "h5", "h6"].includes(s.type)) {
                          const size = {
                            h1: "text-[24px] sm:text-[30px]",
                            h4: "text-[15px] sm:text-[16px]",
                            h5: "text-[13px] sm:text-[14px]",
                            h6: "text-[12px] sm:text-[13px]",
                          }[s.type];
                          const base = slugify(s.text || "");
                          const count = (used.get(base) || 0) + 1;
                          used.set(base, count);
                          const id = count === 1 ? base : `${base}-${count}`;
                          return createElement(
                            s.type,
                            { key: i, id, className: `scroll-mt-28 ${size} font-bold text-[#111827] mt-4`, style: { textAlign: s.align || undefined } },
                            s.text,
                          );
                        }
      
                        // Quote
                        if (s.type === "quote") {
                          return (
                            <div key={i} className="rounded-xl border border-[#F2E6C9] bg-[#FFF8E8] px-4 py-4 text-[13px] sm:text-[14px] text-slate-700">
                              <div className="border-l-4 border-[#F5A623] pl-3 italic leading-relaxed">{s.text}</div>
                            </div>
                          );
                        }
      
                        // Image
                        if (s.type === "video") {
                          const src = getEmbedSrc(s.embedUrl);
                          if (!src) return null;
                          return (
                            <div key={i} className="my-2">
                              <div className="rounded-2xl overflow-hidden border border-slate-100 mx-auto" style={{ maxWidth: 720, aspectRatio: "16/9" }}>
                                <iframe src={src} loading="lazy" title={s.caption || "Video"} allow="fullscreen" allowFullScreen className="w-full h-full border-0" />
                              </div>
                              {s.caption && <p className="mt-2 text-[13px] text-slate-500 text-center">{s.caption}</p>}
                            </div>
                          );
                        }
                        if (s.type === "image") {
                          const justify = s.alignment === "left" ? "flex-start" : s.alignment === "right" ? "flex-end" : "center";
                          const figStyle = { maxWidth: "100%", ...(s.imgWidth ? { width: s.imgWidth + "px" } : {}) };
                          const imgStyle = { width: "100%", height: "auto", display: "block" };
                          if (s.imgHeight) { imgStyle.height = s.imgHeight + "px"; imgStyle.objectFit = "cover"; }
                          const hasVideo = !!getEmbedSrc(s.videoUrl);
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: justify }}>
                              <figure className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50" style={figStyle}>
                                <div className="relative group">
                                  <img
                                    src={cldOptimize(s.src, { width: 1200 })}
                                    alt={s.alt || s.caption || "Blog image"}
                                    title={s.title || undefined}
                                    loading="lazy"
                                    decoding="async"
                                    style={imgStyle}
                                  />
                                  {hasVideo && (
                                    <button type="button" aria-label="Play video"
                                      onClick={() => onPlayVideo(s.videoUrl)}
                                      className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors">
                                      <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                        <svg viewBox="0 0 24 24" fill="#F5A623" width="26" height="26"><path d="M8 5v14l11-7z"/></svg>
                                      </span>
                                    </button>
                                  )}
                                </div>
                                {s.caption && <figcaption className="px-4 py-3 text-[12px] text-slate-500 text-center">{s.caption}</figcaption>}
                              </figure>
                            </div>
                          );
                        }
      
                        // Table
                        if (s.type === "table") {
                          return (
                            <div key={i} className="overflow-x-auto rounded-xl border border-[#1B1B1B]">
                              <table className="w-full text-[13px] sm:text-[14px] text-slate-600 leading-relaxed border-collapse">
                                <thead>
                                  <tr>
                                    {(s.headers || []).map((h, hi) => (
                                      <th key={hi}
                                        className="text-left px-4 py-3 font-bold border border-[#1B1B1B] text-[#111827]"
                                        style={{ background: s.themed ? "#e8dfa8" : "#EAF7F0" }}>
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(s.rows || []).map((row, ri) => (
                                    <tr key={ri} style={{ background: s.themed ? (ri % 2 === 0 ? "#faf7ec" : "#f5f0d8") : (ri === 0 && !s.headers?.length ? "#EAF7F0" : "#ffffff") }}>
                                      {row.map((cell, ci) => (
                                        // First row bold if no thead headers
                                        ri === 0 && !s.headers?.length
                                          ? <td key={ci} className="px-4 py-2.5 border border-[#1B1B1B] font-bold text-[#111827]">{cell}</td>
                                          : <td key={ci} className="px-4 py-2.5 border border-[#1B1B1B] text-slate-600">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
      
                        // FAQ (schema-style block) — plain numbered Q&A, same style as every other FAQ format
                        if (s.type === "faq") {
                          const startNum = faqTypeStart.get(i) || 1;
                          return (
                            <div key={i} className="space-y-3">
                              {(s.items || []).map((item, fi) => (
                                <div key={fi}>
                                  <h3 className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]">
                                    {`${startNum + fi}. ${stripManualNum(item.q || item.name || "")}`}
                                  </h3>
                                  <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-600">{item.a || item.text}</p>
                                </div>
                              ))}
                            </div>
                          );
                        }
      
                        // Unordered list
                        if (s.type === "ul") {
                          return (
                            <ul key={i} className="list-disc list-outside pl-5 space-y-1.5 text-[13px] sm:text-[14px] leading-relaxed text-[#111827]">
                              {(s.text || []).map((item, idx) => (
                                <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                              ))}
                            </ul>
                          );
                        }
      
                        // Ordered list — detect FAQ-style items (question?answer concatenated) and render as cards
                        if (s.type === "ol") {
                          const items = s.text || [];
                          // Check if items look like concatenated Q+A (each contains a "?" not at the very end)
                          const isFaqStyle = items.length > 0 && items.every((item) => {
                            const qi = item.indexOf("?");
                            return qi > 0 && qi < item.length - 1;
                          });
                          if (isFaqStyle) {
                            const startNum = olFaqStart.get(i) || 1;
                            const faqItems = items.map((item) => parseFaqItem(item));
                            return (
                              <div key={i} className="space-y-3">
                                {faqItems.map((item, fi) => (
                                  <div key={fi}>
                                    <h3 className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]">
                                      {`${startNum + fi}. ${item.q}`}
                                    </h3>
                                    <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: item.a }} />
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <ol key={i} className="list-decimal list-outside pl-5 space-y-1.5 text-[13px] sm:text-[14px] leading-relaxed text-[#111827]">
                              {items.map((item, idx) => (
                                <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                              ))}
                            </ol>
                          );
                        }
      
                        if (s.type === "p_with_bold") {
                          return (
                            <p
                              key={i}
                              className="text-[13px] sm:text-[14px] leading-relaxed text-[#111827]"
                            >
                              {s.parts.map((part, idx) =>
                                part.bold ? (
                                  <strong
                                    key={idx}
                                    className="font-semibold text-[#111827]"
                                  >
                                    {part.text}
                                  </strong>
                                ) : (
                                  <span key={idx}>{part.text}</span>
                                ),
                              )}
                            </p>
                          );
                        }
      
                        if (s.type === "p_with_link_bold") {
                          return (
                            <p
                              key={i}
                              className="text-[13px] sm:text-[14px] leading-relaxed text-[#111827]"
                            >
                              {s.partsBefore?.map((part, idx) =>
                                part.bold ? (
                                  <strong
                                    key={idx}
                                    className="font-semibold text-[#111827]"
                                  >
                                    {part.text}
                                  </strong>
                                ) : (
                                  <span key={idx}>{part.text}</span>
                                ),
                              )}
                              <a
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#DCA000] font-semibold no-underline hover:opacity-90"
                              >
                                {s.linkText}
                              </a>
                              {s.partsAfter?.map((part, idx) =>
                                part.bold ? (
                                  <strong
                                    key={idx}
                                    className="font-semibold text-[#111827]"
                                  >
                                    {part.text}
                                  </strong>
                                ) : (
                                  <span key={idx}>{part.text}</span>
                                ),
                              )}
                            </p>
                          );
                        }
      
                        // Paragraph with link
                        if (s.type === "p_with_link") {
                          return (
                            <p key={i} className="text-[13px] sm:text-[14px] leading-relaxed text-[#111827]">
                              {s.textBefore && <span>{s.textBefore} </span>}
                              <a href={s.href} className="text-[#F5A623] font-semibold underline underline-offset-2 hover:opacity-80">
                                {s.linkText}
                              </a>
                              {s.textAfter && <span> {s.textAfter}</span>}
                            </p>
                          );
                        }
      
                        // Default paragraph (supports bold HTML)
                        // Convert <font color="X"> to <span style="color:X"> for reliable rendering
                        const cleanHtml = (s.text || "").replace(
                          /<font([^>]*)color=["']([^"']+)["']([^>]*)>/gi,
                          (_, pre, col, post) => `<span${pre}${post} style="color:${col}">`
                        ).replace(/<\/font>/gi, "</span>");
                        return (
                          <p
                            key={i}
                            className="text-[13px] sm:text-[14px] leading-relaxed text-[#111827]"
                            style={{ textAlign: s.align || undefined }}
                            dangerouslySetInnerHTML={{ __html: cleanHtml }}
                          />
                        );
                      });
                    })()}
    </div>
  );
}
