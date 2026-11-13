import React from "react";

/** Shown whenever development sample posts are on screen, so they're never mistaken for real articles. */
export default function SampleBanner() {
  return (
    <div role="note" className="bg-[#111] text-white text-center text-[12.5px] font-semibold px-4 py-2.5">
      <span className="text-primary">Development sample content.</span>{" "}
      These articles are placeholders. Publish real posts from the Blog Builder and this notice disappears.
    </div>
  );
}
