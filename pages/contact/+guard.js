import { redirect } from "vike/abort";
export function guard() { throw redirect("/contact-us", 301); }
