import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "@/components/Banner";
import { getProjects } from "@/api/Apis";
import useScrollReveal from "@/hooks/useScrollReveal";
import useScrollRevealGrid from "@/hooks/useScrollRevealGrid";
import { sortContentItems } from "@/lib/sortContentItems";

/* ── Arrow icon ── */
const ArrowIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const headingRef = useScrollReveal();
  const gridRef = useScrollRevealGrid(projects);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/800x1000/0b1226/ffffff?text=Project";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProjects();
        setProjects(sortContentItems(Array.isArray(res.data) ? res.data : []));
      } catch (error) {
        console.error("Project load failed", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section>
      <Banner title="IT Solutions & Projects" />
      <div className="relative py-20 bg-white overflow-hidden">
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
          <div ref={headingRef} className="sr-hidden sr-up text-center">
            <h2 className="text-3xl md:text-[38px] font-bold text-[#0B1B3A]">
              IT Solutions &amp; Projects
            </h2>
            <p className="mt-4 text-sm md:text-base text-[#0B1B3A]/65 max-w-[760px] mx-auto">
              IT and Technology company's website is crucial for establishing
              credibility, building trust, and communicating its identity and
              value proposition.
            </p>
          </div>

          {/* ── Project Grid ── */}
          <div
            ref={gridRef}
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {loading ? (
              <div className="text-[#0B1B3A]/70">Loading projects...</div>
            ) : (
              projects.map((item, index) => (
                <Link
                  key={item._id || index}
                  to={`/projects/${item._id}`}
                  className="sr-hidden sr-up group relative block overflow-hidden border border-black/10 bg-[#0b1226] w-full max-w-[420px] mx-auto sm:max-w-none aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] min-h-[300px] shadow-[0_18px_45px_rgba(11,27,58,0.1)]"
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
                  <div className="absolute inset-0 border border-[#0E70C4]/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {/* Bottom label */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
                    <span className="block text-[#a6c2ff] text-xs font-semibold uppercase tracking-wider mb-1 transition-colors duration-300 group-hover:text-white">
                      {item.category}
                    </span>
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg leading-snug transition-colors duration-300 group-hover:text-white">
                        {item.title}
                      </h3>
                      <span className="shrink-0 ml-3 w-12 h-12 rounded-full border-2 border-white/60 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-[#0E70C4] group-hover:border-[#0E70C4] group-hover:translate-x-1">
                        <ArrowIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
