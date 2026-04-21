import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { getServices } from "@/api/Apis";
import serviceItemShape from "../../../assets/images/shape/service-two-item-shape.png";
import useScrollReveal from "@/hooks/useScrollReveal";
import { sortContentItems } from "@/lib/sortContentItems";

const Services = ({ content = {} }) => {
  const swiperRef = useRef(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const headingRef = useScrollReveal();
  const sliderRef = useScrollReveal();
  const badge = String(content?.badge || "").trim();
  const heading = String(content?.heading || "").trim();
  const shouldRenderSection = Boolean(badge || heading);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/800x500/1b1832/ffffff?text=Service";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    if (!shouldRenderSection) {
      setServices([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await getServices();
        setServices(sortContentItems(Array.isArray(res.data) ? res.data : []));
      } catch (error) {
        console.error("Service load failed", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [shouldRenderSection]);

  // Loop is only safe when there are enough cards for the widest breakpoint.
  const canLoop = services.length >= 4;
  const shouldAutoplay = services.length > 1;

  if (!shouldRenderSection) return null;

  if (loading) {
    return (
      <section className="py-20 bg-[#0f0d1d] text-white">
        <div className="mx-auto w-full max-w-[1270px] px-4">
          Loading services...
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20 text-white md:py-28 bg-[#0f0d1d]">
      <div className="reveal-on-scrollrelative z-10 mx-auto w-full max-w-[1270px] px-4 md:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc]">
          {badge}
        </p>

        <div ref={headingRef} className="sr-hidden sr-up mb-8 mt-5">
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl md:text-[38px]">
            {heading}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#3c72fc] text-[#3c72fc] hover:bg-[#3c72fc] hover:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3c72fc] text-white hover:bg-[#2d5fe0]"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div ref={sliderRef} className="sr-hidden sr-up">
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            modules={[Autoplay]}
            loop={canLoop}
            rewind={!canLoop}
            autoplay={
              shouldAutoplay
                ? {
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                  }
                : false
            }
            spaceBetween={18}
            slidesPerView={1.05}
            breakpoints={{
              640: { slidesPerView: 1.15, spaceBetween: 18 },
              768: { slidesPerView: 2, spaceBetween: 22 },
              1024: { slidesPerView: 2.5, spaceBetween: 24 },
              1280: { slidesPerView: 3.2, spaceBetween: 24 },
            }}
            className="mt-8 h-[480px] w-full"
          >
            {services.map((service, index) => (
              <SwiperSlide
                key={service._id || service.slug || index}
                className="h-full"
              >
                <article className="group relative flex h-full flex-col overflow-hidden rounded-[60px] rounded-tr-none rounded-bl-none bg-[#1b1832]">
                  <img
                    src={resolveImage(service.image)}
                    alt={service.title}
                    className="h-[210px] w-full object-cover"
                  />

                  <div className="relative flex flex-1 flex-col px-6 pb-7 pt-14">
                    <img
                      src={serviceItemShape}
                      alt=""
                      className="pointer-events-none absolute right-0 top-3 w-[145px] opacity-35"
                    />

                    <h3 className="text-[24px] font-bold leading-tight text-white">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                      {service.shortDescription || service.description}
                    </p>

                    <Link
                      to={"/services/" + service.slug}
                      className="mt-auto inline-flex items-center gap-2 pt-5 text-[15px] font-semibold text-[#3c72fc] hover:text-white"
                    >
                      <span>Read More</span>
                      <span>-&gt;</span>
                    </Link>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Services;
