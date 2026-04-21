import React, { useEffect, useRef } from "react";

/**
 * ScrollReveal — wraps any content and animates it in when it enters the viewport.
 *
 * Props:
 *  direction  — "up" | "down" | "left" | "right"  (default: "up")
 *  delay      — CSS delay string, e.g. "0s" | "0.1s"  (default: "0s")
 *  duration   — CSS duration string                    (default: "0.7s")
 *  className  — extra class names appended to the wrapper div
 *  threshold  — 0-1, fraction of element visible before triggering (default: 0.12)
 *  once       — if true (default), unobserves after first reveal
 */
const ScrollReveal = ({
  children,
  direction = "up",
  delay = "0s",
  duration = "0.7s",
  className = "",
  threshold = 0.12,
  once = true,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("sr-visible");
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("sr-visible");
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <div
      ref={ref}
      className={`sr-hidden sr-${direction} ${className}`}
      style={{
        "--sr-duration": duration,
        "--sr-delay": delay,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
