import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import { createService, getService, updateService } from "../../api/serviceApi";

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    description1: "",
    description2: "",
    icon: "",
    image1: "",
    detailImage: "",
    order: 0,
    isActive: true,
    imageFile: null,
    imagePreview: "",
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
        const res = await getService(id);
        const item = res.data;
        setForm({
          title: item.title || "",
          slug: item.slug || "",
          shortDescription: item.shortDescription || "",
          description: item.description || "",
          description1: item.description1 || "",
          description2: item.description2 || "",
          icon: item.icon || "",
          image1: item.image1 || item.detailImage || "",
          detailImage: item.detailImage || "",
          order: Number(item.order || 0),
          isActive: Boolean(item.isActive ?? true),
          imageFile: null,
          imagePreview: toImageUrl(item.image || ""),
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load service.");
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
      payload.append("shortDescription", form.shortDescription.trim());
      payload.append("description", form.description.trim());
      payload.append("description1", form.description1.trim());
      payload.append("description2", form.description2.trim());
      payload.append("icon", form.icon.trim());
      payload.append("image1", form.image1.trim());
      payload.append("detailImage", form.detailImage.trim());
      payload.append("order", String(form.order || 0));
      payload.append("isActive", String(form.isActive));

      if (form.imageFile) payload.append("image", form.imageFile);

      if (isEditMode) await updateService(id, payload);
      else await createService(payload);

      navigate("/services");
    } catch (err) {
      console.error(err);
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/70">Loading service...</div>;

  return (
    <section className="admin-modern-page mx-auto max-w-4xl">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h2 className="admin-modern-hero-title">
              {isEditMode ? "Edit Service" : "Add Service"}
            </h2>
            <p className="admin-modern-hero-subtitle">
              Create clear service records with main and detail content.
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
        <h3 className="flex text-center justify-center text-2xl font-bold">
          Service Section
        </h3>
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

        <div>
          <label className="mb-1 block text-sm text-white/80">
            Short Description
          </label>
          <textarea
            rows={3}
            value={form.shortDescription}
            onChange={(e) => setField("shortDescription", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <ImageUpload
          value={form.imagePreview}
          onFileSelect={(file) => setField("imageFile", file)}
          label="Upload Main Service Image"
          helperText="Optional image for cards and detail top section"
        />

        <h3 className="flex justify-center text-2xl font-bold pt-2">
          Service Details
        </h3>

        <div>
          <label className="mb-1 block text-sm text-white/80">
            Description 1
          </label>
          <textarea
            rows={5}
            value={form.description1}
            onChange={(e) => setField("description1", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">
            Description 2
          </label>
          <textarea
            rows={3}
            value={form.description2}
            onChange={(e) => setField("description2", e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">
              Icon URL / Path
            </label>
            <input
              value={form.icon}
              onChange={(e) => setField("icon", e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
            />
          </div>
        </div>
        <ImageUpload
          value={form.image1}
          onFileSelect={(file) => setField("imageFile", file)}
          label="Upload faq Service Image"
          helperText="Optional image for cards and detail top section"
        />

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
            Show this service on frontend
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
            onClick={() => navigate("/services")}
            className="admin-modern-btn-secondary px-5 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
