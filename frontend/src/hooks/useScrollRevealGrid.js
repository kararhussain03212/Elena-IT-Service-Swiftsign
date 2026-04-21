import { useEffect, useRef } from "react";

/**
 * useScrollRevealGrid — attaches an individual IntersectionObserver to every
 * direct child of the returned container ref, with a cascading stagger delay
 * based on column position (col 0 → 0ms, col 1 → stagger ms, col 2 → stagger*2 ms).
 *
 * Each child should already have the `sr-hidden` class (+ direction class
 * like `sr-up`, `sr-left`, or `sr-right`).  When a child enters the viewport
 * the hook sets its inline `transitionDelay` and adds `sr-visible` to reveal it.
 *
 * Re-runs whenever `deps` changes, so it correctly handles async-loaded data.
 *
 * Usage:
 *   const gridRef = useScrollRevealGrid(items);   // items = reactive data array
 *   <div ref={gridRef} className="grid grid-cols-3">
 *     {items.map(item => (
 *       <article key={item.id} className="sr-hidden sr-up">...</article>
 *     ))}
 *   </div>
 *
 * @param {*}      deps      - reactive dependency (typically the loaded data array)
 * @param {object} options
 * @param {number} options.threshold  - intersection fraction to trigger (default 0.08)
 * @param {number} options.stagger    - ms between each column's animation (default 110)
 * @param {number} options.columns    - number of columns used for stagger calc (default 3)
 */
const useScrollRevealGrid = (
  deps,
  { threshold = 0.08, stagger = 110, columns = 3 } = {}
) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children);
    if (children.length === 0) return;

    const observers = [];

    children.forEach((child, i) => {
      const delay = (i % columns) * stagger;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            child.style.transitionDelay = `${delay}ms`;
            child.classList.add("sr-visible");
            observer.unobserve(child);
          }
        },
        { threshold }
      );

      observer.observe(child);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [deps, threshold, stagger, columns]);

  return containerRef;
};

export default useScrollRevealGrid;
