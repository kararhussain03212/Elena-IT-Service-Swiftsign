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
    if (!value) return "https://placehold.co/1200x800/0B1B3A/ffffff?text=Blog";
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
    .slice(0, 4);

  if (loading) {
    return (
      <section className="bg-white">
        <Banner
          title="Blog Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Blog", to: "/blog" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-[#0B1B3A]">
          <p className="text-[#0B1B3A]/70">Loading blog...</p>
        </div>
      </section>
    );
  }

  if (!currentBlog) {
    return (
      <section className="bg-white">
        <Banner
          title="Blog Details"
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Blog", to: "/blog" },
          ]}
        />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-[#0B1B3A]">
          <h2 className="text-2xl font-bold">Blog not found</h2>
          <p className="mt-3 text-[#0B1B3A]/70">
            The blog you are looking for does not exist.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 text-[#0E70C4] hover:text-[#0B1B3A] transition-colors"
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
    <main className="bg-white">
      <Banner
        title="Blog Details"
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Blog", to: "/blog" },
          { label: currentBlog.title },
        ]}
      />

      <section className="py-16 md:py-24 bg-slate-50/50">
        <div className="mx-auto w-full max-w-[1240px] px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="rounded-[18px] ring-1 ring-black/5 p-5 md:p-10 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_10px_20px_-2px_rgba(0,0,0,0.01)]">
                <div
                  ref={coverRef}
                  className="sr-hidden sr-up mb-8 overflow-hidden rounded-[12px]"
                >
                  <img
                    src={resolveImage(currentBlog.cover_image || currentBlog.coverImage)}
                    alt={currentBlog.title}
                    className="max-h-[520px] w-full object-cover"
                  />
                </div>

                <div ref={contentRef} className="sr-hidden sr-up mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#0B1B3A] leading-snug">
                    {currentBlog.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-black/10 pb-5 text-xs text-[#0B1B3A]/90">
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1">
                      <FaUser size={12} />
                      {currentBlog.author ?? "Admin"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1">
                      <FaCalendarAlt size={12} />
                      {blogDate}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1">
                      <FaClock size={12} />
                      {currentBlog.readTime || "5 min read"}
                    </span>
                  </div>
                </div>

                {currentBlog.content ? (
                  <div
                    className="blog-content text-black"
                    dangerouslySetInnerHTML={{ __html: currentBlog.content }}
                  />
                ) : (
                  <p className="text-[#0B1B3A]/75 leading-[1.9] text-[16px] mb-6">
                    {currentBlog.excerpt ??
                      "Stay updated with the newest trends, insights, and news from our team."}
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {relatedBlogs.length > 0 && (
                <div
                  ref={relatedRef}
                  className="sr-hidden sr-up sticky top-28 rounded-[18px] ring-1 ring-black/5 p-6 md:p-8 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_10px_20px_-2px_rgba(0,0,0,0.01)]"
                >
                  <h3 className="text-[18px] font-bold text-[#0B1B3A] mb-6 pb-4 border-b border-black/10">
                    Related Articles
                  </h3>
                  <div className="flex flex-col gap-6">
                    {relatedBlogs.map((item) => (
                      <Link
                        key={item._id}
                        to={"/blog/" + (item.slug || item._id)}
                        className="group flex gap-4 transition-colors items-center"
                      >
                        <div className="w-[85px] h-[75px] shrink-0 overflow-hidden rounded-[8px]">
                          <img
                            src={resolveImage(item.coverImage)}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-semibold text-[#0B1B3A] leading-snug line-clamp-2 group-hover:text-[#0E70C4] transition-colors">
                            {item.title}
                          </h4>
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#0B1B3A]/60 font-medium tracking-wide">
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
