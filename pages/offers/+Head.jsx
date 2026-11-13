import React from "react";

/** Utility / placeholder screen — keep out of search results (links are still followed). */
export default function Head() {
  return <meta name="robots" content="noindex, follow" />;
}
