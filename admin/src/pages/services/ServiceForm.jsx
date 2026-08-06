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
    benefits: [],
    faqs: [],
    icon: "",
    imageAlt: "",
    image1Alt: "",
    detailImageAlt: "",
    image1: "",
    detailImage: "",
    order: 0,
    isActive: true,
    imageFile: null,
    imagePreview: "",
    image1File: null,
    detailImageFile: null,
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
          benefits: Array.isArray(item.benefits) ? item.benefits : [],
          faqs: Array.isArray(item.faqs) ? item.faqs : [],
          icon: item.icon || "",
          imageAlt: item.imageAlt || "",
          image1Alt: item.image1Alt || "",
          detailImageAlt: item.detailImageAlt || "",
          image1: item.image1 || item.detailImage || "",
          detailImage: item.detailImage || "",
          order: Number(item.order || 0),
          isActive: Boolean(item.isActive ?? true),
          imageFile: null,
          imagePreview: toImageUrl(item.image || ""),
          image1File: null,
          detailImageFile: null,
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
      payload.append("benefits", JSON.stringify(form.benefits || []));
      payload.append("faqs", JSON.stringify(form.faqs || []));
      payload.append("icon", form.icon.trim());
      payload.append("imageAlt", form.imageAlt.trim());
      payload.append("image1Alt", form.image1Alt.trim());
      payload.append("detailImageAlt", form.detailImageAlt.trim());
      if (form.image1File) payload.append("image1", form.image1File);
      else payload.append("image1", form.image1.trim());

      if (form.detailImageFile) payload.append("detailImage", form.detailImageFile);
      else payload.append("detailImage", form.detailImage.trim());
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
              className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
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
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <ImageUpload
          value={form.imagePreview}
          onFileSelect={(file) => setField("imageFile", file)}
          label="Upload Main Service Image"
          helperText="Optional image for cards and detail top section"
        />
        <div>
          <label className="mb-1 block text-sm text-white/80">Main Image Alt Text</label>
          <input
            value={form.imageAlt}
            onChange={(e) => setField("imageAlt", e.target.value)}
            placeholder="Describe the main service image for SEO"
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

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
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
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
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0F2350] p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold text-white">
              Benefits With Our Service
            </h4>
            <button
              type="button"
              onClick={() =>
                setField("benefits", [...(form.benefits || []), ""])
              }
              className="admin-modern-btn-secondary px-3 py-1.5 text-sm"
            >
              Add Benefit
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {(form.benefits || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(e) => {
                    const next = [...(form.benefits || [])];
                    next[idx] = e.target.value;
                    setField("benefits", next);
                  }}
                  placeholder={`Benefit ${idx + 1}`}
                  className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(form.benefits || [])];
                    next.splice(idx, 1);
                    setField("benefits", next);
                  }}
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            ))}
            {(form.benefits || []).length === 0 ? (
              <p className="text-sm text-white/60">
                Add benefits to show on the service detail page.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0F2350] p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold text-white">
              Most Common Questions (FAQ)
            </h4>
            <button
              type="button"
              onClick={() =>
                setField("faqs", [...(form.faqs || []), { question: "", answer: "" }])
              }
              className="admin-modern-btn-secondary px-3 py-1.5 text-sm"
            >
              Add FAQ
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {(form.faqs || []).map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-[#0B1B3A] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white/80">
                    FAQ {idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(form.faqs || [])];
                      next.splice(idx, 1);
                      setField("faqs", next);
                    }}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-white/80">
                      Question
                    </label>
                    <input
                      value={faq?.question || ""}
                      onChange={(e) => {
                        const next = [...(form.faqs || [])];
                        next[idx] = { ...(next[idx] || {}), question: e.target.value };
                        setField("faqs", next);
                      }}
                      className="w-full rounded-lg border border-white/20 bg-[#0F2350] px-3 py-2 text-white"
                      placeholder="Type your question"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/80">
                      Answer
                    </label>
                    <textarea
                      rows={3}
                      value={faq?.answer || ""}
                      onChange={(e) => {
                        const next = [...(form.faqs || [])];
                        next[idx] = { ...(next[idx] || {}), answer: e.target.value };
                        setField("faqs", next);
                      }}
                      className="w-full rounded-lg border border-white/20 bg-[#0F2350] px-3 py-2 text-white"
                      placeholder="Type the answer"
                    />
                  </div>
                </div>
              </div>
            ))}
            {(form.faqs || []).length === 0 ? (
              <p className="text-sm text-white/60">
                Add FAQs to show below the benefits section on the service detail page.
              </p>
            ) : null}
          </div>
        </div>


        <ImageUpload
          value={toImageUrl(form.image1)}
          onFileSelect={(file) => setField("image1File", file)}
          label="Upload Service Detail Image"
          helperText="This is the second image (shown on service details)."
        />
        <div>
          <label className="mb-1 block text-sm text-white/80">Detail Image Alt Text</label>
          <input
            value={form.image1Alt}
            onChange={(e) => setField("image1Alt", e.target.value)}
            placeholder="Describe the detail image for SEO"
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-white/80">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setField("order", Number(e.target.value))}
              className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
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
