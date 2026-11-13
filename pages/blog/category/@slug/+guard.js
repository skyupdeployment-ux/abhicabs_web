import { redirect } from "vike/abort";
// Category pages are served by the listing's ?category= filter.
export function guard(pageContext) { throw redirect(`/blogs?category=${encodeURIComponent(pageContext.routeParams.slug)}`, 301); }
