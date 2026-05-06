import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import { getBlogs } from "@/api/Apis";
import useScrollReveal from "@/hooks/useScrollReveal";

/* ─── Section label icon ─── */
const LabelIcon = () => (
  <svg
    width="20"
    height="12"
    viewBox="0 0 20 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.75"
      y="0.747803"
      width="18.5"
      height="10.5"
      rx="5.25"
      stroke="#3C72FC"
      strokeWidth="1.5"
    />
    <mask id="blog-mask" fill="white">
      <path d="M3 5.9978C3 3.78866 4.79086 1.9978 7 1.9978H13C15.2091 1.9978 17 3.78866 17 5.9978C17 8.20694 15.2091 9.9978 13 9.9978H7C4.79086 9.9978 3 8.20694 3 5.9978Z" />
    </mask>
    <path
      d="M3 5.9978C3 2.96024 5.46243 0.497803 8.5 0.497803H11.5C14.5376 0.497803 17 2.96024 17 5.9978C17 4.61709 15.2091 3.4978 13 3.4978H7C4.79086 3.4978 3 4.61709 3 5.9978ZM17 5.9978C17 9.03537 14.5376 11.4978 11.5 11.4978H8.5C5.46243 11.4978 3 9.03537 3 5.9978C3 7.37851 4.79086 8.4978 7 8.4978H13C15.2091 8.4978 17 7.37851 17 5.9978Z"
      fill="#3C72FC"
      mask="url(#blog-mask)"
    />
  </svg>
);

/* ─── Date badge ─── */
const DateBadge = ({ day, month }) => (
  <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-12 h-14 bg-[#3c72fc] text-white rounded z-10">
    <span className="text-xl font-bold leading-none">{day}</span>
    <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mt-0.5">
      {month}
    </span>
  </div>
);

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const headingRef = useScrollReveal();
  const blogsRef = useScrollReveal();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = useCallback((value) => {
    if (!value) return "https://placehold.co/1200x800/151327/ffffff?text=Blog";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  }, [apiRoot]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getBlogs();
        const mapped = (Array.isArray(data) ? data : [])
          .slice(0, 3)
          .map((item, index) => {
          const created = item.createdAt ? new Date(item.createdAt) : null;
          const isValidDate =
            created instanceof Date && !Number.isNaN(created.getTime());
          const monthLabel = isValidDate
            ? created.toLocaleString("en-US", { month: "short" })
            : "";
          const day = isValidDate
            ? String(created.getDate()).padStart(2, "0")
            : "--";
          const month = monthLabel ? monthLabel.toUpperCase() : "---";

          // CHANGE: Use cover_image from API (snake_case from database)
          const coverImageField = item.cover_image || item.coverImage || '';

          return {
            id: item._id,
            title: item.title,
            excerpt: item.excerpt,
            category: item.category || "General",
            image: resolveImage(coverImageField),
            link: "/blog/" + (item.slug || item._id),
            adminName: item.author || "Admin",
            date: { day, month },
            featured: index === 0,
          };
        });
        setBlogs(mapped);
      } catch (error) {
        console.error(error);
        setBlogs([]);
      }
    };

    load();
  }, [resolveImage]);

  const featured = blogs.find((b) => b.featured);
  const side = blogs.filter((b) => !b.featured);

  return (
    <section className="relative py-24 bg-[#0f0d1d] overflow-hidden">
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        {/* ── Header row ── */}
        <div ref={headingRef} className="sr-hidden sr-up flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-12">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc] mb-3">
              <LabelIcon />
              Blog &amp; News
            </p>
            <h2 className="text-3xl md:text-[38px] font-bold text-white leading-snug">
              Explore Blogs And News
            </h2>
          </div>
          <div className="shrink-0">
            <Button text="View All News" to="/blog" />
          </div>
        </div>

        {/* ── Grid layout ── */}
        <div ref={blogsRef} className="sr-hidden sr-up grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch">
          {/* Featured (large) card */}
          {featured && (
            <Link
              to={featured.link}
              id={`blog-featured-${featured.id}`}
              className="group flex flex-col h-full border border-white/10 overflow-hidden hover:border-[#3c72fc]/50 transition-all duration-300"
              style={{ background: "rgba(21,19,39,0.7)" }}
            >
              {/* Image */}
              <div className="relative overflow-hidden h-56 md:h-64">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <DateBadge
                  day={featured.date.day}
                  month={featured.date.month}
                />
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-6">
                <span className="text-[#3c72fc] text-xs font-semibold uppercase tracking-wider mb-3">
                  {featured.category}
                </span>
                <h3 className="text-white font-bold text-xl leading-snug mb-3 group-hover:text-[#3c72fc] transition-colors duration-300">
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">
                    {featured.excerpt}
                  </p>
                )}
                {/* Author + Read More */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    {/* <span
                      aria-hidden="true"
                      className="w-10 h-10 rounded-full border-2 border-[#3c72fc]/40 bg-[#3c72fc]"
                    /> */}
                    <div>
                      <span className="text-[#3c72fc] text-lg font-semibold">
                        By {featured.adminName}
                      </span>
                    </div>
                  </div>
                  <Button text="Read More" to={featured.link} />
                </div>
              </div>
            </Link>
          )}

          {/* Side cards (stacked) */}
          <div className="flex h-full flex-col gap-6">
            {side.map((blog) => (
              <Link
                to={blog.link}
                key={blog.id}
                id={`blog-card-${blog.id}`}
                className="group flex flex-1 items-center gap-5 border border-white/10 overflow-hidden p-6 hover:border-[#3c72fc]/50 transition-all duration-300"
                style={{ background: "rgba(21,19,39,0.7)" }}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-35 h-35 overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <DateBadge day={blog.date.day} month={blog.date.month} />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[#3c72fc] text-xs font-semibold uppercase tracking-wider mb-2">
                    {blog.category}
                  </span>
                  <h3 className="text-white font-bold text-[15px] leading-snug mb-3 group-hover:text-[#3c72fc] transition-colors duration-300 line-clamp-2">
                    {blog.title}
                  </h3>
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    {/* <span
                      aria-hidden="true"
                      className="w-7 h-7 rounded-full border border-[#3c72fc]/40 bg-[#3c72fc]"
                    /> */}
                    <div>
                      <span className="text-[#3c72fc] text-l font-semibold">
                        By {blog.adminName}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blogs;
