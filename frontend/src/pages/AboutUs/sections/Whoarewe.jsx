import React, { useMemo } from "react";
import { FaCheck } from "react-icons/fa6";
import aboutCircle from "@/assets/images/shape/about-two-circle.png";
import aboutShape from "@/assets/images/shape/about-two-shape.png";
import useScrollReveal from "@/hooks/useScrollReveal";

const Whoarewe = ({ content = {} }) => {
  const imgRef = useScrollReveal();
  const contentRef = useScrollReveal();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\/?backend\/uploads\//i.test(raw)) {
      const fileName = raw.split("/").filter(Boolean).pop();
      return fileName ? `${apiRoot}/uploads/${fileName}` : "";
    }
    if (/^\/?uploads\/about\//i.test(raw)) {
      const fileName = raw.split("/").filter(Boolean).pop();
      return fileName ? `${apiRoot}/uploads/${fileName}` : "";
    }
    if (raw.startsWith("/uploads/")) return apiRoot + raw;
    if (/^uploads\//i.test(raw)) return apiRoot + "/" + raw;
    return raw;
  };

  const badge = String(content?.badge || "").trim();
  const heading = String(content?.heading || "").trim();
  const description = String(content?.description || "").trim();

  const highlightItems = Array.isArray(content?.highlights)
    ? content.highlights
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  const mainImage = resolveImage(content?.mainImage);
  const smallImage = resolveImage(content?.smallImage);

  const hasVisibleContent =
    Boolean(badge || heading || description || mainImage || smallImage) ||
    highlightItems.length > 0;

  if (!hasVisibleContent) return null;

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28 lg:wrap">
      <img
        src={aboutShape}
        alt=""
        className="absolute top-50 right-0 w-[200px] md:w-[260px] lg:w-[340px] opacity-60 pointer-events-none select-none moveUD"
      />

      <div className="pointer-events-none absolute inset-0 " />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div
            ref={imgRef}
            className="sr-hidden sr-left relative flex items-center justify-center"
          >
            <img
              src={aboutCircle}
              alt=""
              className="absolute -left-10 top-1/2 w-[280px] -translate-y-1/2 pointer-events-none select-none opacity-90 sm:w-[340px] md:w-[380px] rotateCircle"
            />
            <div className="relative z-10">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt="Team at work"
                  className="w-[320px] object-cover shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:w-[360px] md:w-[420px] "
                />
              ) : null}
              {smallImage ? (
                <img
                  src={smallImage}
                  alt="Collaboration"
                  className="absolute -bottom-6 right-0 w-[180px] translate-x-1/3  border-4 border-white/10 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.45)] sm:w-[200px] md:w-[230px] lg:right-4 lg:translate-x-0 lg:w-[200px]"
                />
              ) : null}
            </div>
          </div>

          <div ref={contentRef} className="sr-hidden sr-right">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4]">
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
                  stroke="#0E70C4"
                  strokeWidth="1.5"
                />
                <mask id="path-2-inside-1_668_146" fill="white">
                  <path d="M3 6C3 3.79086 4.79086 2 7 2H13C15.2091 2 17 3.79086 17 6C17 8.20914 15.2091 10 13 10H7C4.79086 10 3 8.20914 3 6Z" />
                </mask>
                <path
                  d="M3 6C3 2.96243 5.46243 0.5 8.5 0.5H11.5C14.5376 0.5 17 2.96243 17 6C17 4.61929 15.2091 3.5 13 3.5H7C4.79086 3.5 3 4.61929 3 6ZM17 6C17 9.03757 14.5376 11.5 11.5 11.5H8.5C5.46243 11.5 3 9.03757 3 6C3 7.38071 4.79086 8.5 7 8.5H13C15.2091 8.5 17 7.38071 17 6ZM3 10V2V10ZM17 2V10V2Z"
                  fill="#0E70C4"
                  mask="url(#path-2-inside-1_668_146)"
                />
              </svg>
              {badge}
            </p>

            <h2 className="mt-5 text-4xl font-bold leading-tight text-[#0B1B3A] md:text-[40px] md:leading-[1.12]">
              {heading}
            </h2>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#0B1B3A]/70 md:text-[16px]">
              {description}
            </p>

            <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              {highlightItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0E70C4] text-xs text-white">
                    <FaCheck />
                  </span>
                  <span className="text-[15px] font-semibold text-[#0B1B3A]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Whoarewe;
