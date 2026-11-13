import React from "react";
import { LazyMotion, domAnimation, m, MotionConfig } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1];

const reveal = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

export default function WhyAbhiCabsSection({ imageSrc, imageAlt = "Why Abhi Cabs", id = "about" }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section id={id} style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(46px,6vw,80px) 22px 0" }}>
          <m.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            style={{ borderRadius: 24, overflow: "hidden" }}
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </m.div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
