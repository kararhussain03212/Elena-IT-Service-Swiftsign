import React from "react";
import { Link } from "react-router-dom";
import { FaAnglesRight } from "react-icons/fa6";
import shapeLeft from "@/assets/images/banner/inner-banner-shape1.png";
import shapeLeftTop from "@/assets/images/banner/inner-banner-shape2.png";
import shapeRight from "@/assets/images/banner/inner-banner-shape3.png";
import useScrollReveal from "@/hooks/useScrollReveal";

const Banner = ({ title = "About Us", crumbs = null }) => {
  const leftShapeTopRef = useScrollReveal({ threshold: 0.05 });
  const leftShapeBottomRef = useScrollReveal({ threshold: 0.05 });
  const rightShapeRef = useScrollReveal({ threshold: 0.05 });
  const contentRef = useScrollReveal({ threshold: 0.1 });

  const breadcrumbItems =
    Array.isArray(crumbs) && crumbs.length > 0
      ? crumbs
      : [{ label: "Home", to: "/" }, { label: title }];

  return (
    <section className="relative overflow-hidden">
      {/* Brand gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #1C64EC 0%, #107CE0 55%, #04B4D4 100%)",
        }}
      />

      {/* Subtle light overlay for depth */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
        }}
      />

      {/* Left solid shape */}
      <img
        ref={leftShapeTopRef}
        src={shapeLeftTop}
        alt=""
        className="sr-hidden sr-right absolute left-0 bottom-1 pointer-events-none select-none opacity-20"
      />
      <img
        ref={leftShapeBottomRef}
        src={shapeLeft}
        alt=""
        className="sr-hidden sr-right absolute left-0 bottom-0 pointer-events-none select-none opacity-20"
      />

      {/* Right circular line shape */}
      <img
        ref={rightShapeRef}
        src={shapeRight}
        alt=""
        className="sr-hidden sr-left absolute right-0 top-1/2 -translate-y-1/2 w-[360px] sm:w-[460px] md:w-[560px] pointer-events-none select-none moveLR opacity-20"
      />

      <div
        ref={contentRef}
        className="sr-hidden sr-up relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-15 py-24 md:py-36"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white">{title}</h2>
        <div className="mt-3 flex items-center gap-2 text-white/75 text-sm md:text-base">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-white font-medium" : ""}>
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <FaAnglesRight
                    className="text-white/50"
                    size={12}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Banner;
