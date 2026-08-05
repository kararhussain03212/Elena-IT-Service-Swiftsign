import React, { useEffect, useState } from "react";
import faqImage from "@/assets/images/faq/faq-image.png";
import faqShape from "@/assets/images/shape/faq-shape.png";
import faqLine from "@/assets/images/shape/faq-line.png";
import useScrollReveal from "@/hooks/useScrollReveal";


const FAQ = ({ content = {} }) => {
  const items = Array.isArray(content.items)
    ? content.items.filter(
        (item) =>
          item?.isActive !== false &&
          String(item?.question || "").trim() &&
          String(item?.answer || "").trim(),
      )
    : [];
  const firstItemId = items[0]?.id ?? null;
  const [openId, setOpenId] = useState(firstItemId);
  const imgRef = useScrollReveal();
  const faqsRef = useScrollReveal();
  const toggle = (id) => setOpenId(openId === id ? null : id);

  const badge = String(content.badge || "").trim();
  const heading = String(content.heading || "").trim();

  useEffect(() => {
    setOpenId(firstItemId);
  }, [firstItemId]);

  if (!badge && !heading && items.length === 0) return null;

  return (
    <section className="relative isolate py-28 bg-white overflow-hidden">
      {/* ── Decorative shapes ── */}
      {faqShape && (
        <img
          src={faqShape}
          alt=""
          aria-hidden="true"
          className="hidden md:block absolute top-0 right-0 z-0 pointer-events-none select-none moveLR"
        />
      )}
      {faqLine && (
        <img
          src={faqLine}
          alt=""
          aria-hidden="true"
          className="hidden lg:block absolute left-[2%] xl:left-[5%] top-[20%] w-[55px] xl:w-[75px] z-0 pointer-events-none select-none moveLR"
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div className="flex items-center justify-center flex-col lg:flex-row lg:items-start gap-12 lg:gap-16">
          {/* ── Left: person image ── */}
          <div
            ref={imgRef}
            className="sr-hidden sr-left relative shrink-0 w-full max-w-[400px] lg:max-w-[420px] flex items-end justify-center lg:sticky lg:top-28 h-[420px] sm:h-[460px] md:h-[520px] lg:h-[540px]"
          >
            {/* Dark blue blob behind the person */}
            <div
              className="absolute inset-x-4 bottom-0 top-6 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] z-0"
              style={{
                background:
                  "radial-gradient(ellipse at 60% 40%, #1e2a6e 0%, #0d1240 100%)",
              }}
            />
            <img
              src={faqImage}
              alt="IT professional"
              className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-2xl"
            />
          </div>

          {/* ── Right: FAQ content ── */}
          <div ref={faqsRef} className="sr-hidden sr-right flex-1 w-full">
            {/* Section label */}
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4] mb-3">
              <svg
                className="mr-1"
                width="20"
                height="12"
                viewBox="0 0 20 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.75"
                  y="0.747803"
                  width="18.5"
                  height="10.5"
                  rx="5.25"
                  stroke="#0E70C4"
                  strokeWidth="1.5"
                />
                <mask id="faq-mask" fill="white">
                  <path d="M3 5.9978C3 3.78866 4.79086 1.9978 7 1.9978H13C15.2091 1.9978 17 3.78866 17 5.9978C17 8.20694 15.2091 9.9978 13 9.9978H7C4.79086 9.9978 3 8.20694 3 5.9978Z" />
                </mask>
                <path
                  d="M3 5.9978C3 2.96024 5.46243 0.497803 8.5 0.497803H11.5C14.5376 0.497803 17 2.96024 17 5.9978C17 4.61709 15.2091 3.4978 13 3.4978H7C4.79086 3.4978 3 4.61709 3 5.9978ZM17 5.9978C17 9.03537 14.5376 11.4978 11.5 11.4978H8.5C5.46243 11.4978 3 9.03537 3 5.9978C3 7.37851 4.79086 8.4978 7 8.4978H13C15.2091 8.4978 17 7.37851 17 5.9978Z"
                  fill="#0E70C4"
                  mask="url(#faq-mask)"
                />
              </svg>
              {badge}
            </p>

            {/* Heading */}
            <h2 className="text-3xl md:text-[38px] font-bold text-[#0B1B3A] leading-snug mb-8 max-w-[500px]">
              {heading}
            </h2>

            {/* Accordion */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(14,112,196,0.15)",
              }}
            >
              {items.map((faq, idx) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`${idx !== 0 ? "border-t border-black/10" : ""}`}
                  >
                    {/* Question row */}
                    <button
                      onClick={() => toggle(faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left group/faq"
                    >
                      <span
                        className={`font-semibold text-[15px] pr-4 transition-colors duration-200 ${
                          isOpen ? "text-[#0E70C4]" : "text-[#0B1B3A]"
                        }`}
                      >
                        {faq.question}
                      </span>
                      {/* +/- toggle */}
                      <span
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors duration-200 ${
                          isOpen
                            ? "bg-[#0E70C4] text-white"
                            : "bg-transparent border border-black/20 text-[#0B1B3A]/60"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {/* Answer — CSS grid trick: animates exact content height, no page jump */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        transition: "grid-template-rows 300ms ease",
                      }}
                    >
                      <div style={{ overflow: "hidden", minHeight: 0 }}>
                        <p className="px-5 pb-5 text-[#0B1B3A]/70 text-[14.5px] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
