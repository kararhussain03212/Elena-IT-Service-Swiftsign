import React from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import logoLight from "@/assets/images/logo/swift.png";
import iconLeft from "@/assets/images/shape/footer-solid-left.png";
import iconRight from "@/assets/images/shape/footer-solid-right.png";
import shapesleft from "@/assets/images/shape/footer-regular-left.png";
import shapesright from "@/assets/images/shape/footer-regular-right.png";
import useScrollReveal from "@/hooks/useScrollReveal";

/* ─── Social icon button ─── */
const SocialBtn = ({ href, label, children }) => (
  <a
    href={href}
    aria-label={label}
    target="_blank"
    rel="noopener noreferrer"
    className="w-9 h-9 flex items-center justify-center rounded-full border border-white/25 text-white hover:bg-[#3c72fc] hover:border-[#3c72fc] transition-all duration-300"
  >
    {children}
  </a>
);

/* ─── Double-chevron bullet ─── */
const Bullet = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3 text-[#3c72fc] shrink-0"
  >
    <polyline points="13 6 19 12 13 18" />
    <polyline points="6 6 12 12 6 18" />
  </svg>
);

const renderSocialIcon = (name) => {
  const normalized = String(name || "").trim().toLowerCase();

  if (normalized.includes("linkedin")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }

  if (normalized.includes("instagram")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
};

const isExternalHref = (href) => /^(https?:\/\/|mailto:|tel:)/i.test(String(href || "").trim());

const Footer = ({ content = {} }) => {
  const leftShapeRef = useScrollReveal({ threshold: 0.05, once: true });
  const rightShapeRef = useScrollReveal({ threshold: 0.05, once: true });
  const topShapeRef = useScrollReveal({ threshold: 0.05, once: true });
  const brandColRef = useScrollReveal({ threshold: 0.08, once: true });
  const solutionColRef = useScrollReveal({ threshold: 0.08, once: true });
  const solutionCol2Ref = useScrollReveal({ threshold: 0.08, once: true });
  const quickLinkColRef = useScrollReveal({ threshold: 0.08, once: true });
  const locationColRef = useScrollReveal({ threshold: 0.08, once: true });
  const bottomBarRef = useScrollReveal({ threshold: 0.05, once: true });

  const brandDescription = String(content.brandDescription || "").trim();
  const openingHours = String(content.openingHours || "").trim();
  const phone = String(content.phone || "").trim();
  const phoneHref = String(content.phoneHref || "").trim();

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
  const itSolutionsTitle = String(content.itSolutionsTitle || "IT Solution").trim();
  const itSolutionsSecondTitle = String(
    content.itSolutionsSecondTitle || content.extraColumnTitle || "IT Solution",
  ).trim();
  const itSolutionsSecond = Array.isArray(content.itSolutionsSecond)
    ? content.itSolutionsSecond
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
    : Array.isArray(content.extraColumnLinks)
    ? content.extraColumnLinks
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const name = String(item.name || "").trim();
          const href = String(item.href || "").trim();
          return name ? { name, href } : null;
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
    : [];
  const locations = Array.isArray(content.locations)
    ? content.locations.filter(
        (location) =>
          location?.isActive !== false &&
          String(location?.text || "").trim() &&
          String(location?.href || "").trim(),
      )
    : [];
  const policies = [
    { name: "Privacy Policy", href: "/privacy-policy", isActive: true },
    { name: "Terms of Service", href: "/terms-and-conditions", isActive: true },
  ];

  const hasFooterContent =
    Boolean(brandDescription || openingHours || phone || phoneHref) ||
    itSolutions.length > 0 ||
    itSolutionsSecond.length > 0 ||
    quickLinks.length > 0 ||
    socials.length > 0 ||
    locations.length > 0 ||
    policies.length > 0;

  if (!hasFooterContent) return null;

  return (
    <footer className="relative bg-[#0b0a1a] overflow-hidden">
      <div
        ref={leftShapeRef}
        className="sr-hidden sr-right absolute left-0 z-1 flex items-center pointer-events-none select-none"
      >
        <img src={iconLeft} alt="" className=" moveUD " />
      </div>
      <div
        ref={rightShapeRef}
        className="sr-hidden sr-left absolute inset-y-0 bottom-0 right-0 z-1 flex items-center pointer-events-none select-none"
      >
        <img src={iconRight} alt="" />
      </div>
      <div
        ref={topShapeRef}
        className="sr-hidden sr-up absolute top-0 left-0 -translate-y-3 pointer-events-none select-none"
      >
        <img src={shapesleft} alt="" className="w-full animate-spin-slow" />
      </div>
      <div className="absolute inset-y-9 bottom-0 right-0 flex items-center pointer-events-none select-none">
        <img src={shapesright} alt="" className="w-full moveUD" />
      </div>

      {/* ── Main footer body ── */}
      <div className="relative z-10 mx-auto w-full max-w-[1550px] px-6 md:px-10 pt-24 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-12">
          {/* Col 1 — Brand */}
          <div ref={brandColRef} className="sr-hidden sr-up">
            <Link to="/" className="inline-block mb-6">
              <img src={logoLight} alt="Swift IT" className="h-[78px] w-auto" />
            </Link>
            <p className="text-white/55 text-base leading-relaxed mb-8 max-w-[260px] text-justify">
              {brandDescription}
            </p>

            {/* QR Code */}
            <div className="mt-8 mb-6">
              <p className="text-white/70 text-sm font-semibold mb-3">Scan to Connect</p>
              <div className="p-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 inline-flex items-center justify-center border border-white/10">
                <QRCodeSVG
                  value={content.qrCodeUrl || window.location.origin}
                  size={120}
                  level="H"
                  includeMargin={true}
                  quietZone={10}
                />
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-6">
              {socials.map((social) => (
                <SocialBtn
                  key={`${social?.name || "social"}-${social?.href || ""}`}
                  href={social?.href}
                  label={social?.name}
                >
                  {renderSocialIcon(social?.name)}
                </SocialBtn>
              ))}
            </div>
          </div>

          {/* Col 2 — IT Solution */}
          <div ref={solutionColRef} className="sr-hidden sr-up">
            <h3 className="text-white font-bold text-xl mb-6 relative">
              {itSolutionsTitle || "IT Solution"}
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#3c72fc]" />
            </h3>
            <ul className="space-y-4 mt-4">
              {itSolutions.map((item, index) => (
                <li key={`${item.name}-${item.href}-${index}`} className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
                  <Bullet />
                  {!item.href ? (
                    <span className="text-white/55 text-base">{item.name}</span>
                  ) : isExternalHref(item.href) ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {/* Col 3 - IT Solution */}
          <div ref={solutionCol2Ref} className="sr-hidden sr-up">
            <h3 className="text-white font-bold text-xl mb-6 relative">
              {itSolutionsSecondTitle || "IT Solution"}
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#3c72fc]" />
            </h3>
            <ul className="space-y-4 mt-4">
              {itSolutionsSecond.map((item, index) => (
                <li key={`${item.name}-${item.href}-${index}`} className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
                  <Bullet />
                  {!item.href ? (
                    <span className="text-white/55 text-base">{item.name}</span>
                  ) : isExternalHref(item.href) ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Quick Link */}
          <div ref={quickLinkColRef} className="sr-hidden sr-up">
            <h3 className="text-white font-bold text-xl mb-6 relative">
              Quick Link
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#3c72fc]" />
            </h3>
            <ul className="space-y-4 mt-4">
              {quickLinks.map((link) => (
                <li key={link.name} className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-300">
                  <Bullet />
                  <Link
                    to={link.href}
                    className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Location */}
          <div ref={locationColRef} className="sr-hidden sr-up">
            <h3 className="text-white font-bold text-xl mb-6 relative">
              Location
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-[#3c72fc]" />
            </h3>
            <p className="text-white/55 text-base leading-relaxed mt-4 mb-8">
              {locations.map((location, index) => (
                <React.Fragment key={`${location?.text || "location"}-${index}`}>
                  <a
                    href={location?.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {location?.text}
                  </a>
                  {index !== locations.length - 1 ? <br /> : null}
                </React.Fragment>
              ))}
            </p>

            {/* Opening Hours */}
            <div className="flex items-start gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3c72fc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">
                  Opening Hours:
                </p>
                <p className="text-white/55 text-base">
                  {openingHours}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3c72fc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 flex-shrink-0 mt-0.5"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">
                  Phone Call:
                </p>
                {phoneHref && phone ? (
                  <a
                    href={phoneHref}
                    className="text-white/55 text-base hover:text-[#3c72fc] transition-colors duration-300"
                  >
                    {phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright bar ── */}
      <div ref={bottomBarRef} className="sr-hidden sr-up border-t border-white/8">
        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-base text-center sm:text-left">
            &copy; {new Date().getFullYear()} Swift Sign IT &amp; Cyber
            Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {policies.map((policy) => (
              <Link
                key={`${policy?.name || "policy"}-${policy?.href || ""}`}
                to={policy?.href}
                className="text-white/40 text-sm hover:text-white/70 transition-colors duration-300"
              >
                {policy?.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
