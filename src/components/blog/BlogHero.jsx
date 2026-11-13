import React from "react";
import { ArrowDown } from "lucide-react";
import PageHero from "../ui/PageHero";
import Button from "../ui/Button";
import BlogSearch from "./BlogSearch";

export default function BlogHero({ query, onQuery, onClear, onExplore }) {
  return (
    <PageHero
      image="/images/tea-garden-road.jpg" imageAlt="A mountain road winding through green hills"
      breadcrumb={[["Home", "/"], ["Blog", null]]}
      title="Explore Stories" accent="Beyond the Journey"
      description="Discover inspiring destinations, practical travel tips, road-trip ideas, and useful travel guides. Get inspired for your next journey with Abhi Cabs."
    >
      <div className="w-full max-w-[720px] flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1"><BlogSearch value={query} onChange={onQuery} onClear={onClear} dark /></div>
        <Button size="lg" onClick={onExplore} className="h-14"><ArrowDown size={17} aria-hidden /> Explore Articles</Button>
      </div>
    </PageHero>
  );
}
