import React from "react";
import { Link } from "react-router-dom";
import useScrollReveal from "@/hooks/useScrollReveal";

const Banner1 = ({ title = "" }) => {
  const contentRef = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="relative overflow-hidden bg-[#0b0a1a]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #0b0a1a 0%, #0a2a73 55%, #0b0a1a 100%)",
        }}
      />

      <div
        ref={contentRef}
        className="sr-hidden sr-up relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-15 py-28 md:py-40"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white">{title}</h2>
        <div className="mt-3 flex items-center gap-2 text-white/70 text-sm md:text-base">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-white/50">»</span>
          <Link to="/Services" className="hover:text-white transition-colors">
            Service
          </Link>
          <span className="text-white/50">»</span>
          <span className="text-white">{title}</span>
        </div>
      </div>
    </section>
  );
};

export default Banner1;
