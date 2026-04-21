import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

const FloatingButtons = () => {
  const [scrollVisible, setScrollVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;
      const percent = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollVisible(scrollTop > 300);
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
    <div
      className="fixed right-6 bottom-6 z-[999] flex flex-col items-center gap-3"
      style={{ pointerEvents: "none" }}
    >
      {/* Scroll to top button */}
      <button
        className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border-none bg-[rgba(10,10,30,0.65)] shadow-[0_14px_30px_rgba(0,0,0,0.35)] transition-all duration-400 ${
          scrollVisible
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-5 opacity-0 invisible"
        }`}
        style={{ pointerEvents: "auto" }}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 48 48"
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#3c72fc"
            strokeWidth="2"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.2s ease" }}
          />
        </svg>
        <FaArrowUp size={14} className="relative z-10 text-[#3c72fc] transition-colors duration-300" />
      </button>

      {/* WhatsApp button */}
      <a
        href="https://wa.me/923158399446"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_rgba(37,211,102,0.35)] transition-transform duration-300 hover:scale-110"
        style={{ pointerEvents: "auto" }}
      >
        <i className="fa-brands fa-whatsapp text-[32px]" />
      </a>
    </div>
  );
};

export default FloatingButtons;
