import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogs } from "../api/blog";
import { getContactMessages } from "../api/contactMessageApi";
import { getProjects } from "../api/projectApi";
import { getServices } from "../api/serviceApi";
import { getSections } from "../api/sectionApi";
import { getSliders } from "../api/sliderApi";
import { getSubServices } from "../api/subServiceApi";
import { getTeamMembers } from "../api/teamApi";
import { getTestimonials } from "../api/testimonialApi";
import { useAuth } from "../context/useAuth";
import { normalizeUserRole } from "../modules/users/constants";

const MODULE_CONFIG = [
  {
    key: "services",
    label: "Services",
    href: "/services",
    createHref: "/services/new",
    fetcher: getServices,
    statusField: "isActive",
    gradientClass: "from-sky-500/25 via-sky-400/10 to-transparent",
    accentClass: "bg-sky-500/15 text-sky-200 border-sky-400/35",
  },
  {
    key: "sub-services",
    label: "Sub Services",
    href: "/sub-services",
    createHref: "/sub-services/new",
    fetcher: getSubServices,
    statusField: "isActive",
    gradientClass: "from-violet-500/25 via-violet-400/10 to-transparent",
    accentClass: "bg-violet-500/15 text-violet-200 border-violet-400/35",
  },
  {
    key: "projects",
    label: "Projects",
    href: "/projects",
    createHref: "/projects/new",
    fetcher: getProjects,
    statusField: "isActive",
    gradientClass: "from-emerald-500/25 via-emerald-400/10 to-transparent",
    accentClass: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
  },
  {
    key: "blogs",
    label: "Blogs",
    href: "/blogs",
    createHref: "/blogs/new",
    fetcher: getBlogs,
    statusField: "published",
    gradientClass: "from-orange-500/25 via-orange-400/10 to-transparent",
    accentClass: "bg-orange-500/15 text-orange-200 border-orange-400/35",
  },
  {
    key: "team",
    label: "Team Members",
    href: "/team",
    createHref: "/team/new",
    fetcher: getTeamMembers,
    statusField: "isActive",
    gradientClass: "from-indigo-500/25 via-indigo-400/10 to-transparent",
    accentClass: "bg-indigo-500/15 text-indigo-200 border-indigo-400/35",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    href: "/testimonials",
    createHref: "/testimonials/new",
    fetcher: getTestimonials,
    statusField: "isActive",
    gradientClass: "from-fuchsia-500/25 via-fuchsia-400/10 to-transparent",
    accentClass: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/35",
  },
  {
    key: "sliders",
    label: "Sliders",
    href: "/sliders",
    createHref: "/sliders/new",
    fetcher: getSliders,
    statusField: "isActive",
    gradientClass: "from-cyan-500/25 via-cyan-400/10 to-transparent",
    accentClass: "bg-cyan-500/15 text-cyan-200 border-cyan-400/35",
  },
  {
    key: "sections",
    label: "Sections",
    href: "/sections",
    createHref: "/sections/new",
    fetcher: getSections,
    statusField: "isActive",
    gradientClass: "from-blue-500/25 via-blue-400/10 to-transparent",
    accentClass: "bg-blue-500/15 text-blue-200 border-blue-400/35",
  },
];

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sliders)) return payload.sliders;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const formatTimestamp = (value) => {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = normalizeUserRole(user?.role) === "admin";
  const [metrics, setMetrics] = useState([]);
  const [contactSummary, setContactSummary] = useState({
    total: 0,
    unread: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        MODULE_CONFIG.map(async (moduleConfig) => {
          const response = await moduleConfig.fetcher();
          const records = extractItems(response?.data);
          const total = records.length;
          const live = records.filter((record) =>
            Boolean(record?.[moduleConfig.statusField]),
          ).length;
          const draft = Math.max(0, total - live);

          return {
            ...moduleConfig,
            total,
            live,
            draft,
            liveRate: total > 0 ? Math.round((live / total) * 100) : 0,
          };
        }),
      );

      setMetrics(responses);

      if (isAdmin) {
        try {
          const [recentResponse, unreadResponse, totalResponse] =
            await Promise.all([
              getContactMessages({ limit: 5 }),
              getContactMessages({ read: false, limit: 1 }),
              getContactMessages({ limit: 1 }),
            ]);

          setContactSummary({
            total: Number(totalResponse?.data?.total || 0),
            unread: Number(unreadResponse?.data?.total || 0),
            recent: Array.isArray(recentResponse?.data?.items)
              ? recentResponse.data.items
              : [],
          });
        } catch (contactError) {
          console.error(contactError);
          setContactSummary({ total: 0, unread: 0, recent: [] });
        }
      } else {
        setContactSummary({ total: 0, unread: 0, recent: [] });
      }

      setLastUpdated(new Date());
    } catch (requestError) {
      console.error(requestError);
      setError("Failed to load dashboard metrics. Please try refreshing.");
      setMetrics([]);
      setContactSummary({ total: 0, unread: 0, recent: [] });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const summary = useMemo(() => {
    const totalContent = metrics.reduce((sum, item) => sum + item.total, 0);
    const liveContent = metrics.reduce((sum, item) => sum + item.live, 0);
    const draftContent = metrics.reduce((sum, item) => sum + item.draft, 0);
    const biggestModule =
      metrics.length === 0
        ? null
        : [...metrics].sort((left, right) => right.total - left.total)[0];

    return {
      totalContent,
      liveContent,
      draftContent,
      biggestModule,
    };
  }, [metrics]);

  const summaryCards = [
    {
      title: "Total Entries",
      value: summary.totalContent,
      subtitle: "Across all content modules",
      chip: "Content",
      chipClass: "bg-blue-500/15 text-blue-200 border-blue-400/35",
    },
    {
      title: "Live Entries",
      value: summary.liveContent,
      subtitle: "Published or active records",
      chip: "Live",
      chipClass: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
    },
    {
      title: "Draft or Inactive",
      value: summary.draftContent,
      subtitle: "Needs publish activation",
      chip: "Pending",
      chipClass: "bg-amber-500/15 text-amber-200 border-amber-400/35",
    },
    {
      title: "Largest Module",
      value: summary.biggestModule?.label || "--",
      subtitle: summary.biggestModule
        ? `${summary.biggestModule.total} records`
        : "No data yet",
      chip: "Insight",
      chipClass: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/35",
    },
  ];

  if (isAdmin) {
    summaryCards.push({
      title: "Contact Messages",
      value: contactSummary.total,
      subtitle: `${contactSummary.unread} unread messages`,
      chip: "Inbox",
      chipClass: "bg-cyan-500/15 text-cyan-200 border-cyan-400/35",
    });
  }

  return (
    <section className="admin-modern-page">
      <header className="relative overflow-hidden rounded-2xl border border-[#5f8fff]/20 bg-linear-to-r from-[#182447] via-[#151832] to-[#100f22] p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-20 left-8 h-48 w-48 rounded-full bg-[#0E70C4]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-8 h-52 w-52 rounded-full bg-[#14b8a6]/20 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-white/70">
              Professional overview of your admin content health and publishing
              activity.
            </p>
            <p className="mt-3 text-xs text-white/55">
              Last updated: {formatTimestamp(lastUpdated)}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardMetrics}
            disabled={loading}
            className="admin-modern-btn-secondary px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div
        className={`grid gap-4 md:grid-cols-2 ${isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
      >
        {summaryCards.map((card) => (
          <article key={card.title} className="admin-modern-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/55">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-white/55">{card.subtitle}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${card.chipClass}`}
              >
                {card.chip}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <article
                key={`metric-skeleton-${index}`}
                className="admin-modern-card p-4"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-8 w-20 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-2 w-full animate-pulse rounded bg-white/10" />
              </article>
            ))
          : metrics.map((item) => (
              <article
                key={item.key}
                className="admin-modern-card relative overflow-hidden p-4"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-linear-to-r ${item.gradientClass}`}
                />

                <div className="relative">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {item.label}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.accentClass}`}
                    >
                      {item.liveRate}% live
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-4xl font-bold text-white">
                      {item.total}
                    </p>
                    <div className="text-right text-xs text-white/65">
                      <p>
                        Live:{" "}
                        <span className="font-semibold text-white">
                          {item.live}
                        </span>
                      </p>
                      <p>
                        Draft:{" "}
                        <span className="font-semibold text-white">
                          {item.draft}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[#5f8fff] transition-all duration-500"
                      style={{ width: `${item.liveRate}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={item.href}
                      className="admin-modern-btn-edit text-xs"
                    >
                      Open Section
                    </Link>
                    <Link
                      to={item.createHref}
                      className="admin-modern-btn-secondary text-xs"
                    >
                      Add New
                    </Link>
                  </div>
                </div>
              </article>
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="admin-modern-card p-5">
          <h2 className="text-lg font-semibold text-white">Today</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            You can manage sliders, services, sub services, projects, team,
            testimonials and blogs from the sidebar. Use the "Add New" action in
            each section for fast publishing.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-white/65 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Keep records active to improve frontend visibility.
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              Review drafts weekly and convert top posts to published.
            </div>
          </div>
        </article>

        <article className="admin-modern-card p-5">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="mt-3 grid gap-2">
            {MODULE_CONFIG.slice(0, 4).map((item) => (
              <Link
                key={`${item.key}-quick`}
                to={item.createHref}
                className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
              >
                Create {item.label}
              </Link>
            ))}
          </div>
        </article>
      </div>

      {isAdmin ? (
        <article className="admin-modern-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              Recent Contact Messages
            </h2>
            <Link
              to="/contact-messages"
              className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              Open Inbox
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`contact-skeleton-${index}`}
                  className="h-14 animate-pulse rounded-lg bg-white/8"
                />
              ))}
            </div>
          ) : contactSummary.recent.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">
              No contact messages yet.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {contactSummary.recent.map((item) => (
                <div
                  key={item._id}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.name || "Unknown"}
                      </p>
                      <p className="text-xs text-white/65">
                        {item.email || "-"}
                      </p>
                    </div>
                    <span
                      className={
                        item.isRead
                          ? "rounded-full border border-green-400/35 bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-200"
                          : "rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                      }
                    >
                      {item.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-white/70">
                    {item.message || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      ) : null}
    </section>
  );
}
