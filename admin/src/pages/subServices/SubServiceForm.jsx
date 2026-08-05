import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSubService, getSubService, updateSubService } from "../../api/subServiceApi";
import { convertImageFileToWebp } from "../../utils/webpUpload";

export default function SubServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    icon: "",
    iconAlt: "",
    iconFile: null,
    order: 0,
    isActive: true,
  });
  const [iconFilePreview, setIconFilePreview] = useState("");

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveIconPreview = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return apiRoot + raw;
    if (/\.(png|jpe?g|svg|webp|gif)$/i.test(raw)) {
      return apiRoot + "/uploads/" + raw.replace(/^\/?uploads\//i, "");
    }
    return "";
  };

  const toSlug = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !isEditMode && !prev.slug) {
        next.slug = toSlug(value);
      }
      if (key === "title" && !prev.iconAlt) {
        next.iconAlt = value;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isEditMode) return;

    const load = async () => {
      try {
        const res = await getSubService(id);
        const item = res.data;
        setForm({
          title: item.title || "",
          slug: item.slug || "",
          description: item.description || "",
          icon: item.icon || "",
          iconAlt: item.iconAlt || "",
          iconFile: null,
          order: Number(item.order || 0),
          isActive: Boolean(item.isActive ?? true),
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load sub service.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEditMode]);

  useEffect(() => {
    return () => {
      if (iconFilePreview) URL.revokeObjectURL(iconFilePreview);
    };
  }, [iconFilePreview]);

  const handleIconFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    let nextFile = file;
    if (file) {
      try {
        nextFile = (await convertImageFileToWebp(file)) || file;
      } catch (error) {
        console.error("Icon conversion failed; using original file.", error);
      }
    }
    setField("iconFile", nextFile);

    if (iconFilePreview) URL.revokeObjectURL(iconFilePreview);
    setIconFilePreview(nextFile ? URL.createObjectURL(nextFile) : "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSaving(true);

      const normalized = {
        title: String(form.title || "").trim(),
        slug: String(form.slug || "").trim(),
        description: String(form.description || "").trim(),
        icon: String(form.icon || "").trim(),
        iconAlt: String(form.iconAlt || "").trim(),
        order: Number(form.order) || 0,
        isActive: Boolean(form.isActive),
      };

      const payload = form.iconFile
        ? (() => {
            const formData = new FormData();
            formData.append("title", normalized.title);
            formData.append("slug", normalized.slug);
            formData.append("description", normalized.description);
            formData.append("icon", normalized.icon);
            formData.append("iconAlt", normalized.iconAlt);
            formData.append("order", String(normalized.order));
            formData.append("isActive", String(normalized.isActive));
            formData.append("iconFile", form.iconFile);
            return formData;
          })()
        : normalized;

      if (isEditMode) await updateSubService(id, payload);
      else await createSubService(payload);

      navigate("/sub-services");
    } catch (err) {
      console.error(err);
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/70">Loading sub service...</div>;

  return (
    <section className="admin-modern-page mx-auto max-w-3xl">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h2 className="admin-modern-hero-title">
              {isEditMode ? "Edit Sub Service" : "Add Sub Service"}
            </h2>
            <p className="admin-modern-hero-subtitle">
              Configure About section service card content.
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="admin-modern-form admin-modern-panel">
        <div>
          <label className="mb-1 block text-sm text-white/80">Title</label>
          <input
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            required
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Slug</label>
          <input
            value={form.slug}
            onChange={(event) => setField("slug", event.target.value)}
            required
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Icon URL / Path</label>
          <input
            value={form.icon}
            onChange={(event) => setField("icon", event.target.value)}
            placeholder="https://... or uploads/icon.png"
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Icon Alt Text</label>
          <input
            value={form.iconAlt}
            onChange={(event) => setField("iconAlt", event.target.value)}
            placeholder="Describe the icon image"
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Upload Icon File</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleIconFileChange}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#0E70C4] file:px-3 file:py-2 file:text-white"
          />
          <p className="mt-1 text-xs text-white/50">If selected, uploaded file will override Icon URL/Path.</p>
          {iconFilePreview || resolveIconPreview(form.icon) ? (
            <img
              src={iconFilePreview || resolveIconPreview(form.icon)}
              alt="Icon preview"
              className="mt-3 h-12 w-12 rounded object-contain border border-white/20 bg-[#0F2350]"
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(event) => setField("order", Number(event.target.value))}
              className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            />
          </div>

          <label className="flex items-center gap-2 self-end text-sm text-white/85">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setField("isActive", event.target.checked)}
              className="h-4 w-4"
            />
            Show this sub service on frontend
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
            onClick={() => navigate("/sub-services")}
            className="admin-modern-btn-secondary px-5 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
