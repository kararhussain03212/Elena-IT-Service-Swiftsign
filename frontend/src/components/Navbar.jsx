import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Linkedin,
  ChevronDown,
} from "lucide-react";
import Button from "./Button";

const NO_DROPDOWN_NAMES = new Set(["general"]);

const AUTO_SECTION_DROPDOWNS = {
  "/about": [],
};

const normalizeChildLinks = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        String(item?.name || "").trim() && String(item?.href || "").trim(),
    )
    .map((item) => ({
      name: String(item.name).trim(),
      href: String(item.href).trim(),
    }));
};

const shouldShowDropdown = (link) => {
  const normalizedName = String(link?.name || "")
    .trim()
    .toLowerCase();
  if (NO_DROPDOWN_NAMES.has(normalizedName)) return false;
  return Array.isArray(link?.children) && link.children.length > 0;
};

const DesktopMenu = ({ menuLinks, isActive, isHashActive }) => (
  <div className="hidden lg:flex items-center gap-1 font-semibold">
    {menuLinks.map((link) => {
      const showDropdown = shouldShowDropdown(link);
      const linkTextClass = isActive(link.href)
        ? "text-[#1C64EC]"
        : "text-[#0B1B3A] hover:text-[#1C64EC]";

      if (!showDropdown) {
        return (
          <Link
            key={link.name}
            to={link.href}
            className={`relative px-4 py-2 text-[16px] transition-colors duration-200 ${linkTextClass}`}
          >
            {link.name}
          </Link>
        );
      }

      return (
        <div key={link.name} className="group relative">
          <Link
            to={link.href}
            className={`inline-flex items-center px-4 py-2 text-[16px] transition-colors duration-200 ${linkTextClass}`}
          >
            <span>{link.name}</span>
          </Link>

          <div className="invisible absolute left-2 top-full z-30 min-w-60 translate-y-2 overflow-hidden rounded-xl border border-black/10 bg-white opacity-0 shadow-[0_18px_40px_rgba(0,0,0,0.15)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
            <div className="py-2">
              {link.children.map((child) => (
                <Link
                  key={`${link.name}-${child.name}`}
                  to={child.href}
                  className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                    isHashActive(child.href)
                      ? "text-[#1C64EC]"
                      : "text-[#0B1B3A]/80 hover:bg-black/5 hover:text-[#1C64EC]"
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const NavInner = ({
  isDesktopViewport,
  isActive,
  isHashActive,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  menuLinks,
  cta,
  whatsappHref,
  logoSrc,
}) => {
  const hasDesktopActions = Boolean((cta?.text && cta?.to) || whatsappHref);

  return (
    <div className="mx-auto w-full max-w-430 px-6 md:px-10">
      <div className="flex h-25 items-center justify-between">
        <Link
          to="/"
          aria-label="Elena IT Services - Home"
          className="flex items-center gap-3"
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Elena IT Services Logo"
              className="h-13 w-auto"
            />
          ) : null}
        </Link>

        {isDesktopViewport ? (
          <DesktopMenu
            menuLinks={menuLinks}
            isActive={isActive}
            isHashActive={isHashActive}
          />
        ) : null}

        {isDesktopViewport && hasDesktopActions ? (
          <div className="hidden xl:flex items-center gap-4">
            {cta?.text && cta?.to ? (
              <Button variant="quote" text={cta.text} to={cta.to} />
            ) : null}
          </div>
        ) : null}

        {!isDesktopViewport && !isMobileMenuOpen ? (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden relative z-1051 w-10 h-10 flex items-center justify-center transition-transform duration-200 active:scale-90"
            aria-label="Open menu"
            aria-expanded={false}
          >
            <Menu className="w-6 h-6 text-[#0B1B3A]" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const Navbar = ({ content = {} }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileGroups, setOpenMobileGroups] = useState({});
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
  );
  const { pathname, hash } = useLocation();

  const navLinks = Array.isArray(content.navLinks)
    ? content.navLinks.filter(
        (link) =>
          link?.isActive !== false &&
          String(link?.name || "").trim() &&
          String(link?.href || "").trim(),
      )
    : [];

  const sortedNavLinks = [...navLinks].sort((left, right) => {
    const leftOrder = Number(left?.order);
    const rightOrder = Number(right?.order);
    const leftHasOrder = Number.isFinite(leftOrder);
    const rightHasOrder = Number.isFinite(rightOrder);

    if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (leftHasOrder && !rightHasOrder) return -1;
    if (!leftHasOrder && rightHasOrder) return 1;

    return String(left?.name || "").localeCompare(String(right?.name || ""));
  });



  const menuLinks = [];
  sortedNavLinks.forEach((link) => {
    let finalLink = { ...link };

    const nameLower = String(finalLink.name || "").trim().toLowerCase();
    if (nameLower === "career" || nameLower === "careers") {
      finalLink.href = "/career";
    }

    if (finalLink.href === "/about") {
      finalLink = {
        ...finalLink,
        children: [],
      };
    } else {
      const cmsChildren = normalizeChildLinks(finalLink?.children);
      const autoChildren = normalizeChildLinks(AUTO_SECTION_DROPDOWNS[finalLink.href]);
      finalLink = {
        ...finalLink,
        children: cmsChildren.length > 0 ? cmsChildren : autoChildren,
      };
    }

    menuLinks.push(finalLink);
  });

  const cta = content.cta || {};
  const mobile = content.mobile || {};
  const mobileSocials = Array.isArray(mobile.socials)
    ? mobile.socials.filter(
        (social) =>
          social?.isActive !== false &&
          String(social?.name || "").trim() &&
          String(social?.href || "").trim(),
      )
    : [];

  const apiRoot = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
  const logoSrc = (() => {
    const raw = String(content.logoUrl || "").trim();
    const finalRaw = raw ? raw : "/images/elena logo.png";
    if (/^https?:\/\//i.test(finalRaw)) return finalRaw;
    if (finalRaw.startsWith("/uploads/")) return apiRoot + finalRaw;
    if (/^uploads\//i.test(finalRaw)) return apiRoot + "/" + finalRaw;
    return finalRaw;
  })();

  const topBar = content.topBar || {};
  const marqueeMessage = String(topBar.message || "").trim();
  const liveLabel = String(topBar.liveLabel || "").trim();
  const badgeText = String(topBar.badgeText || "").trim();
  const hasTopBar = Boolean(marqueeMessage || liveLabel || badgeText);

  const getSocialIcon = (name) => {
    const normalized = String(name || "")
      .trim()
      .toLowerCase();
    if (normalized.includes("linkedin")) return Linkedin;
    return Facebook;
  };

  useEffect(() => {
    const onResize = () => {
      const nowDesktop = window.innerWidth >= 1024;
      setIsDesktopViewport(nowDesktop);
      // Collapse the mobile menu right at the transition that makes it
      // irrelevant, instead of a separate effect reacting to the resulting
      // state change.
      if (nowDesktop) {
        setIsMobileMenuOpen(false);
        setOpenMobileGroups({});
      }
    };

    window.addEventListener("resize", onResize, { passive: true });
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight * 0.3;
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isMobileMenuOpen]);

  // openMobileGroups is reset here rather than at each of the several
  // "close menu" click handlers below, so closing the mobile menu always
  // collapses its accordion state regardless of how it was closed.
  useEffect(() => {
    if (!isMobileMenuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenMobileGroups({});
    }
  }, [isMobileMenuOpen]);

  const isActive = (href) => {
    const target = String(href || "").trim();
    if (!target) return false;
    if (target === "/") return pathname === "/";
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const isHashActive = (href) => {
    const raw = String(href || "").trim();
    if (!raw) return false;

    const [targetPath, targetHash] = raw.split("#");
    if (targetPath && targetPath !== pathname) return false;

    if (!targetHash) {
      return pathname === targetPath;
    }

    return pathname === targetPath && hash === `#${targetHash}`;
  };

  const toggleMobileGroup = (href) => {
    setOpenMobileGroups((previous) => ({
      ...previous,
      [href]: !previous[href],
    }));
  };

  if (!hasTopBar && !logoSrc && menuLinks.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes navbarMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .navbar-marquee-track {
          animation: navbarMarquee 22s linear infinite;
          will-change: transform;
        }
      `}</style>

      {hasTopBar ? (
        <div className="border-b border-black/10 bg-[#F3F6FB]">
          <div className="mx-auto flex h-9 w-full max-w-330 items-center gap-3 overflow-hidden px-6 md:px-10">
            {liveLabel ? (
              <div className="flex shrink-0 items-center gap-2 text-[#0E9F6E]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0E9F6E]" />
                <span className="text-sm font-bold leading-none">
                  {liveLabel}
                </span>
              </div>
            ) : null}
            {marqueeMessage ? (
              <div className="relative flex-1 overflow-hidden">
                <div className="navbar-marquee-track flex w-max items-center gap-10 text-xs text-[#0B1B3A]/80 sm:text-sm">
                  <span className="shrink-0 whitespace-nowrap">
                    {marqueeMessage}
                    {badgeText ? (
                      <>
                        &nbsp;
                        <span className="mx-3 inline-flex rounded-full bg-[#1C64EC] px-2.5 py-0.5 text-[11px] font-semibold text-white sm:text-xs">
                          {badgeText}
                        </span>
                      </>
                    ) : null}
                  </span>
                  <span
                    className="shrink-0 whitespace-nowrap"
                    aria-hidden="true"
                  >
                    {marqueeMessage}
                    {badgeText ? (
                      <>
                        &nbsp;
                        <span className="mx-3 inline-flex rounded-full bg-[#1C64EC] px-2.5 py-0.5 text-[11px] font-semibold text-white sm:text-xs">
                          {badgeText}
                        </span>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <nav className="relative w-full bg-white border-b border-black/10">
        <NavInner
          isDesktopViewport={isDesktopViewport}
          isActive={isActive}
          isHashActive={isHashActive}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          menuLinks={menuLinks}
          cta={cta}
          whatsappHref={content.whatsappHref}
          logoSrc={logoSrc}
        />
      </nav>

      {isDesktopViewport && isScrolled ? (
        <nav className="fixed top-0 inset-x-0 z-1000 w-full transition-all duration-500 translate-y-0 opacity-100 shadow-[0_4px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl bg-white/95 border-b border-black/10">
          <NavInner
            isDesktopViewport={isDesktopViewport}
            isActive={isActive}
            isHashActive={isHashActive}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            menuLinks={menuLinks}
            cta={cta}
            whatsappHref={content.whatsappHref}
            logoSrc={logoSrc}
          />
        </nav>
      ) : null}

      {!isDesktopViewport ? (
        <div
          className={`fixed inset-0 z-1049 bg-black/60 lg:hidden transition-opacity duration-300 ${
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {!isDesktopViewport ? (
        <div
          className={`fixed top-0 right-0 bottom-0 z-1050 w-full max-w-85 bg-white shadow-2xl lg:hidden
            flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex h-22 shrink-0 items-center justify-between border-b border-black/10 px-6">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Elena IT Services - Home"
              className="flex items-center gap-2"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Elena IT Services Logo"
                  className="h-9 w-auto"
                />
              ) : null}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 text-[#0B1B3A] transition-all duration-200 hover:border-[#0E70C4] hover:bg-[#0E70C4]/10 active:scale-90 hover:rotate-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col flex-1 px-8 pb-8 pt-6">
            <nav className="flex flex-col mb-8">
              {menuLinks.map((link) => {
                const showDropdown = shouldShowDropdown(link);

                if (!showDropdown) {
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`py-4 pl-3 text-lg font-medium border-b border-black/10 transition-all duration-200 ${
                        isActive(link.href)
                          ? "text-[#0E70C4]"
                          : "text-[#0B1B3A] hover:text-[#0E70C4] hover:pl-5"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                }

                const isOpen = Boolean(openMobileGroups[link.href]);

                return (
                  <div key={link.name} className="border-b border-black/10">
                    <div className="flex items-center gap-2">
                      <Link
                        to={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex-1 py-4 pl-3 text-lg font-medium transition-all duration-200 ${
                          isActive(link.href)
                            ? "text-[#0E70C4]"
                            : "text-[#0B1B3A] hover:text-[#0E70C4] hover:pl-5"
                        }`}
                      >
                        {link.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleMobileGroup(link.href)}
                        className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0B1B3A]/70 transition-colors hover:bg-black/5 hover:text-[#0E70C4]"
                        aria-label={`Toggle ${link.name} sub menu`}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-105 pb-3" : "max-h-0"
                      }`}
                    >
                      <div className="ml-5 border-l border-black/10 pl-4">
                        {link.children.map((child) => (
                          <Link
                            key={`${link.name}-${child.name}`}
                            to={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block py-2 text-sm font-medium transition-colors ${
                              isHashActive(child.href)
                                ? "text-[#0E70C4]"
                                : "text-[#0B1B3A]/70 hover:text-[#0E70C4]"
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto space-y-4 border-t border-black/10 pt-6">
              {mobile.locationHref && mobile.locationText ? (
                <a
                  href={mobile.locationHref}
                  className="flex items-center gap-3 text-[#0B1B3A]/70 hover:text-[#0E70C4] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-5 h-5 shrink-0 text-[#0E70C4]" />
                  <span className="text-sm">{mobile.locationText}</span>
                </a>
              ) : null}

              {mobile.phoneHref && mobile.phone ? (
                <a
                  href={mobile.phoneHref}
                  className="flex items-center gap-3 text-[#0B1B3A]/70 hover:text-[#0E70C4] transition-colors"
                >
                  <Phone className="w-5 h-5 shrink-0 text-[#0E70C4]" />
                  <span className="text-sm">{mobile.phone}</span>
                </a>
              ) : null}

              {mobile.emailHref && mobile.email ? (
                <a
                  href={mobile.emailHref}
                  className="flex items-center gap-3 text-[#0B1B3A]/70 hover:text-[#0E70C4] transition-colors"
                >
                  <Mail className="w-5 h-5 shrink-0 text-[#0E70C4]" />
                  <span className="text-sm">{mobile.email}</span>
                </a>
              ) : null}

              <div className="flex items-center gap-4 pt-4">
                {mobileSocials.map((social) => {
                  const Icon = getSocialIcon(social?.name);
                  const label = social?.name;

                  return (
                    <a
                      key={`${label}-${social?.href || ""}`}
                      href={social?.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 flex items-center justify-center border border-black/20 rounded-full text-[#0B1B3A] hover:bg-[#0E70C4] hover:border-[#0E70C4] hover:text-white transition-all"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
