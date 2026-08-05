import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;
      const percent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setVisible(scrollTop > 300);
      setProgress(Math.max(0, Math.min(1, percent)));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .scroll-up {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          border-radius: 999px;
          border: none;
          background: rgba(10, 10, 30, 0.65);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
          transition: opacity 0.4s ease, visibility 0.4s ease, transform 0.4s ease, border-color 0.3s ease, background 0.3s ease;
          text-decoration: none;
        }

        .scroll-up.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .scroll-up:hover {
          transform: translateY(-4px);
          background: rgba(14, 112, 196, 0.15);
          border-color: #6f95ff;
        }

        .scroll-progress {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transform: rotate(-90deg);
        }

        .scroll-progress circle {
          fill: none;
          stroke-width: 2;
        }

        .scroll-progress .track {
          stroke: rgba(255, 255, 255, 0.12);
        }

        .scroll-progress .bar {
          stroke: #1C64EC;
          transition: stroke-dashoffset 0.2s ease;
        }

        .scroll-up-icon {
          position: relative;
          z-index: 1;
          color: #1C64EC;
          transition: color 0.3s ease;
        }

        .scroll-up:hover .scroll-up-icon {
          color: #ffffff;
        }
      `}</style>

      {(() => {
        const radius = 20;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - progress);
        return (
      <a
        className={`scroll-up${visible ? " show" : ""}`}
        href="#"
        aria-label="Back to top"
        onClick={scrollToTop}
      >
        <svg className="scroll-progress" viewBox="0 0 48 48">
          <circle className="track" cx="24" cy="24" r={radius} />
          <circle
            className="bar"
            cx="24"
            cy="24"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <FaArrowUp size={14} className="scroll-up-icon" aria-hidden="true" />
      </a>
        );
      })()}
    </>
  );
};

export default ScrollToTop;
