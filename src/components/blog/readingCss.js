/** Article typography shared by the public post page and the CMS live preview, so they always match. */
export const READING_CSS = `
  .blog-content, .blog-content * { font-family: var(--font-sans) !important; }
  .blog-content p, .blog-content ul li, .blog-content ol li { color:#222 !important; font-size:17px !important; line-height:1.85 !important; }
  .blog-content ul { list-style: disc; } .blog-content ol { list-style: decimal; }
  .blog-content h2 { font-size: clamp(22px,3vw,28px) !important; font-weight:800 !important; letter-spacing:-.02em; margin-top:2.2rem !important; }
  .blog-content h3 { font-size: clamp(18px,2.4vw,21px) !important; font-weight:800 !important; margin-top:1.6rem !important; }
  .blog-content a { color:#B58500; text-decoration: underline; text-underline-offset:3px; }
  .blog-content table td, .blog-content table th { color:#222 !important; font-size:15px !important; }
  .blog-content figure img, .blog-content img { border-radius: 6px; }
`;
