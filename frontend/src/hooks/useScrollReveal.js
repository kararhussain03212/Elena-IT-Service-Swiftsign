import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a callback ref and toggles .sr-visible
 * when the element enters the viewport.
 */
const useScrollReveal = ({ threshold = 0.12, once = true } = {}) => {
  const optionsRef = useRef({ threshold, once });
  const observerRef = useRef(null);

  useEffect(() => {
    optionsRef.current = { threshold, once };
  }, [threshold, once]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const callbackRef = (node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const { threshold: currentThreshold, once: currentOnce } = optionsRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("sr-visible");
          if (currentOnce) {
            observer.unobserve(node);
            observerRef.current = null;
          }
        } else if (!currentOnce) {
          node.classList.remove("sr-visible");
        }
      },
      { threshold: currentThreshold }
    );

    observer.observe(node);
    observerRef.current = observer;
  };

  return callbackRef;
};

export default useScrollReveal;
