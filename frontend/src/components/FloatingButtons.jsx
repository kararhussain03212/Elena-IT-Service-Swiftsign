import { useState, useEffect } from "react";
import { FaArrowUp, FaWhatsapp } from "react-icons/fa";

const FloatingButtons = ({ whatsappNumber = "+1234567890" }) => {
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

  const cleanNumber = (whatsappNumber || "").replace(/[^0-9]/g, "");
  const whatsappUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}`
    : "https://wa.me/";

  return (
    <div
      className="fixed right-7 bottom-7 z-[999] flex flex-col items-center gap-3.5"
      style={{ pointerEvents: "none" }}
    >
      {/* Floating WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_rgba(37,211,102,0.45)] transition-all duration-300 hover:bg-[#20ba5a] hover:scale-110 active:scale-95"
        style={{ pointerEvents: "auto" }}
      >
        <FaWhatsapp size={30} />
      </a>

      {/* Scroll to top button */}
      <button
        className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-none bg-[rgba(10,10,30,0.75)] shadow-[0_12px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-400 ${
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
          viewBox="0 0 42 42"
        >
          <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <circle
            cx="21"
            cy="21"
            r="18"
            fill="none"
            stroke="#1C64EC"
            strokeWidth="2"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.2s ease" }}
          />
        </svg>
        <FaArrowUp size={13} className="relative z-10 text-[#1C64EC] transition-colors duration-300" />
      </button>
    </div>
  );
};

export default FloatingButtons;
