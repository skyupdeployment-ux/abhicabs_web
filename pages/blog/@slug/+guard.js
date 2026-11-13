import { redirect } from "vike/abort";
export function guard(pageContext) { throw redirect(`/blogs/${pageContext.routeParams.slug}`, 301); }
