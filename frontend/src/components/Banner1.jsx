import React from "react";
import { Link } from "react-router-dom";
import useScrollReveal from "@/hooks/useScrollReveal";

const Banner1 = ({ title = "" }) => {
  const contentRef = useScrollReveal({ threshold: 0.1 });

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

      {/* Subtle hex pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
        }}
      />

      <div
        ref={contentRef}
        className="sr-hidden sr-up relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-15 py-24 md:py-36"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white">{title}</h2>
        <div className="mt-3 flex items-center gap-2 text-white/75 text-sm md:text-base">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-white/50">»</span>
          <Link to="/Services" className="hover:text-white transition-colors">
            Service
          </Link>
          <span className="text-white/50">»</span>
          <span className="text-white font-medium">{title}</span>
        </div>
      </div>
    </section>
  );
};

export default Banner1;
