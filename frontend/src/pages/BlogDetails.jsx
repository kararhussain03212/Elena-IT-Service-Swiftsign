import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Banner from "@/components/Banner";
import { getBlogById, getBlogBySlug, getBlogs } from "@/api/Apis";
import { FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";
import useScrollReveal from "@/hooks/useScrollReveal";

const BlogDetails = () => {
  const { slug } = useParams();
  const [currentBlog, setCurrentBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const coverRef = useScrollReveal();
  const contentRef = useScrollReveal();
  const relatedRef = useScrollReveal();

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
      setLoading(true);
      try {
        let blogRes;
        try {
          blogRes = await getBlogBySlug(slug);
        } catch {
          blogRes = await getBlogById(slug);
        }

        const listRes = await getBlogs();
        setCurrentBlog(blogRes?.data || null);
        setAllBlogs(Array.isArray(listRes?.data) ? listRes.data : []);
      } catch (error) {
        console.error(error);
        setCurrentBlog(null);
        setAllBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const relatedBlogs = allBlogs
    .filter((item) => item._id !== currentBlog?._id)
    .slice(0, 2);

  if (loading) {
    return (
      <section className="bg-[#0f0d1d]">
        <Banner
          title="Blog Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Blog", to: "/blog" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-white">
          <p className="text-white/70">Loading blog...</p>
        </div>
      </section>
    );
  }

  if (!currentBlog) {
    return (
      <section className="bg-[#0f0d1d]">
        <Banner
          title="Blog Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Blog", to: "/blog" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-white">
          <h2 className="text-2xl font-bold">Blog not found</h2>
          <p className="mt-3 text-white/70">
            The blog you are looking for does not exist.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 text-[#3c72fc] hover:text-white transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  const blogDate = currentBlog?.createdAt
    ? `${new Date(currentBlog.createdAt).toLocaleString("en-US", {
        month: "short",
      })} ${String(new Date(currentBlog.createdAt).getDate()).padStart(2, "0")}`
    : "Mar 05";

  return (
    <main className="bg-[#0f0d1d]">
      <Banner
        title="Blog Details"
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Blog", to: "/blog" },
          { label: currentBlog.title },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1100px] px-6 md:px-10">
          <div className="relative">
            <div className="-[18px] ring-1 ring-white/5 md:p-10">
              <div
                ref={coverRef}
                className="sr-hidden sr-up mb-8 overflow-hidden "
              >
                <img
                  src={resolveImage(currentBlog.coverImage)}
                  alt={currentBlog.title}
                  className="max-h-[520px] w-full object-cover"
                />
              </div>

              <div ref={contentRef} className="sr-hidden sr-up mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-snug">
                  {currentBlog.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5 text-xs text-white/60">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <FaUser size={12} />
                    {currentBlog.author ?? "Admin"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <FaCalendarAlt size={12} />
                    {blogDate}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <FaClock size={12} />
                    {currentBlog.readTime || "5 min read"}
                  </span>
                </div>
              </div>

              {currentBlog.content ? (
                <div
                  className="blog-content text-white/70"
                  dangerouslySetInnerHTML={{ __html: currentBlog.content }}
                />
              ) : (
                <p className="text-white/70 leading-[1.9] text-[16px] mb-6">
                  {currentBlog.excerpt ??
                    "Stay updated with the newest trends, insights, and news from our team."}
                </p>
              )}

              {relatedBlogs.length > 0 && (
                <div
                  ref={relatedRef}
                  className="sr-hidden sr-up mt-10 border-t border-white/10 pt-8"
                >
                  <h3 className="text-xl font-semibold text-white mb-5">
                    Related Articles You Might Like
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {relatedBlogs.map((item) => (
                      <Link
                        key={item._id}
                        to={"/blog/" + (item.slug || item._id)}
                        className="group flex items-center gap-4 rounded-[14px] border border-white/10 bg-[#0f0d1d] p-4 transition-colors hover:border-[#3c72fc]/60"
                      >
                        <div className="w-24 shrink-0 overflow-hidden rounded-[10px]">
                          <img
                            src={resolveImage(item.coverImage)}
                            alt={item.title}
                            className="h-20 w-24 object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
                            <FaCalendarAlt size={10} />
                            {item?.createdAt
                              ? `${new Date(item.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                  },
                                )} ${String(new Date(item.createdAt).getDate()).padStart(2, "0")}`
                              : "--"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogDetails;
