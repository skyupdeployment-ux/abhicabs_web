import React from "react";
import Section from "./ui/Section";
import SectionHead from "./ui/SectionHead";
import { useAllPages } from "../hooks/usePageContent";
import { buildDirectory } from "../lib/servicePage";

/**
 * "Car Rental Services / Airport Taxi Services …" link directory — one block per group,
 * 4 columns of links, built from the service pages created in the CMS. Renders nothing
 * until at least one grouped page exists (no empty box, no placeholder links).
 */
export default function ServiceDirectory({ exclude, tone = "white", heading = "Explore our services by city" }) {
  const groups = buildDirectory(useAllPages(), { exclude });
  if (!groups.length) return null;
  return (
    <Section id="service-directory" tone={tone} className="!py-12 md:!py-14">
      <SectionHead id="service-directory" eyebrow="Service directory" title={heading} className="mb-8" />
      <div className="space-y-8">
        {groups.map(({ group, links }) => (
          <nav key={group} aria-label={group}>
            <h3 className="text-[15px] font-extrabold text-text">{group}</h3>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2">
              {links.map((l) => (
                <li key={l.href}><a href={l.href} className="text-[14.5px] text-text-secondary underline-offset-4 hover:text-[#B58500] hover:underline transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </Section>
  );
}
