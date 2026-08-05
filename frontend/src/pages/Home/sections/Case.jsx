import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import Btn from "@/components/Button";
import { getProjects } from "@/api/Apis";
import useScrollReveal from "@/hooks/useScrollReveal";
import { sortContentItems } from "@/lib/sortContentItems";

/* ─── Arrow icon ─── */
const ArrowIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

const Case = ({ content = {} }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const swiperRef = useRef(null);
  const sliderRef = useScrollReveal();
  const headingRef = useScrollReveal();

  const badge = String(content.badge || "").trim();
  const heading = String(content.heading || "").trim();
  const ctaText = String(content.ctaText || "").trim();
  const ctaTo = String(content.ctaTo || "").trim();
  const shouldRenderSection = Boolean(badge || heading || ctaText);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value) return "https://placehold.co/800x600/0B1B3A/ffffff?text=Project";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    if (!shouldRenderSection) return;
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        setProjects(sortContentItems(Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [shouldRenderSection]);

  const canLoop = projects.length >= 5;

  const handlePrev = () => {
    swiperRef.current?.swiper?.slidePrev();
  };

  const handleNext = () => {
    swiperRef.current?.swiper?.slideNext();
  };

  if (!shouldRenderSection) return null;

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Subtle grid/circuit background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #0E70C4 0%, transparent 60%), radial-gradient(circle at 80% 20%, #0E70C4 0%, transparent 50%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1270px] px-6 md:px-10">
        {/* ── Header row ── */}
        <div ref={headingRef} className="sr-hidden sr-up">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4] mb-3">
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
            <h3>{badge}</h3>
          </div>
          <h1 className="text-3xl md:text-[38px] font-bold text-[#0B1B3A] py-8 ">
            {heading}
          </h1>
        </div>
        {/* Prev / Next nav buttons */}
        <div className="flex items-center gap-3 shrink-0 pb-10">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#0E70C4] text-[#0E70C4] transition-colors hover:bg-[#0E70C4] hover:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0E70C4] text-white transition-colors hover:bg-[#2d5fe0]"
          >
            <ChevronRight size={22} />
          </button>
          {ctaText && ctaTo ? (
            <Btn
              text={ctaText}
              to={ctaTo}
              className="ml-auto text-sm font-medium text-[#0E70C4] hover:text-white transition-colors"
            />
          ) : null}
        </div>

        {/* ── Swiper Card Slider ── */}
        <div ref={sliderRef} className="sr-hidden sr-up">
          <Swiper
            ref={swiperRef}
            slidesPerView={1}
            spaceBetween={24}
            loop={canLoop}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              425: {
                slidesPerView: 1.2,
                spaceBetween: 20,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2.5,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3.2,
                spaceBetween: 24,
              },
              1440: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            modules={[Navigation, Autoplay]}
            className="case-swiper"
          >
            {loading ? (
              <SwiperSlide>
                <div className="h-[420px] grid place-items-center text-[#0B1B3A]/60">
                  Loading projects...
                </div>
              </SwiperSlide>
            ) : (
              projects.map((item, index) => (
                <SwiperSlide key={item._id || index}>
                  <Link
                    to={"/projects/" + item._id}
                    className="group relative block overflow-hidden border border-white/10 bg-[#0b1226]"
                    style={{ width: "100%", height: 420 }}
                    aria-label={`View ${item.title}`}
                  >
                    {/* Image */}
                    <img
                      src={resolveImage(item.cover_image || item.coverImage)}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />

                    {/* Gradient overlay — always present, deepens on hover */}
                    <div
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(10,14,50,0.92) 0%, rgba(10,14,50,0.55) 45%, rgba(10,14,50,0.10) 100%)",
                      }}
                    />

                    {/* Hover blue glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2f6bff] via-[#2f6bff]/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-90" />

                    {/* Hover border glow */}
                    <div className="absolute border-[#0E70C4]/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    {/* Bottom label */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
                      <span className="block text-[#a6c2ff] text-xs font-semibold uppercase tracking-wider mb-1 transition-colors duration-300 group-hover:text-white">
                        {item.category}
                      </span>
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-white font-bold text-lg leading-snug transition-colors duration-300 group-hover:text-white"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </h3>
                        <span className="shrink-0 ml-3 w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-[#0E70C4] group-hover:border-[#0E70C4] group-hover:translate-x-1">
                          <ArrowIcon className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div>
      </div>

      <style>{`
        .case-swiper {
          width: 100%;
          padding-bottom: 50px;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default Case;
