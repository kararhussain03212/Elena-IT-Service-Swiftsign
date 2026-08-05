import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Banner from "@/components/Banner";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { IoShareSocialSharp } from "react-icons/io5";
import { getTeamMemberBySlug } from "@/api/Apis";

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
  if (normalized.includes("instagram")) return FaInstagram;
  if (normalized.includes("linkedin")) return FaLinkedinIn;

  return IoShareSocialSharp;
};

const TeamDetails = () => {
  const { slug } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // CHANGED: backend image resolver
  // WHY: support filename from uploads folder
  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const imageUrl = (img) => {
    if (!img) return "https://placehold.co/900x1200/0B1B3A/ffffff?text=Team";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return apiRoot + img;
    return apiRoot + "/uploads/" + img;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTeamMemberBySlug(slug);
        setMember(res.data || null);
      } catch (e) {
        console.error("Member load failed", e);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <div className="p-8 text-[#0B1B3A]">Loading...</div>;

  if (!member) {
    return (
      <section className="bg-white">
        <Banner
          title="Team Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Our Team", to: "/ourteam" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 py-20 text-[#0B1B3A] md:px-10">
          <h2 className="text-2xl font-bold">Team member not found</h2>
          <p className="mt-3 text-[#0B1B3A]/70">
            The team member you are looking for does not exist.
          </p>
          <Link
            to="/ourteam"
            className="mt-6 inline-flex items-center gap-2 text-[#0E70C4] transition-colors hover:text-[#0B1B3A]"
          >
            Back to Our Team
          </Link>
        </div>
      </section>
    );
  }

  const skills = Array.isArray(member.skills) ? member.skills : [];
  const education = Array.isArray(member.education) ? member.education : [];
  const socialLinks = normalizeSocialLinks(member.social_links ?? member.socialLinks);

  return (
    <main className="bg-white">
      <Banner
        title="Team Details"
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Our Team", to: "/ourteam" },
          { label: member.name },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
            <div className="relative w-full md:mx-auto md:max-w-[520px] lg:mx-0 lg:max-w-none">
              <div className="overflow-hidden bg-white border border-black/10 shadow-[0_20px_60px_rgba(11,27,58,0.15)]">
                <img
                  src={imageUrl(member.image)}
                  alt={member.name}
                  className="h-[360px] w-full object-cover object-top sm:h-[420px] md:h-[520px] lg:h-[520px]"
                />
              </div>
              {socialLinks.length > 0 ? (
                <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                  {socialLinks.map((link) => {
                    const Icon = getSocialIcon(link.platform);

                    return (
                      <a
                        key={link.platform + link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.platform}
                        className="flex h-12 w-12 items-center justify-center border border-white text-white transition-colors hover:border-[#0E70C4] hover:bg-[#0E70C4]"
                      >
                        {React.createElement(Icon, { size: 17 })}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="bg-white border border-black/10 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#0B1B3A] md:text-3xl">
                {member.name}
              </h2>
              <p className="mt-2 text-[#0E70C4] font-semibold">{member.role}</p>

              <div className="mt-6 border-t border-black/10 pt-6">
                <h3 className="mb-3 text-lg font-semibold text-[#0B1B3A]">
                  About Me
                </h3>
                <p className="leading-relaxed text-[#0B1B3A]/70">{member.bio}</p>
              </div>

              {skills.length > 0 && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {skills.map((skill, i) => (
                    <div key={skill.name + i}>
                      <div className="flex justify-between text-sm text-[#0B1B3A]/75 mb-2">
                        <span>{skill.name}</span>
                        <span>{skill.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/10">
                        <div
                          className="h-2 bg-[#0E70C4]"
                          style={{ width: String(skill.value || 0) + "%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {education.length > 0 && (
            <div className="mt-16">
              <h3 className="mb-4 text-xl font-semibold text-[#0B1B3A]">
                Education Background
              </h3>
              <div className="border-t border-black/10 pt-6">
                <ul className="space-y-3 text-[#0B1B3A]/75">
                  {education.map((item, index) => (
                    <li key={`${item.degree}-${index}`}>
                      <span className="font-semibold text-[#0E70C4]">
                        {item.degree}
                      </span>
                      {item.year ? (
                        <span className="text-[#0B1B3A]/60"> {item.year}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-16">
            <h3 className="mb-4 text-xl font-semibold text-[#0B1B3A]">
              Contact Details
            </h3>
            <div className="space-y-2 border-t border-black/10 pt-6 text-sm text-[#0B1B3A]/70">
              <p>
                Email: <span className="text-[#0B1B3A]">info@elenaitservices.com</span>
              </p>
              <p>
                Phone: <span className="text-[#0B1B3A]">+971 52 321 6551</span>
              </p>
              <p>
                WhatsApp: <span className="text-[#0B1B3A]">+971 52 321 6551</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default TeamDetails;
