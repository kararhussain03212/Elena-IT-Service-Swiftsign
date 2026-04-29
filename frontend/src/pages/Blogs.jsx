import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "@/components/Banner";
import { getBlogs } from "@/api/Apis";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import useScrollReveal from "@/hooks/useScrollReveal";
import useScrollRevealGrid from "@/hooks/useScrollRevealGrid";

const formatDate = (blog) => {
  if (blog?.createdAt) {
    const date = new Date(blog.createdAt);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${month} ${day}`;
  }
  return "--";
};

const getExcerpt = (blog) =>
  blog?.excerpt ??
  "Stay updated with the newest trends, insights, and news from our team.";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const headingRef = useScrollReveal();
  const gridRef = useScrollRevealGrid(blogs);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value) return "https://placehold.co/1200x800/151327/ffffff?text=Blog";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    if (/^uploads\//i.test(value))
      return apiRoot + "/" + value.replace(/^\/+/, "");
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getBlogs();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setBlogs([]);
      }
    };

    load();
  }, []);

  return (
    <section className="bg-[#0f0d1d]">
      <Banner
        title="Blogs"
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Blogs", to: "/blog" },
        ]}
      />
      <div className="mx-auto w-full py-20 md:py-28 max-w-[1320px] px-6 md:px-10">
        <div ref={headingRef} className="sr-hidden sr-up mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Latest Blog Posts
          </h2>
          <p className="text-white/60">
            Stay updated with the newest trends, insights, and news from our
            team.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => (
            <article
              key={blog._id}
              className="sr-hidden sr-up group flex h-full flex-col overflow-hidden border border-white/10 bg-[#151327] shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <Link
                to={"/blog/" + (blog.slug || blog._id)}
                className="block overflow-hidden"
              >
                <img
                  src={resolveImage(blog.cover_image || blog.coverImage)}
                  alt={blog.title}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-90"
                />
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <ul className="flex items-center gap-5 text-white/60 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <FaCalendarAlt size={18} aria-hidden="true" />
                    <span>{formatDate(blog)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaClock size={18} aria-hidden="true" />
                    <span>{blog.readTime || "5 min read"}</span>
                  </li>
                </ul>
                <h3 className="text-white text-lg font-semibold leading-snug">
                  <Link
                    to={"/blog/" + (blog.slug || blog._id)}
                    className="transition-colors hover:text-[#3c72fc]"
                  >
                    {blog.title}
                  </Link>
                </h3>
                <p className="mt-3 text-white/60 text-sm leading-relaxed">
                  {getExcerpt(blog)}
                </p>
                <Link
                  to={"/blog/" + (blog.slug || blog._id)}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-white/60 hover:text-[#3c72fc] transition-colors"
                >
                  Read More
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    -&gt;
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blogs;
