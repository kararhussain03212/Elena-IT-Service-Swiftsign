import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { createProject, getProject, updateProject } from "../../api/projectApi";

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    status: "Live",
    tech: "",
    year: "",
    duration: "",
    client: "",
    location: "",
    url: "",
    overview: "",
    challenge: "",
    order: 0,
    isActive: true,
    coverImageFile: null,
    coverImagePreview: "",
    coverAlt: "",
  });

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const toImageUrl = useCallback(
    (value) => {
      if (!value) return "";
      if (value.startsWith("http")) return value;
      if (value.startsWith("/uploads/")) return apiRoot + value;
      return apiRoot + "/uploads/" + value;
    },
    [apiRoot],
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  useEffect(() => {
    if (!isEditMode) return;

    const load = async () => {
      try {
        const res = await getProject(id);
        const item = res.data;

        setForm({
          title: item.title || "",
          slug: item.slug || "",
          category: item.category || "",
          status: item.status || "Live",
          tech: item.tech || "",
          year: item.year || "",
          duration: item.duration || "",
          client: item.client || "",
          location: item.location || "",
          url: item.url || "",
          overview: item.overview || "",
          challenge: item.challenge || "",
          order: Number(item.order || 0),
          isActive: Boolean(item.isActive ?? true),
          coverImageFile: null,
          coverImagePreview: toImageUrl(item.coverImage || ""),
          coverAlt: item.coverAlt || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load project.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEditMode, toImageUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("slug", form.slug.trim());
      payload.append("category", form.category.trim());
      payload.append("status", form.status.trim());
      payload.append("tech", form.tech.trim());
      payload.append("year", form.year.trim());
      payload.append("duration", form.duration.trim());
      payload.append("client", form.client.trim());
      payload.append("location", form.location.trim());
      payload.append("url", form.url.trim());
      payload.append("overview", form.overview.trim());
      payload.append("challenge", form.challenge.trim());
      payload.append("coverAlt", form.coverAlt.trim());
      payload.append("order", String(form.order || 0));
      payload.append("isActive", String(form.isActive));

      if (form.coverImageFile)
        payload.append("coverImage", form.coverImageFile);

      if (isEditMode) await updateProject(id, payload);
      else await createProject(payload);

      navigate("/projects");
    } catch (err) {
      console.error(err);
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/70">Loading project...</div>;

  return (
    <section className="admin-modern-page mx-auto max-w-5xl">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h2 className="admin-modern-hero-title">
              {isEditMode ? "Edit Project" : "Add Project"}
            </h2>
            <p className="admin-modern-hero-subtitle">
              Build polished project entries with consistent metadata.
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="admin-modern-form admin-modern-panel"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">Title</label>
            <input
              value={form.title}
              onChange={(e) => {
                const value = e.target.value;
                setField("title", value);
                if (!isEditMode) setField("slug", slugify(value));
              }}
              required
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-white/80">Category</label>
            <input
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Status</label>
            <input
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Tech</label>
            <input
              value={form.tech}
              onChange={(e) => setField("tech", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-white/80">Year</label>
            <input
              value={form.year}
              onChange={(e) => setField("year", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Duration</label>
            <input
              value={form.duration}
              onChange={(e) => setField("duration", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Client</label>
            <input
              value={form.client}
              onChange={(e) => setField("client", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">Location</label>
            <input
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Website URL</label>
            <input
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Overview</label>
          <textarea
            rows={4}
            value={form.overview}
            onChange={(e) => setField("overview", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Challenge</label>
          <textarea
            rows={4}
            value={form.challenge}
            onChange={(e) => setField("challenge", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <ImageUpload
          value={form.coverImagePreview}
          onFileSelect={(file) => setField("coverImageFile", file)}
          label="Upload Cover Image"
          helperText="Main image used in project cards and detail header"
        />
        <div>
          <label className="mb-1 block text-sm text-white/80">Cover Image Alt Text</label>
          <input
            value={form.coverAlt}
            onChange={(e) => setField("coverAlt", e.target.value)}
            placeholder="Describe the project cover image for SEO"
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setField("order", Number(e.target.value))}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>

          <label className="flex items-center gap-2 self-end text-sm text-white/85">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4"
            />
            Show this project on frontend
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="admin-modern-btn-primary px-5 py-2 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEditMode ? "Update" : "Create"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="admin-modern-btn-secondary px-5 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
