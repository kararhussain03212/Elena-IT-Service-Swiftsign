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

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (image) => {
    if (!image)
      return "https://placehold.co/800x600/0F2350/0E70C4?text=Elena+IT+Services";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads/")) return apiRoot + image;
    return encodeURI(apiRoot + "/uploads/" + image);
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

        // If no sliders from API, use default sliders with Unsplash images
        if (normalized.length === 0) {
          setSlides([
            {
              _id: "slide-1",
              heading: "CYBER SECURITY & CLOUD",
              title: "Securing Your Digital Future",
              subtitle:
                "Protect your business with enterprise-grade security, cloud computing, and cutting-edge solutions.",
              buttonText: "Get Started",
              buttonLink: "/services",
              image:
                "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            },
            {
              _id: "slide-2",
              heading: "IT CONSULTING & SOLUTIONS",
              title: "Transform Your Business Today",
              subtitle:
                "Expert IT consulting and innovative solutions to drive your business forward and maximize growth potential.",
              buttonText: "Explore Solutions",
              buttonLink: "/services",
              image:
                "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            },
          ]);
        } else {
          setSlides(sortContentItems(normalized));
        }
      } catch (error) {
        console.error("Slider load failed:", error);
        // Use default slides on error
        setSlides([
          {
            _id: "slide-1",
            heading: "CYBER SECURITY & CLOUD",
            title: "Securing Your Digital Future",
            subtitle: "Protect your business with enterprise-grade security, cloud computing, and cutting-edge solutions.",
            buttonText: "Get Started",
            buttonLink: "/services",
            image: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            _id: "slide-2",
            heading: "IT CONSULTING & SOLUTIONS",
            title: "Transform Your Business Today",
            subtitle: "Expert IT consulting and innovative solutions to drive your business forward and maximize growth potential.",
            buttonText: "Explore Solutions",
            buttonLink: "/services",
            image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSliders();
  }, []);

  if (loading) {
    return (
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#0F2350]">
        <div className="absolute inset-0 grid place-items-center text-white/70">
          Loading...
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0F2350]">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={slides.length > 1}
        speed={700}
        className="h-full w-full"
      >
        {slides.map((slide, index) => {
          const bgImage = resolveImage(slide.image);
          const ctaText = (slide.buttonText || "").trim() || "Explore";
          const ctaLink = (slide.buttonLink || "").trim() || "/services";

          return (
            <SwiperSlide
              key={`${slide._id || slide.title || "slide"}-${index}`}
            >
              <div
                className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
              >
                {/* Gradient scrim for legible text regardless of image content */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B3A]/90 via-[#0B1B3A]/55 to-[#0B1B3A]/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A]/70 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 mx-auto flex h-full min-h-screen w-full max-w-[1340px] flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-20 py-32 md:py-44">
                  {/* Counter + Category */}
                  <div className="mb-6 sm:mb-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 backdrop-blur-md shadow-md">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {String(index + 1).padStart(2, "0")}/
                        {String(slides.length).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="inline-block rounded-full bg-[#04B4D4]/15 px-5 py-2 text-xs sm:text-sm font-bold tracking-widest text-[#04B4D4] uppercase border border-[#04B4D4]/40 backdrop-blur-md shadow-lg">
                      {slide.heading || "Elena IT Services"}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1 className="max-w-4xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[88px] font-black leading-[1.06] text-white tracking-tight">
                    {slide.title || "Empowering Your Digital Future"}
                  </h1>

                  {/* Description */}
                  <p className="mt-6 max-w-2xl text-lg sm:text-xl lg:text-2xl font-normal leading-relaxed text-white/90">
                    {slide.subtitle ||
                      "Elena IT Services delivers premium IT consulting and business services."}
                  </p>

                  {/* CTA Button */}
                  <div className="mt-10 sm:mt-12">
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
