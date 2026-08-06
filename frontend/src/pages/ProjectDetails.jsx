import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Banner from "@/components/Banner";
import { getProjectById } from "@/api/Apis";
import {
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaMapMarkerAlt,
  FaClock,
  FaTools,
  FaSignal,
  FaExternalLinkAlt,
} from "react-icons/fa";
import useScrollReveal from "@/hooks/useScrollReveal";

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const heroImageRef = useScrollReveal();
  const metaRef = useScrollReveal();
  const contentRef = useScrollReveal();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/1200x800/0b1226/ffffff?text=Project";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  const resolveWebsiteUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(raw)) return "https://" + raw;
    return "";
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProjectById(id);
        setProject(res.data || null);
      } catch (error) {
        console.error("Project detail load failed", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <section className="bg-white p-10 text-[#0B1B3A]">
        Loading project...
      </section>
    );
  }

  if (!project) {
    return (
      <section className="bg-white">
        <Banner
          title="Project Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Projects", to: "/projects" },
            { label: "Project Details" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-[#0B1B3A]">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="mt-3 text-[#0B1B3A]/70">
            The project you are looking for does not exist.
          </p>
          <Link
            to="/projects"
            className="mt-6 inline-flex items-center gap-2 text-[#0E70C4] hover:text-[#0B1B3A] transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </section>
    );
  }

  const meta = [
    { label: "Date", value: project.year ?? "2025", icon: FaCalendarAlt },
    { label: "Client", value: project.client ?? "Robert Fox", icon: FaUser },
    {
      label: "Category",
      value: project.category ?? "Technology",
      icon: FaTag,
    },
    {
      label: "Location",
      value: project.location ?? "fot kde, USA",
      icon: FaMapMarkerAlt,
    },
    { label: "Duration", value: project.duration ?? "8 Weeks", icon: FaClock },
    {
      label: "Edit with",
      value: project.tech ?? "React + Node.js",
      icon: FaTools,
    },
    { label: "Status", value: project.status ?? "Live", icon: FaSignal },
  ];

  const websiteUrl = resolveWebsiteUrl(project.url);

  return (
    <section className="bg-white">
      <Banner
        title={project.title}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Projects", to: "/projects" },
          { label: project.title },
        ]}
      />

      <section className="case-single-area pt-16 pb-16 md:pt-28 md:pb-28">
        <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
          {/* Image Frame */}
          <div
            ref={heroImageRef}
            className="sr-hidden sr-up relative mx-auto mb-12 max-w-[1100px] sm:mb-16 lg:mb-20 before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:h-[90%] before:w-[90%] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[radial-gradient(ellipse,rgba(14, 112, 196,0.12),transparent_70%)] before:blur-[30px] before:pointer-events-none before:z-0"
          >
            <div className="relative z-10 overflow-hidden rounded-[22px] bg-white shadow-[0_25px_70px_rgba(11,27,58,0.18),0_0_0_1px_rgba(11,27,58,0.06)]">
              <div className="relative overflow-hidden group after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[30%] after:bg-[linear-gradient(to_top,rgba(15,13,29,0.5),transparent)] after:pointer-events-none">
                <img
                  src={resolveImage(project.cover_image || project.coverImage)}
                  alt={project.title}
                  className="block w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] h-[240px] sm:h-[320px] md:h-[450px] lg:h-[600px]"
                />
              </div>
            </div>
          </div>

          {/* Two-Column Info Section */}
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-[60px]">
            <div
              ref={metaRef}
              className="sr-hidden sr-left w-full lg:flex-[0_0_400px] lg:max-w-[400px]"
            >
              <h2 className="mb-7 text-[22px] sm:text-[26px] lg:text-[36px] font-extrabold italic leading-tight tracking-[-0.5px] bg-[linear-gradient(135deg,#0E70C4,#00c6ff,#6366f1)] bg-clip-text text-transparent">
                {project.title}
              </h2>
              <ul className="m-0 list-none p-0">
                {meta.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-4 border-b border-black/10 py-4 first:border-t"
                    >
                      <span className="flex items-center gap-2 text-[14px] sm:text-[15px] font-bold text-[#0B1B3A]">
                        <Icon size={14} />
                        {item.label}:
                      </span>
                      <span className="text-right text-[14px] sm:text-[15px] text-[#0B1B3A]/60">
                        {item.value}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div ref={contentRef} className="sr-hidden sr-right min-w-0 flex-1">
              <h3 className="mb-3 text-[20px] sm:text-[22px] lg:text-[30px] font-extrabold text-[#0B1B3A] leading-snug">
                {project.category ?? "Technology"} Project
              </h3>
              
              <p className="mb-9 text-[15px] leading-[1.85] text-[#0B1B3A]/60">
                {project.overview ??
                  "A clean, modern experience with strong visual hierarchy, fast loading, and a layout that scales across devices. The system is optimized for responsive behavior so users can browse comfortably on mobile, tablet, and desktop."}
              </p>
              <p className="mb-5 text-[15px]  text-[#0B1B3A]/55">
                {project.challenge ??
                  "The most significant challenges in development are in the intersection of data security and accessibility."}
              </p>

              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#0E70C4]/45 bg-[#0E70C4]/10 px-5 py-2.5 text-sm font-semibold text-[#0E70C4] transition-all hover:border-[#0E70C4] hover:bg-[#0E70C4] hover:text-white"
                >
                  Visit Website
                  <FaExternalLinkAlt size={12} />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-black/5 px-5 py-2.5 text-sm font-semibold text-[#0B1B3A]/50 cursor-not-allowed"
                  title="Add Website URL from admin project form to enable this button"
                >
                  Website Not Added
                </button>
              )}
            </div>
          </div>

          <div className="mt-16 md:mt-[70px]">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="group relative overflow-hidden rounded-[16px] shadow-[0_15px_40px_rgba(11,27,58,0.12)] after:content-[''] after:absolute after:inset-0 after:rounded-[16px] after:border-2 after:border-transparent after:transition-colors after:duration-300 group-hover:after:border-[rgba(14,112,196,0.35)]"></div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default ProjectDetails;
