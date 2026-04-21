import React from "react";
import Button from "@/components/Button";
import icon from "@/assets/images/shape/quote-shape.png";
import icon1 from "@/assets/images/shape/quote-shape2.png";
import useScrollReveal from "@/hooks/useScrollReveal";



const InTouch = ({ content = {} }) => {
  const contentRef = useScrollReveal();
  const badge = String(content?.badge || "").trim();
  const heading = String(content?.heading || "").trim();
  const buttonText = String(content?.buttonText || "").trim();
  const buttonTo = String(content?.buttonTo || "").trim();

  const hasContent = Boolean(badge || heading || (buttonText && buttonTo));
  if (!hasContent) return null;
  return (
    <section className="relative bg-[#0b0a1a] pb-0 ">
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div
          className="relative z-10 flex flex-col flex-wrap sm:flex-row items-center justify-between gap-6 px-8 md:px-12 py-15 overflow-hidden"
          style={{
            background:
              "linear-gradient(100deg, #3c72fc 0%, #1a45c7 60%, #0f2a9e 100%)",
          }}
        >
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none select-none">
            <img
              src={icon1}
              alt=""
              className="w-[200px] md:w-[260px] lg:w-[340px] opacity-70 scaleUpDown"
            />
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none select-none">
            <img
              src={icon}
              alt=""
              className="w-[200px] md:w-[260px] lg:w-[340px] opacity-70 moveLR"
            />
          </div>

          {/* Text */}
          <div ref={contentRef} className="sr-hidden sr-left relative z-10">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white mb-2">
              <svg
                className="me-1"
                width="20"
                height="12"
                viewBox="0 0 20 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="18.5"
                  height="10.5"
                  rx="5.25"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <mask id="path-2-inside-1_668_146" fill="white">
                  <path d="M3 6C3 3.79086 4.79086 2 7 2H13C15.2091 2 17 3.79086 17 6C17 8.20914 15.2091 10 13 10H7C4.79086 10 3 8.20914 3 6Z" />
                </mask>
                <path
                  d="M3 6C3 2.96243 5.46243 0.5 8.5 0.5H11.5C14.5376 0.5 17 2.96243 17 6C17 4.61929 15.2091 3.5 13 3.5H7C4.79086 3.5 3 4.61929 3 6ZM17 6C17 9.03757 14.5376 11.5 11.5 11.5H8.5C5.46243 11.5 3 9.03757 3 6C3 7.38071 4.79086 8.5 7 8.5H13C15.2091 8.5 17 7.38071 17 6ZM3 10V2V10ZM17 2V10V2Z"
                  fill="white"
                  mask="url(#path-2-inside-1_668_146)"
                />
              </svg>
              {badge}
            </p>
            <h2 className="text-2xl md:text-[32px] font-bold text-white leading-snug">
              {heading}
            </h2>
          </div>

          <div className="relative z-10">
            {buttonText && buttonTo ? (
              <Button
                text={buttonText}
                to={buttonTo}
                className="min-h-[48px] max-[575px]:px-[22px] max-[575px]:py-[12px]"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InTouch;
