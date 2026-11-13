import { motion, useReducedMotion } from "framer-motion";

/**
 * Reveal — fades + rises content as it scrolls into view (the standard
 * "scroll reveal" seen across ReactBits / Aceternity / MagicUI), built on the
 * framer-motion already in the project. No new dependencies. Honours
 * prefers-reduced-motion by rendering the element statically.
 *
 *   <Reveal><h2>…</h2></Reveal>
 *   <Reveal as="section" delay={0.1} y={30}> … </Reveal>
 */
export default function Reveal({ children, as = "div", y = 22, delay = 0, once = true, className, style }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className} style={style}>{children}</Tag>;
  }
  const M = motion[as] || motion.div;
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}
