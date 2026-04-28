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
    image: "https://placehold.co/600x800/151327/3c72fc?text=Team+Member",
    socialLinks: {},
  },
  {
    slug: "placeholder-2",
    name: "Sara Khan",
    role: "UI/UX Designer",
    image: "https://placehold.co/600x800/1b1832/3c72fc?text=Team+Member",
    socialLinks: {},
  },
  {
    slug: "placeholder-3",
    name: "James Lee",
    role: "Project Manager",
    image: "https://placehold.co/600x800/0f0d1d/3c72fc?text=Team+Member",
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
    if (!img) return "https://placehold.co/600x800/151327/ffffff?text=Team";
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
      <section className="py-28 bg-[#151327]">
        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10 text-white/70">
          Loading team...
        </div>
      </section>
    );
  }

  return (
    <section className="py-28 bg-[#151327]">
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div
          ref={headingRef}
          className="sr-hidden sr-up flex flex-col items-center justify-center"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc]">
            Our Team
          </p>
          <h2 className="mb-12 text-3xl font-bold text-white md:text-4xl">
            Our Leadership Team
          </h2>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {displayMembers.map((member, index) => {
            const socialLinks = normalizeSocialLinks(member.social_links ?? member.socialLinks);

            return (
              <div
                key={(member.slug || "member") + "-" + index}
                className="sr-hidden sr-up group relative w-full max-w-[380px] cursor-pointer lg:max-w-[300px] xl:max-w-[380px]"
              >
                <div className="relative h-[480px] w-full overflow-hidden lg:h-[400px] xl:h-[500px]">
                  <Link to={"/team/" + member.slug} className="block h-full">
                    <img
                      src={getImageUrl(member.image)}
                      alt={member.name}
                      className="block h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 flex h-[110px] items-center bg-[linear-gradient(90deg,rgb(60,114,252)_-10.59%,rgb(0,6,12)_300.59%)] px-5">
                  <div className="w-[260px]">
                    <h3 className="text-[25px] font-bold leading-tight text-white">
                      <Link to={"/team/" + member.slug}>{member.name}</Link>
                    </h3>
                    <p className="mt-0.5 text-[16px] text-white">{member.role}</p>
                  </div>

                  {socialLinks.length > 0 ? (
                    <div className="group/share absolute bottom-[33px] right-[15px] z-30 flex flex-col items-center">
                      <div className="mb-2 max-h-0 overflow-hidden transition-[max-height] duration-300 ease-out group-hover/share:max-h-[200px]">
                        <div className="flex max-h-[240px] flex-col items-center gap-1 overflow-y-auto rounded-full bg-[linear-gradient(90deg,rgb(60,114,252)_-10.59%,rgb(0,6,12)_300.59%)] px-[7px] py-3">
                          {socialLinks.map((link) => {
                            const Icon = getSocialIcon(link.platform);

                            return (
                              <a
                                key={link.platform + link.url}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={link.platform}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white hover:text-[#3c72fc]"
                              >
                                <Icon className="h-4 w-4" />
                              </a>
                            );
                          })}
                        </div>
                      </div>

                      <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white">
                        <IoShareSocialSharp className="h-5 w-5" />
                      </button>
                    </div>
                  ) : null}
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
