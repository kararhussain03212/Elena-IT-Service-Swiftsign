import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createTestimonial,
  getTestimonial,
  updateTestimonial,
} from "../../api/testimonialApi";
import { convertImageFileToWebp } from "../../utils/webpUpload";

export default function TestimonialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    role: "",
    company: "",
    message: "",
    avatarAlt: "",
    rating: 5,
    order: 0,
    isActive: true,
    avatar: null,
  });
  const [loading, setLoading] = useState(isEdit);
  const [preview, setPreview] = useState("");

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const { data } = await getTestimonial(id);
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          slug: data.slug || "",
          role: data.role || "",
          company: data.company || "",
          message: data.message || "",
          avatarAlt: data.avatarAlt || "",
          rating: data.rating ?? 5,
          order: data.order ?? 0,
          isActive: data.isActive ?? true,
          avatar: null,
        }));

        if (data.avatar) {
          if (data.avatar.startsWith("http")) setPreview(data.avatar);
          else if (data.avatar.startsWith("/uploads/"))
            setPreview(apiRoot + data.avatar);
          else setPreview(apiRoot + "/uploads/" + data.avatar);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, apiRoot]);

  const onChange = async (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === "file") {
      const file = files?.[0] || null;
      if (!file) {
        setForm((prev) => ({ ...prev, avatar: null }));
        return;
      }
      let nextFile = file;
      try {
        nextFile = (await convertImageFileToWebp(file)) || file;
      } catch (error) {
        console.error("Avatar conversion failed; using original file.", error);
      }
      setForm((prev) => ({ ...prev, avatar: nextFile }));
      setPreview(URL.createObjectURL(nextFile));
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !isEdit && !prev.slug) {
        next.slug = String(value || "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }
      if (name === "name" && !prev.avatarAlt) {
        next.avatarAlt = value;
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const fallbackSlug = String(form.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const finalSlug = String(form.slug || "").trim() || fallbackSlug;

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("slug", finalSlug);
    payload.append("role", form.role);
    payload.append("company", form.company);
    payload.append("message", form.message);
    payload.append("avatarAlt", form.avatarAlt);
    payload.append("rating", String(form.rating));
    payload.append("order", String(form.order));
    payload.append("isActive", String(form.isActive));
    if (form.avatar) payload.append("avatar", form.avatar);

    if (isEdit) await updateTestimonial(id, payload);
    else await createTestimonial(payload);

    navigate("/testimonials");
  };

  if (loading) return <p className="text-white/70">Loading testimonial...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">
              {isEdit ? "Edit Testimonial" : "Add Testimonial"}
            </h1>
            <p className="admin-modern-hero-subtitle">
              Capture authentic client feedback with polished card-ready
              content.
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        className="admin-modern-form admin-modern-panel"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-white/70">Name</span>
            <input
              required
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Role</span>
            <input
              name="role"
              value={form.role}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Slug</span>
            <input
              required
              name="slug"
              value={form.slug}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Company</span>
            <input
              name="company"
              value={form.company}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Avatar</span>
            <input
              type="file"
              accept="image/*"
              name="avatar"
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none file:mr-4 file:rounded-md file:border-0 file:bg-[#3c72fc] file:px-3 file:py-1 file:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Avatar Alt Text</span>
            <input
              name="avatarAlt"
              value={form.avatarAlt}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
              placeholder="Describe the avatar image"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Rating</span>
            <input
              type="number"
              min="1"
              max="5"
              name="rating"
              value={form.rating}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/70">Order</span>
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={onChange}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">Message</span>
          <textarea
            required
            rows="5"
            name="message"
            value={form.message}
            onChange={onChange}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-white/75">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
          />
          Active
        </label>

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-xl object-cover"
          />
        ) : null}

        <button
          type="submit"
          className="admin-modern-btn-primary justify-self-start w-auto px-3 py-1.5 text-xs font-medium"
        >
          {isEdit ? "Update" : "Create"}
        </button>
      </form>
    </section>
  );
}
