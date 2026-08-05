import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteBlog, getBlogs, toggleBlogPublished } from "../../api/blog";
import usePermissionGuard from "../../hooks/usePermissionGuard";

const formatBlogDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
};

export default function BlogList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const coverSrc = (value) => {
    if (!value) return "https://placehold.co/1200x800/0B1B3A/ffffff?text=Blog";
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
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = String(item.category || "General").trim() || "General";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const archives = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const label = new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(date);
      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [items]);

  const popularPosts = useMemo(
    () =>
      [...items]
        .sort((a, b) => {
          const left = new Date(b.createdAt).getTime() || 0;
          const right = new Date(a.createdAt).getTime() || 0;
          return left - right;
        })
        .slice(0, 4),
    [items],
  );

  const tagCloud = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      (Array.isArray(item.tags) ? item.tags : []).forEach((tag) => {
        const cleaned = String(tag || "").trim();
        if (!cleaned) return;
        map.set(cleaned, (map.get(cleaned) || 0) + 1);
      });
    });

    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = items.filter((item) => {
      const category = String(item.category || "General");
      const status = item.published ? "published" : "draft";

      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;

      return [item.title, item.excerpt, item.author, item.category]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(query));
    });

    next.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "title_az")
        return String(a.title || "").localeCompare(String(b.title || ""));
      if (sortBy === "title_za")
        return String(b.title || "").localeCompare(String(a.title || ""));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [items, search, categoryFilter, statusFilter, sortBy]);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data."))
      return;
    if (!window.confirm("Delete this blog?")) return;
    await deleteBlog(id);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleTogglePublish = async (id) => {
    if (
      !guard(
        "publish_data",
        "You don't have permission to publish/activate data.",
      )
    )
      return;
    const { data } = await toggleBlogPublished(id);
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, published: data.published } : item,
      ),
    );
  };

  if (loading) return <p className="text-white/70">Loading blogs...</p>;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog List</h1>
          <p className="text-sm text-white/65">
            Manage posts with a modern list view layout.
          </p>
        </div>
        <Link
          to="/blogs/new"
          onClick={(event) => {
            if (!guard("add_data", "You don't have permission to add data.")) {
              event.preventDefault();
            }
          }}
          className="rounded-xl bg-[#0E70C4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1]"
        >
          + Add New Blog
        </Link>
      </header>

      <div className="blog-list-filters rounded-2xl border border-white/10 bg-[#0F2350] p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search blogs by title, excerpt, author..."
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#5f8fff]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Sort
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_az">Title A-Z</option>
              <option value="title_za">Title Z-A</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-10 text-center text-sm text-white/60">
              No blog entries found with current filters.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F2350]"
              >
                <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                  <img
                    src={coverSrc(item.coverImage)}
                    alt={item.coverAlt || item.title}
                    className="h-56 w-full object-cover lg:h-full"
                  />
                  <div className="p-4 sm:p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                        {item.category || "General"}
                      </span>
                      <span className="text-xs text-white/55">
                        {formatBlogDate(item.createdAt)}
                      </span>
                      <span className="text-xs text-white/35">|</span>
                      <span className="text-xs text-white/55">
                        {item.author || "Admin"}
                      </span>
                      <span className="text-xs text-white/35">|</span>
                      <span className="text-xs text-white/55">
                        {item.readTime || "5 min read"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/65 line-clamp-3">
                      {item.excerpt || "No excerpt available for this post."}
                    </p>

                    {(Array.isArray(item.tags) ? item.tags : []).length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(item.tags || []).slice(0, 4).map((tag) => (
                          <span
                            key={`${item._id}-${tag}`}
                            className="rounded-md border border-white/15 px-2 py-0.5 text-[11px] text-white/70"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item._id)}
                        className={
                          item.published
                            ? "rounded-lg border border-green-400/35 bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/25"
                            : "rounded-lg border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                        }
                      >
                        {item.published ? "Published" : "Draft"}
                      </button>

                      <Link
                        to={`/blogs/edit/${item._id}`}
                        onClick={(event) => {
                          if (
                            !guard(
                              "edit_data",
                              "You don't have permission to edit data.",
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                        className="rounded-lg border border-blue-400/35 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/25"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0F2350] px-4 py-3 text-sm">
            <p className="text-white/65">
              Showing {filteredItems.length === 0 ? 0 : 1} to{" "}
              {filteredItems.length} of {items.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/45"
              >
                Previous
              </button>
              <span className="rounded-lg border border-blue-400/30 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200">
                1
              </span>
              <button
                type="button"
                disabled
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/45"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/65">
              Categories
            </h3>
            <div className="mt-3 space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-white/50">No categories yet.</p>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setCategoryFilter(category.name)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-white/50">
                      {category.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/65">
              Archive
            </h3>
            <ul className="mt-3 space-y-2">
              {archives.length === 0 ? (
                <li className="text-sm text-white/50">No archive entries.</li>
              ) : (
                archives.map((archive) => (
                  <li
                    key={archive.label}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75"
                  >
                    <span>{archive.label}</span>
                    <span className="text-xs text-white/50">
                      {archive.count}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/65">
              Popular Posts
            </h3>
            <ul className="mt-3 space-y-3">
              {popularPosts.length === 0 ? (
                <li className="text-sm text-white/50">No posts available.</li>
              ) : (
                popularPosts.map((post) => (
                  <li key={post._id}>
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {post.title}
                    </p>
                    <p className="text-xs text-white/50">
                      {formatBlogDate(post.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/65">
              Tags
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tagCloud.length === 0 ? (
                <p className="text-sm text-white/50">No tags yet.</p>
              ) : (
                tagCloud.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearch(tag)}
                    className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/75 hover:bg-white/10"
                  >
                    #{tag}
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
