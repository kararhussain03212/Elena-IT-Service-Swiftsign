import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Button from "../../../components/Button";
import API from "@/api/axios";
import { sortContentItems } from "@/lib/sortContentItems";
import "swiper/css";

const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // CHANGE: normalize API root once
  // WHY: image can be filename, /uploads path, or full URL
  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (image) => {
    if (!image) return "";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads/")) return apiRoot + image;
    return encodeURI(apiRoot + "/uploads/" + image);
  };

  const resolveVideo = (video) => {
    if (!video) return "";
    if (video.startsWith("http")) return video;
    if (video.startsWith("/uploads/")) return apiRoot + video;
    return encodeURI(apiRoot + "/uploads/" + video);
  };

  useEffect(() => {
    const loadSliders = async () => {
      try {
        const { data } = await API.get("/sliders");
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.sliders)
            ? data.sliders
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setSlides(sortContentItems(normalized));
      } catch (error) {
        console.error("Slider load failed:", error);
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, []);

  if (loading) {
    return (
      <section className="relative h-svh min-h-[680px] w-full overflow-hidden bg-[#0f0d1d] text-white md:min-h-[760px]">
        <div className="absolute inset-0 grid place-items-center text-white/70">
          Loading slider...
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-svh min-h-[680px] w-full overflow-hidden bg-[#0f0d1d] text-white md:min-h-[760px]">
        {/* CHANGE: video restored as default background */}
        {/* WHY: hero should still look complete when no image is provided */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/videos/Global.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 grid place-items-center text-white/70">
          No slider data found. Add from admin.
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-svh min-h-[680px] w-full overflow-hidden text-white md:min-h-[760px]">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={slides.length > 1}
        speed={700}
        className="h-full w-full"
      >
        {slides.map((slide, index) => {
          const bgImage = resolveImage(slide.image);
          const bgVideo = resolveVideo(slide.video);
          const ctaText = (slide.buttonText || "").trim() || "Get Started";
          const ctaLink = (slide.buttonLink || "").trim() || "/services";

          return (
            <SwiperSlide
              key={`${slide._id || slide.title || "slide"}-${index}`}
              className="relative"
            >
              {bgImage ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
              ) : (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                >
                  <source src="/videos/Global.mp4" type="video/mp4" />
                </video>
              )}

              {bgVideo ? (
                <video
                  key={bgVideo}
                  className={`absolute inset-0 h-full w-full object-cover ${
                    bgImage ? "opacity-90" : ""
                  }`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={bgImage || undefined}
                >
                  <source src={bgVideo} type="video/mp4" />
                </video>
              ) : null}

              <div className="absolute inset-0 bg-black/55" />

              <div className="relative z-10 flex h-full items-center justify-center px-4 py-16">
                <div className="mx-auto flex min-h-[440px] w-full max-w-6xl flex-col items-center justify-center px-4 py-10 text-center md:min-h-[520px] md:px-8 md:py-14">
                  <span className="inline-block bg-white/20 px-5 py-2 text-xs font-bold tracking-[0.08em] md:text-[18px]">
                    {slide.heading || "Welcome to Swift Sign IT"}
                  </span>

                  <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-[0.01em] md:mt-9 md:text-6xl md:leading-[1.15]">
                    {slide.title || "Your Heading"}
                  </h1>

                  <p className="mx-auto mt-7 max-w-4xl px-2 text-base leading-relaxed tracking-[0.01em] text-gray-200 md:mt-8 md:text-xl">
                    {slide.subtitle || "Your slider description"}
                  </p>

                  <div className="mt-8 flex justify-center">
                    <Button text={ctaText} to={ctaLink} />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
};

export default Hero;
