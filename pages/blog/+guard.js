import { redirect } from "vike/abort";
// The brief asks for /blog; the site's existing, linked route is /blogs. One canonical URL → permanent redirect.
export function guard() { throw redirect("/blogs", 301); }
