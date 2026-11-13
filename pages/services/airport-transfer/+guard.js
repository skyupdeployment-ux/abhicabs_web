import { redirect } from "vike/abort";
export function guard() { throw redirect("/services/airport-taxi", 301); }
