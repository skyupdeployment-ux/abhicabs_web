import React from "react";
import Button from "../ui/Button";
import PageHero from "../ui/PageHero";
import { scrollToId } from "./shared";

export default function ContactHero({ content, onBook }) {
  const h = content.hero;
  return (
    <PageHero
      image={h.image} imageAlt={h.imageAlt}
      breadcrumb={[["Home", "/"], ["Contact", null]]}
      title={h.title} accent={h.accent} description={h.description}
      actions={<>
        <Button size="lg" onClick={() => scrollToId("contact-form")}>Contact Our Team</Button>
        <Button size="lg" variant="outlineInverse" onClick={onBook}>Book Your Ride</Button>
      </>}
    />
  );
}
