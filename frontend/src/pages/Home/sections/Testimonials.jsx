import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { getTestimonials } from "@/api/Apis";
import "swiper/css";
import useScrollReveal from "@/hooks/useScrollReveal";
import { sortContentItems } from "@/lib/sortContentItems";

/* ─── Star rating ─── */
const Stars = ({ count = 5, filled = 5 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill={i < filled ? "#f5a623" : "none"}
        stroke="#f5a623"
        strokeWidth="1.5"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
);

/* ─── Decorative quote mark ─── */
const QuoteMark = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 45"
    className="testimonial-quote-float absolute top-4 right-5 w-14 h-10 opacity-10"
    fill="#3c72fc"
  >
    <path d="M0 45V27C0 11.167 8.333 2 25 0l3 5C20.667 7 17 12.333 17 22h12v23H0zm33 0V27C33 11.167 41.333 2 58 0l3 5C53.667 7 50 12.333 50 22h10v23H33z" />
  </svg>
);

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const headingRef = useScrollReveal();
  const cardsRef = useScrollReveal();

  const minTestimonialSlides = 5;

  const displayTestimonials = useMemo(() => {
    if (testimonials.length === 0) return [];
    if (testimonials.length >= minTestimonialSlides) return testimonials;

    return Array.from({ length: minTestimonialSlides }, (_, index) => {
      const item = testimonials[index % testimonials.length];
      return {
        ...item,
        id: `${item.id || "testimonial"}-${index}`,
      };
    });
  }, [testimonials]);

  const canLoop = displayTestimonials.length > 1;

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const imageSrc = useCallback(
    (value) => {
      if (!value) return "https://placehold.co/100x100/151327/ffffff?text=User";
      if (value.startsWith("http")) return value;
      if (value.startsWith("/uploads/")) return apiRoot + value;
      return apiRoot + "/uploads/" + value;
    },
    [apiRoot],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getTestimonials();
        const mapped = sortContentItems(Array.isArray(data) ? data : []).map(
          (item) => ({
            id: item._id,
            name: item.name,
            role: item.role,
            text: item.message,
            stars: item.rating || 5,
            image: imageSrc(item.avatar),
          }),
        );
        setTestimonials(mapped);
      } catch (error) {
        console.error(error);
        setTestimonials([]);
      }
    };

    load();
  }, [imageSrc]);

  return (
    <>
      <style>
        {`
          @keyframes testimonialQuoteFloat {
            0% {
              transform: translateX(-12px);
            }
            50% {
              transform: translateX(12px);
            }
            100% {
              transform: translateX(-12px);
            }
          }

          .testimonial-quote-float {
            animation: testimonialQuoteFloat 4.2s ease-in-out infinite;
            will-change: transform;
          }

          .testimonial-swiper .swiper-slide {
            height: auto;
            display: flex;
          }
        `}
      </style>
      <section className="relative py-24 bg-[#151327] overflow-hidden">
        {/* Subtle glow blobs */}

        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
          {/* ── Section heading ── */}
          <div ref={headingRef} className="sr-hidden sr-up text-center mb-14">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc] mb-4">
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
                  stroke="#3C72FC"
                  strokeWidth="1.5"
                />
                <mask id="faq-mask" fill="white">
                  <path d="M3 5.9978C3 3.78866 4.79086 1.9978 7 1.9978H13C15.2091 1.9978 17 3.78866 17 5.9978C17 8.20694 15.2091 9.9978 13 9.9978H7C4.79086 9.9978 3 8.20694 3 5.9978Z" />
                </mask>
                <path
                  d="M3 5.9978C3 2.96024 5.46243 0.497803 8.5 0.497803H11.5C14.5376 0.497803 17 2.96024 17 5.9978C17 4.61709 15.2091 3.4978 13 3.4978H7C4.79086 3.4978 3 4.61709 3 5.9978ZM17 5.9978C17 9.03537 14.5376 11.4978 11.5 11.4978H8.5C5.46243 11.4978 3 9.03537 3 5.9978C3 7.37851 4.79086 8.4978 7 8.4978H13C15.2091 8.4978 17 7.37851 17 5.9978Z"
                  fill="#3C72FC"
                  mask="url(#faq-mask)"
                />
              </svg>
              Testimonials
            </p>

            <h2 className="text-3xl md:text-[42px] font-bold text-white leading-snug">
              What Our IT Clients Say About Us
            </h2>
          </div>

          {/* ── Testimonials slider ── */}
          <div ref={cardsRef} className="sr-hidden sr-up">
            <Swiper
              slidesPerView={1}
              modules={[Autoplay]}
              loop={canLoop}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              spaceBetween={10}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 1.5,
                  spaceBetween: 28,
                },
                1024: {
                  slidesPerView: 2,
                  spaceBetween: 32,
                },
                1280: {
                  slidesPerView: 2,
                  spaceBetween: 40,
                },
                1440: {
                  slidesPerView: 2.3,
                  spaceBetween: 50,
                },
              }}
              className="testimonial-swiper"
            >
              {displayTestimonials.map((t) => (
                <SwiperSlide key={t.id}>
                  <div
                    className="group relative h-full overflow-hidden border border-white/8 p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#3c72fc]/45 hover:shadow-[0_22px_45px_rgba(0,0,0,0.35)]"
                    style={{ background: "#16142c" }}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_80%_0%,rgba(60,114,252,0.16),transparent_45%)]" />
                    <QuoteMark />

                    {/* Stars */}
                    <div className="mb-5">
                      <Stars count={5} filled={t.stars} />
                    </div>

                    {/* Text */}
                    <p className="text-white/75 text-[15px] leading-relaxed mb-7">
                      {t.text}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-white/10 mb-6 transition-colors duration-500 group-hover:bg-[#3c72fc]/35" />

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <img
                        src={t.image}
                        alt={t.name}
                        className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#3c72fc]/40 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div>
                        <h4 className="text-white font-bold text-[16px] leading-tight">
                          {t.name}
                        </h4>
                        <p className="text-white/50 text-sm mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;
