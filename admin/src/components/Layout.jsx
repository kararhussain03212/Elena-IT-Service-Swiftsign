import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import swiftLogo from "../assets/images/logo/without text.png";
import { normalizeUserRole } from "../modules/users/constants.js";
import { SECTION_PAGES } from "../pages/sections/sectionDefinitions";

const baseNavItems = [
  { path: "/", label: "Dashboard" },
  { path: "/users", label: "Users" },
  { path: "/sliders", label: "Sliders" },
  { path: "/services", label: "Services" },
  { path: "/sub-services", label: "Sub Services" },
  { path: "/projects", label: "Projects" },
  { path: "/team", label: "Team" },
  { path: "/testimonials", label: "Testimonials" },
  { path: "/blogs", label: "Blogs" },
  { path: "/contact-messages", label: "Contact Messages", adminOnly: true },
  { path: "/program-applications", label: "Program Applications" },
  { path: "/newsletter-subscribers", label: "Newsletter Subscribers" },
  { path: "/settings", label: "Settings" },
];

const sectionNavItems = SECTION_PAGES.map((item) => ({
  key: item.key,
  path: item.path,
  label: item.label,
}));

const sectionGroupOrder = ["global", "home", "about", "contact", "career", "certification"];
const sectionGroupLabels = {
  global: "Global",
  home: "Home",
  about: "About",
  contact: "Contact",
  career: "Career",
  certification: "Certifications",
};

const getSectionGroup = (sectionKey) => {
  const value = String(sectionKey || "").trim().toLowerCase();
  if (!value) return "other";
  return value.split(".")[0] || "other";
};

const getSectionGroups = (isAdmin) => {
  return sectionGroupOrder
    .map((groupKey) => {
      let items = sectionNavItems.filter((item) => getSectionGroup(item.key) === groupKey);
      if (groupKey === "career") {
        const careerItems = [
          { path: "/career-page-settings", label: "Career Page Settings" },
          { path: "/career-programs", label: "Career Programs" },
        ];
        careerItems.push(...items);
        items = careerItems;
      }
      return {
        key: groupKey,
        label: sectionGroupLabels[groupKey] || groupKey,
        items,
      };
    })
    .filter((group) => group.items.length > 0);
};

const navItems = [
  ...baseNavItems.slice(0, 9),
  { path: "/sections", label: "Sections", isDropdown: true },
  ...baseNavItems.slice(9),
];

const sectionPathMap = new Map([
  ...sectionNavItems.map((item) => [item.path, item.label]),
  ["/contact-messages", "Contact Messages"],
  ["/certifications/new", "Add Certification"],
  ["/career-page-settings", "Career Page Settings"],
  ["/career-programs", "Career Programs"],
  ["/career-programs/new", "Add Career Program"],
  ["/program-applications", "Program Applications"],
  ["/newsletter-subscribers", "Newsletter Subscribers"],
]);

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = normalizeUserRole(user?.role) === "admin";
  const sectionGroups = getSectionGroups(isAdmin);
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );
  const apiRoot = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");
  const avatarUrl = (() => {
    const raw = String(user?.avatar || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = raw.startsWith("/uploads/")
      ? raw
      : `/uploads/${raw.replace(/^\/?uploads\//i, "")}`;
    return `${apiRoot}${normalized}`;
  })();

  const isActivePath = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const showBackButton = /\/(new|edit\/[^/]+)$/.test(location.pathname);
  const currentNavItem = visibleNavItems.find((item) => item.path === location.pathname);
  const currentSectionLabel = (() => {
    if (location.pathname.startsWith("/certifications/edit/")) {
      return "Edit Certification Details";
    }
    if (location.pathname.startsWith("/career-programs/edit/")) {
      return "Manage Career Program";
    }
    return sectionPathMap.get(location.pathname);
  })();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <div className="admin-theme flex min-h-screen bg-[#0B1B3A]">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 bottom-0 w-65 bg-[#0F2350]
        border-r border-white/6 flex flex-col z-[100]
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/6">
          <div className="flex items-center gap-3">
            <img src={swiftLogo} alt="Elena IT Services" className="h-11 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight text-white">elena</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3EB6AC]">IT Services</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 px-3 py-2 mt-2">
            Main
          </p>
          {visibleNavItems.map((item) => {
            if (!item.isDropdown) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5 duration-200
                    ${
                      isActivePath(item.path)
                        ? "bg-[#0E70C4]/15 text-white border "
                        : "text-white/70 hover:text-white"
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            }

            const sectionRouteActive =
              isActivePath("/sections") ||
              isActivePath("/certifications") ||
              isActivePath("/career-page-settings") ||
              isActivePath("/career-programs");

            return (
              <div key={item.path} className="mb-1">
                <button
                  type="button"
                  onClick={() => setSectionsOpen((previous) => !previous)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl duration-200 ${
                    sectionRouteActive
                      ? "bg-[#0E70C4]/15 text-white border"
                      : "text-white/70 hover:text-white"
                  }`}
                  aria-expanded={sectionsOpen}
                  aria-label="Toggle sections menu"
                >
                  <span>{item.label}</span>
                  <span className={`text-xs transition-transform ${sectionsOpen ? "rotate-180" : "rotate-0"}`}>
                    ▼
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${sectionsOpen ? "max-h-300 mt-1" : "max-h-0"}`}>
                  <div className="space-y-2 rounded-xl border border-white/5 bg-white/2 p-2">
                    {sectionGroups.map((group) => (
                      <div key={group.key}>
                        <p className="px-2 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35">
                          {group.label}
                        </p>
                        <div>
                          {group.items.map((sectionItem) => {
                            const isCurrent = location.pathname === sectionItem.path;
                            return (
                              <Link
                                key={sectionItem.path}
                                to={sectionItem.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`block rounded-lg px-2.5 py-2 text-sm transition-colors ${
                                  isCurrent
                                    ? "bg-[#0E70C4]/20 text-white"
                                    : "text-white/75 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {sectionItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/6">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-[#0E70C4] to-[#1f3f99] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-white/30">
                {user?.role?.replace("_", " ") || "User"}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="text-white/30 hover:text-white/70 text-sm"
            >
              ⇥
            </button>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-65 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-50 h-16 bg-[#0F2350] border-b border-white/6 flex items-center gap-4 px-6">
          {!sidebarOpen ? (
            <button
              className="lg:hidden text-white/50 hover:text-white text-xl"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          ) : null}
          <h1 className="flex-1 font-bold text-white text-lg capitalize">
            {location.pathname === "/"
              ? "Dashboard"
              : currentSectionLabel || currentNavItem?.label || location.pathname.slice(1)}
          </h1>

          {showBackButton ? (
            <button
              onClick={handleGoBack}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              {"< Back"}
            </button>
          ) : null}

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 text-white">{children}</main>
      </div>

      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Confirm Logout</h2>
            <p className="mt-2 text-sm text-white/75">Do you want to logout?</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancelLogout}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c]"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
