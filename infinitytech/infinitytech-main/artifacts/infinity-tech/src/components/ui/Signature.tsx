import { motion } from "framer-motion";

interface SignatureProps {
  size?: "sm" | "md" | "lg";
  opacity?: number;
  color?: string;
  rotate?: number;
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-6xl md:text-7xl",
};

export function Signature({
  size = "md",
  opacity = 1,
  color = "#22D3EE",
  rotate = -4,
  className = "",
  animate = true,
}: SignatureProps) {
  const content = (
    <span
      className={`${sizes[size]} select-none pointer-events-none whitespace-nowrap`}
      style={{
        fontFamily: "'Caveat', cursive",
        fontWeight: 700,
        color,
        opacity,
        display: "inline-block",
        transform: `rotate(${rotate}deg)`,
        lineHeight: 1.1,
      }}
    >
      Eng.Fares Salah
    </span>
  );

  if (!animate) return <div className={className}>{content}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}
