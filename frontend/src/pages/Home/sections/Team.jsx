import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoShareSocialSharp } from "react-icons/io5";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa6";
import { IoLogoInstagram } from "react-icons/io";
import { getTeamMembers } from "@/api/Apis";
import useScrollReveal from "@/hooks/useScrollReveal";
import useScrollRevealGrid from "@/hooks/useScrollRevealGrid";
import { sortContentItems } from "@/lib/sortContentItems";

/* Placeholder cards shown when the API returns no members */
const PLACEHOLDER_MEMBERS = [
  {
    slug: "placeholder-1",
    name: "Alex Morgan",
    role: "Lead Developer",
    image: "https://placehold.co/600x800/0B1B3A/0E70C4?text=Team+Member",
    socialLinks: {},
  },
  {
    slug: "placeholder-2",
    name: "Sara Khan",
    role: "UI/UX Designer",
    image: "https://placehold.co/600x800/12224A/0E70C4?text=Team+Member",
    socialLinks: {},
  },
  {
    slug: "placeholder-3",
    name: "James Lee",
    role: "Project Manager",
    image: "https://placehold.co/600x800/0F2350/0E70C4?text=Team+Member",
    socialLinks: {},
  },
];

const isValidSocialUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "#") return false;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_unusedError) {
    return false;
  }
};

const normalizeSocialLinks = (socialLinks) => {
  if (!socialLinks) return [];

  if (Array.isArray(socialLinks)) {
    return socialLinks
      .map((item) => ({
        platform: String(item?.name || item?.platform || item?.key || "").trim(),
        url: String(item?.href || item?.url || item?.link || "").trim(),
      }))
      .filter((item) => item.platform && isValidSocialUrl(item.url));
  }

  if (typeof socialLinks === "object") {
    return Object.entries(socialLinks)
      .map(([platform, url]) => ({
        platform: String(platform || "").trim(),
        url: String(url || "").trim(),
      }))
      .filter((item) => item.platform && isValidSocialUrl(item.url));
  }

  return [];
};

const getSocialIcon = (platform) => {
  const normalized = String(platform || "").toLowerCase();

  if (normalized.includes("facebook")) return FaFacebookF;
  if (normalized.includes("instagram")) return IoLogoInstagram;
  if (normalized.includes("linkedin")) return FaLinkedinIn;

  return IoShareSocialSharp;
};

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const displayMembers = members.length > 0 ? members : PLACEHOLDER_MEMBERS;
  const headingRef = useScrollReveal();
  const gridRef = useScrollRevealGrid(displayMembers);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/600x800/0B1B3A/ffffff?text=Team";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return apiRoot + img;
    return apiRoot + "/uploads/" + img;
  };

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await getTeamMembers();
        setMembers(sortContentItems(Array.isArray(res.data) ? res.data : []));
      } catch (error) {
        console.error("Team load failed", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-[#FAF9F6] text-[#111111]">
        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
          Loading team...
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#FAF9F6] border-t border-black/5 overflow-hidden">
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        {/* Header row */}
        <div ref={headingRef} className="sr-hidden sr-up text-center mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#1C64EC] mb-3">
            Our Team
          </p>
          <h2 className="font-heading text-3xl md:text-[40px] font-extrabold text-[#111111] leading-tight">
            Our Leadership Team
          </h2>
        </div>

        {/* Members Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
        >
          {displayMembers.map((member, index) => {
            const socialLinks = normalizeSocialLinks(
              member.social_links ?? member.socialLinks,
            );

            return (
              <div
                key={(member.slug || "member") + "-" + index}
                className="sr-hidden sr-up flex flex-col w-full cursor-pointer"
              >
                {/* Portrait Container */}
                <div className="group relative w-full aspect-[3/4] overflow-hidden rounded-none bg-[#ECEAE4] border border-black/5 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
                  <Link
                    to={"/team/" + member.slug}
                    className="block h-full w-full"
                  >
                    <img
                      src={getImageUrl(member.image)}
                      alt={member.name}
                      className="block h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {/* Hover Overlay with Social Icons */}
                  <div className="absolute inset-0 bg-[#111111]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px] pointer-events-none group-hover:pointer-events-auto">
                    {socialLinks.length > 0 ? (
                      socialLinks.map((link) => {
                        const Icon = getSocialIcon(link.platform);
                        return (
                          <a
                            key={link.platform + link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={link.platform}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111] hover:bg-[#1C64EC] hover:text-white transition-all duration-200 shadow-md transform hover:scale-110"
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })
                    ) : (
                      <span className="text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-none bg-white/20 backdrop-blur-md border border-white/10">
                        Elena IT Services
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Role Text Block */}
                <div className="mt-4 text-center">
                  <h3 className="font-heading text-lg md:text-xl font-extrabold text-[#111111] hover:text-[#1C64EC] transition-colors">
                    <Link to={"/team/" + member.slug}>{member.name}</Link>
                  </h3>
                  <p className="text-[11px] font-bold text-[#777777] uppercase tracking-wider mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Team;
