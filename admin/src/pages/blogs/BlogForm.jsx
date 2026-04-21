import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createBlog, getBlog, updateBlog } from "../../api/blog";
import { Editor as PrimeEditor } from "primereact/editor";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#5f8fff]";

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const extractErrorMessage = (error, fallback = "Unable to save blog.") =>
  error?.response?.data?.message || error?.message || fallback;

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const previewObjectUrlRef = useRef("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    readTime: "",
    category: "",
    tags: "",
    published: true,
    coverImage: null,
  });
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = "";
    }
  };

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const { data } = await getBlog(id);
        setForm((prev) => ({
          ...prev,
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          author: data.author || "",
          readTime: data.readTime || "",
          category: data.category || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          published: Boolean(data.published),
          coverImage: null,
        }));

        if (!data.coverImage) {
          setPreview("");
        } else if (String(data.coverImage).startsWith("http")) {
          setPreview(data.coverImage);
        } else if (String(data.coverImage).startsWith("/uploads/")) {
          setPreview(apiRoot + data.coverImage);
        } else if (/^uploads\//i.test(String(data.coverImage))) {
          setPreview(
            apiRoot + "/" + String(data.coverImage).replace(/^\/+/, ""),
          );
        } else {
          setPreview(apiRoot + "/uploads/" + data.coverImage);
        }
      } catch (error) {
        setFormError(extractErrorMessage(error, "Failed to load blog data."));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, apiRoot]);

  useEffect(
    () => () => {
      clearPreviewObjectUrl();
    },
    [],
  );

  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormError("");
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === "file") {
      setFormError("");
      const file = files?.[0] || null;
      setForm((prev) => ({ ...prev, coverImage: file }));

      clearPreviewObjectUrl();
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        previewObjectUrlRef.current = objectUrl;
        setPreview(objectUrl);
      }

      return;
    }

    setFormError("");
    setForm((prev) => {
      if (name === "title" && !prev.slug) {
        return {
          ...prev,
          title: value,
          slug: toSlug(value),
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const onGenerateSlug = () => {
    setForm((prev) => ({ ...prev, slug: toSlug(prev.title) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.slug.trim()) {
      setFormError("Title and slug are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("slug", form.slug);
      payload.append("excerpt", form.excerpt);
      payload.append("content", form.content);
      payload.append("author", form.author);
      payload.append("readTime", form.readTime);
      payload.append("category", form.category);
      payload.append("tags", form.tags);
      payload.append("published", String(form.published));
      if (form.coverImage) payload.append("coverImage", form.coverImage);

      if (isEdit) await updateBlog(id, payload);
      else await createBlog(payload);

      navigate("/blogs");
    } catch (error) {
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/70">Loading blog...</p>;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-[#5f8fff]/20 bg-linear-to-r from-[#182447] via-[#151832] to-[#100f22] p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-20 left-10 h-48 w-48 rounded-full bg-[#3c72fc]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-[#14b8a6]/20 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEdit ? "Edit Blog" : "Create Blog"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Craft engaging content with a polished publishing workflow.
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              form.published
                ? "border-green-400/35 bg-green-500/15 text-green-300"
                : "border-amber-400/35 bg-amber-500/15 text-amber-300"
            }`}
          >
            {form.published ? "Published" : "Draft"}
          </span>
        </div>
      </header>

      {formError ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {formError}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5">
            <h2 className="text-base font-semibold text-white">
              Post Information
            </h2>
            <p className="mt-1 text-xs text-white/55">
              Add core details for your blog post.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-white/70">Title</span>
                <input
                  required
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Designing for Purpose: A Mindful Approach"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="flex items-center justify-between gap-2 text-sm text-white/70">
                  <span>Slug</span>
                  <button
                    type="button"
                    onClick={onGenerateSlug}
                    className="rounded-md border border-white/20 px-2 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/10"
                  >
                    Generate from Title
                  </button>
                </span>
                <input
                  required
                  name="slug"
                  value={form.slug}
                  onChange={onChange}
                  placeholder="designing-for-purpose-a-mindful-approach"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/70">Author</span>
                <input
                  name="author"
                  value={form.author}
                  onChange={onChange}
                  placeholder="Admin"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/70">Read Time</span>
                <input
                  name="readTime"
                  value={form.readTime}
                  onChange={onChange}
                  placeholder="5 min read"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/70">Category</span>
                <input
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  placeholder="Design"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/70">Tags</span>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={onChange}
                  placeholder="design, ux, strategy"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-white/70">Excerpt</span>
                <textarea
                  rows="4"
                  name="excerpt"
                  value={form.excerpt}
                  onChange={onChange}
                  placeholder="Write a concise summary for list view and social snippets..."
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Content</h2>
              <span className="text-xs text-white/50">
                {String(form.content || "")
                  .replace(/<[^>]*>/g, "")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length || 0}{" "}
                words
              </span>
            </div>

            <PrimeEditor
              className="blog-content-editor"
              value={form.content}
              onTextChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.htmlValue || "" }))
              }
              style={{ minHeight: "360px" }}
            />
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5">
            <h2 className="text-base font-semibold text-white">Cover Image</h2>
            <p className="mt-1 text-xs text-white/55">
              Upload a strong visual to improve engagement on list pages.
            </p>

            <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-center text-sm font-medium text-white/80 hover:border-[#5f8fff]/60 hover:bg-white/10">
              <input
                type="file"
                accept="image/*"
                name="coverImage"
                onChange={onChange}
                className="sr-only"
              />
              Choose Cover Image
            </label>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111124]">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-white/45">
                  No image selected
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5">
            <h2 className="text-base font-semibold text-white">
              Publish Settings
            </h2>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm text-white/75">Publish now</span>
              <input
                type="checkbox"
                name="published"
                checked={form.published}
                onChange={onChange}
                className="h-4 w-4 accent-[#3c72fc]"
              />
            </div>

            <div className="mt-4 grid gap-2 text-xs text-white/55">
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <span>Status</span>
                <span className="font-semibold text-white/85">
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <span>Mode</span>
                <span className="font-semibold text-white/85">
                  {isEdit ? "Edit" : "Create"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link
                to="/blogs"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#3c72fc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : isEdit ? "Update Blog" : "Create Blog"}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
