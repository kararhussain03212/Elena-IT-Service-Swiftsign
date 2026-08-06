import React from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaGlobe,
} from "react-icons/fa";
import logoLight from "@/assets/images/logo/elena-logo.png";
import useScrollReveal from "@/hooks/useScrollReveal";

const isExternalHref = (href) => /^(https?:\/\/|mailto:|tel:)/i.test(String(href || "").trim());

const getSocialIcon = (name) => {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("facebook")) return <FaFacebookF />;
  if (lower.includes("linkedin")) return <FaLinkedinIn />;
  if (lower.includes("instagram")) return <FaInstagram />;
  if (lower.includes("twitter") || lower.includes("x")) return <FaTwitter />;
  if (lower.includes("youtube")) return <FaYoutube />;
  return <FaGlobe />;
};

const Footer = ({ content = {} }) => {
  const topRef = useScrollReveal({ threshold: 0.05, once: true });
  const midRef = useScrollReveal({ threshold: 0.05, once: true });

  const logoSrc = (() => {
    const apiRoot = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    const raw = String(content.logo || content.logoLight || "").trim();
    if (!raw) return logoLight;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return apiRoot + raw;
    if (/^uploads\//i.test(raw)) return apiRoot + "/" + raw;
    return raw;
  })();
  const brandDescription = String(content.brandDescription || "").trim();

  const openingHours = String(content.openingHours || "Mon - Fri: 09:00 AM - 5:00 PM").trim();
  const phone = String(content.phone || "+971 52 321 6551").trim();
  const phoneHref = String(content.phoneHref || "").trim();

  const qrCodeTitle = String(content.qrCodeTitle || "Scan to Connect").trim();
  const qrCodeSubtitle = String(content.qrCodeSubtitle || "Quick mobile access").trim();

  const quickLinksTitle = String(content.quickLinksTitle || "Quick Links").trim();
  const itSolutionsTitle = String(content.itSolutionsTitle || "IT Solutions").trim();

  const supportTitle = String(content.supportTitle || "Support & Info").trim();
  const socialsTitle = String(content.socialsTitle || "Social Media").trim();
  const copyrightText = String(content.copyrightText || `© ${new Date().getFullYear()} Elena IT Services. All rights reserved.`).trim();

  const itSolutions = Array.isArray(content.itSolutions)
    ? content.itSolutions
        .map((item) => {
          if (typeof item === "string") {
            const name = String(item || "").trim();
            return name ? { name, href: "" } : null;
          }
          if (item && typeof item === "object") {
            if (item.isActive === false) return null;
            const name = String(item.name || "").trim();
            const href = String(item.href || "").trim();
            return name ? { name, href } : null;
          }
          return null;
        })
        .filter(Boolean)
    : [];



  const quickLinks = Array.isArray(content.quickLinks)
    ? content.quickLinks.filter(
        (link) =>
          link?.isActive !== false &&
          String(link?.name || "").trim() &&
          String(link?.href || "").trim(),
      )
    : [];

  const socials = Array.isArray(content.socials)
    ? content.socials.filter(
        (social) =>
          social?.isActive !== false &&
          String(social?.name || "").trim() &&
          String(social?.href || "").trim(),
      )
    : [
        { name: "Facebook", href: "#" },
        { name: "LinkedIn", href: "#" },
        { name: "Instagram", href: "#" },
      ];

  const locations = Array.isArray(content.locations) && content.locations.length > 0
    ? content.locations.filter(
        (location) =>
          location?.isActive !== false &&
          String(location?.text || "").trim(),
      )
    : [{ text: "Al Fajer Complex, 1st Floor 105, 12 Oud Metha, Dubai, UAE", href: "#" }];

  const policies = Array.isArray(content.policies) && content.policies.length > 0
    ? content.policies.filter(
        (p) => p?.isActive !== false && String(p?.name || "").trim() && String(p?.href || "").trim()
      )
    : [
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms-and-conditions" },
      ];

  return (
    <footer className="relative bg-white text-[#0B1B3A] w-full min-h-fit flex flex-col justify-between px-6 md:px-12 lg:px-16 py-10 lg:py-14 border-t border-black/10">
      {/* ── 1. Giant Brand Header ── */}
      <div ref={topRef} className="sr-hidden sr-up w-full text-center sm:text-left pt-10 sm:pt-16 md:pt-20 lg:pt-24 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 border-b border-black/10 pb-6 md:pb-10">
          <div className="flex items-center pb-1">
            <img src={logoSrc} alt="Elena Logo" className="h-16 sm:h-20 md:h-20 lg:h-24 xl:h-32 w-auto object-contain opacity-95" />
          </div>
        </div>
      </div>

      {/* ── 2. Main Content Grid ── */}
      <div ref={midRef} className="sr-hidden sr-up my-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-6 xl:gap-10">
          {/* Column 1: Description & QR */}
          <div className="flex flex-col space-y-6">
            <p className="text-[#585858] text-xs sm:text-sm xl:text-base leading-relaxed mt-1">
              {brandDescription || "Elena IT Services transforms your IT infrastructure, improving performance, security, and scalability while reducing downtime and boosting efficiency."}
            </p>

            {/* QR Code section */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl inline-block border border-black/10 shadow-sm">
                <QRCodeSVG
                  value={content.qrCodeUrl || window.location.origin}
                  size={100}
                  level="M"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0B1B3A]">{qrCodeTitle}</p>
                <p className="text-[11px] sm:text-xs text-[#585858] mt-0.5">{qrCodeSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links / Company */}
          <div>
            <h4 className="text-sm sm:text-base xl:text-lg font-bold text-[#1C64EC] mb-4 lg:mb-6 whitespace-nowrap">
              {quickLinksTitle}
            </h4>
            <ul className="space-y-2.5 lg:space-y-3 text-xs sm:text-sm xl:text-[15px] text-[#585858]">
              {quickLinks.length > 0 ? (
                quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="hover:text-[#1C64EC] transition-colors font-medium">
                      {link.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/" className="hover:text-[#1C64EC] transition-colors font-medium">Home</Link></li>
                  <li><Link to="/about" className="hover:text-[#1C64EC] transition-colors font-medium">About Us</Link></li>
                  <li><Link to="/services" className="hover:text-[#1C64EC] transition-colors font-medium">Services</Link></li>
                  <li><Link to="/career" className="hover:text-[#1C64EC] transition-colors font-medium">Career</Link></li>
                  <li><Link to="/contact" className="hover:text-[#1C64EC] transition-colors font-medium">Contact</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: IT Solutions */}
          <div>
            <h4 className="text-sm sm:text-base xl:text-lg font-bold text-[#1C64EC] mb-4 lg:mb-6 whitespace-nowrap">
              {itSolutionsTitle}
            </h4>
            <ul className="space-y-2.5 lg:space-y-3 text-xs sm:text-sm xl:text-[15px] text-[#585858]">
              {itSolutions.slice(0, 6).map((item, idx) => (
                <li key={`${item.name}-${idx}`}>
                  {!item.href ? (
                    <span className="font-medium">{item.name}</span>
                  ) : isExternalHref(item.href) ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#1C64EC] transition-colors font-medium">
                      {item.name}
                    </a>
                  ) : (
                    <Link to={item.href} className="hover:text-[#1C64EC] transition-colors font-medium">
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>



          {/* Column 5: Contact & Hours */}
          <div className="md:col-span-2 lg:col-span-1 space-y-5 lg:space-y-6">
            <h4 className="text-sm sm:text-base xl:text-lg font-bold text-[#1C64EC] mb-4 lg:mb-6 whitespace-nowrap">
              {supportTitle}
            </h4>
            {locations.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0B1B3A] mb-1">Location</p>
                <p className="text-xs sm:text-sm text-[#585858] leading-relaxed">
                  {locations.map((loc) => loc.text).join(" • ")}
                </p>
              </div>
            )}
            {openingHours && (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0B1B3A] mb-1">Opening Hours</p>
                <p className="text-xs sm:text-sm text-[#585858]">{openingHours}</p>
              </div>
            )}
            {phone && (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0B1B3A] mb-1">Phone</p>
                <a href={phoneHref || `tel:${phone}`} className="text-xs sm:text-sm text-[#585858] hover:text-[#1C64EC] transition-colors">
                  {phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Social Media Row ── */}
        <div className="mt-10 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 pr-0 lg:pr-20">
          <span className="text-sm font-bold text-[#1C64EC] uppercase tracking-wider">
            {socialsTitle}
          </span>
          <div className="flex items-center gap-3">
            {socials.map((soc) => (
              <a
                key={soc.name}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={soc.name}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f7fb] text-[#0B1B3A] hover:bg-[#1C64EC] hover:text-white transition-all duration-200 text-lg shadow-sm hover:scale-110"
              >
                {getSocialIcon(soc.name)}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Copyright Bar ── */}
      <div className="w-full pt-6 pb-2 border-t border-black/10 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#585858] pr-0 lg:pr-16">
        <p>{copyrightText}</p>
        <div className="flex items-center gap-4 sm:gap-6">
          {policies.map((p) => (
            <Link key={p.name} to={p.href} className="hover:text-[#1C64EC] transition-colors">
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

