import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Banner from "@/components/Banner";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { getTeamMemberBySlug } from "@/api/Apis";

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
    if (!img) return "https://placehold.co/900x1200/151327/ffffff?text=Team";
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

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  if (!member) {
    return (
      <section className="bg-[#0f0d1d]">
        <Banner
          title="Team Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Our Team", to: "/ourteam" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 py-20 text-white md:px-10">
          <h2 className="text-2xl font-bold">Team member not found</h2>
          <p className="mt-3 text-white/70">
            The team member you are looking for does not exist.
          </p>
          <Link
            to="/ourteam"
            className="mt-6 inline-flex items-center gap-2 text-[#3c72fc] transition-colors hover:text-white"
          >
            Back to Our Team
          </Link>
        </div>
      </section>
    );
  }

  const skills = Array.isArray(member.skills) ? member.skills : [];
  const education = Array.isArray(member.education) ? member.education : [];

  return (
    <main className="bg-[#0f0d1d]">
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
              <div className="overflow-hidden bg-[#151327] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <img
                  src={imageUrl(member.image)}
                  alt={member.name}
                  className="h-[360px] w-full object-cover object-top sm:h-[420px] md:h-[520px] lg:h-[520px]"
                />
              </div>
              <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                {[
                  {
                    label: "Facebook",
                    href: member.socialLinks?.facebook || "#",
                    icon: FaFacebookF,
                  },
                  {
                    label: "Instagram",
                    href: member.socialLinks?.instagram || "#",
                    icon: FaInstagram,
                  },
                  {
                    label: "LinkedIn",
                    href: member.socialLinks?.linkedin || "#",
                    icon: FaLinkedinIn,
                  },
                ].map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-12 w-12 items-center justify-center border border-white text-white transition-colors hover:border-[#3c72fc] hover:bg-[#3c72fc]"
                  >
                    {React.createElement(icon, { size: 17 })}
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-[#151327] p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                {member.name}
              </h2>
              <p className="mt-2 text-[#3c72fc] font-semibold">{member.role}</p>

              <div className="mt-6 border-t border-white pt-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  About Me
                </h3>
                <p className="leading-relaxed text-white/70">{member.bio}</p>
              </div>

              {skills.length > 0 && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {skills.map((skill, i) => (
                    <div key={skill.name + i}>
                      <div className="flex justify-between text-sm text-white/80 mb-2">
                        <span>{skill.name}</span>
                        <span>{skill.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/10">
                        <div
                          className="h-2 bg-[#3c72fc]"
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
              <h3 className="mb-4 text-xl font-semibold text-white">
                Education Background
              </h3>
              <div className="border-t border-white/10 pt-6">
                <ul className="space-y-3 text-white/80">
                  {education.map((item, index) => (
                    <li key={`${item.degree}-${index}`}>
                      <span className="font-semibold text-[#3c72fc]">
                        {item.degree}
                      </span>
                      {item.year ? (
                        <span className="text-white/60"> {item.year}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-16">
            <h3 className="mb-4 text-xl font-semibold text-white">
              Contact Details
            </h3>
            <div className="space-y-2 border-t border-white/10 pt-6 text-sm text-white/70">
              <p>
                Email: <span className="text-white">info@swift-signit.com</span>
              </p>
              <p>
                Phone: <span className="text-white">+92 315 8399446</span>
              </p>
              <p>
                WhatsApp: <span className="text-white">+92 315 8399446</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default TeamDetails;
