import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSlider,
  getSlider,
  updateSlider,
} from "../../api/sliderApi";
import { convertImageFileToWebp } from "../../utils/webpUpload";
import ImageUpload from "../../components/ImageUpload";

export default function SliderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [heading, setHeading] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [buttonText, setButtonText] = useState("Get Started");
  const [buttonLink, setButtonLink] = useState("/services");
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [removingNow, setRemovingNow] = useState(false);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const existingImageUrl = useMemo(() => {
    if (!existingImage) return "";
    if (existingImage.startsWith("http")) return existingImage;
    if (existingImage.startsWith("/uploads/")) return apiRoot + existingImage;
    return apiRoot + "/uploads/" + existingImage;
  }, [existingImage, apiRoot]);

  const resolvePreviewUrl = (file) => (file ? URL.createObjectURL(file) : "");
  const toSlug = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  useEffect(() => {
    if (!isEditing) return;

    const loadSlider = async () => {
      try {
        const { data } = await getSlider(id);
        const slider = Array.isArray(data?.data)
          ? data.data[0]
          : data?.data || data;
        if (!slider) return;

        setHeading(slider.heading || "");
        setTitle(slider.title || "");
        setSlug(slider.slug || "");
        setSlugTouched(true);
        setSubtitle(slider.subtitle || "");
        setImageAlt(slider.imageAlt || "");
        setButtonText(slider.buttonText || "Get Started");
        setButtonLink(slider.buttonLink || "/services");
        setExistingImage(slider.image || "");
      } catch (error) {
        console.error("Failed to load slider", error);
      }
    };

    loadSlider();
  }, [id, isEditing]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSaveShortcut) return;

      event.preventDefault();
      formRef.current?.requestSubmit?.();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const removeMediaRealtime = async (field) => {
    if (!isEditing) return;

    try {
      setRemovingNow(true);

      const formData = new FormData();
      formData.append("heading", heading);
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("buttonText", buttonText);
      formData.append("buttonLink", buttonLink);
      formData.append(`removeImage`, "true");

      await updateSlider(id, formData);

      setExistingImage("");
      setRemoveImage(true);
      setStatus("Image deleted instantly.");
    } catch (error) {
      console.error(`Realtime image delete failed`, error);
      setStatus(`Failed to delete image. Try again.`);
    } finally {
      setRemovingNow(false);
    }
  };

  const handleRemoveImage = async () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (isEditing && existingImage) {
      await removeMediaRealtime("image");
      return;
    }

    setRemoveImage(true);
    setStatus("Selected image removed.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("subtitle", subtitle);
    formData.append("imageAlt", imageAlt);
    formData.append("buttonText", buttonText);
    formData.append("buttonLink", buttonLink);

    if (image) formData.append("image", image);
    if (removeImage) formData.append("removeImage", "true");

    try {
      if (isEditing) await updateSlider(id, formData);
      else await createSlider(formData);

      navigate("/sliders");
    } catch (error) {
      console.error("Save slider failed", error);
      setStatus("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-modern-page mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">
              {isEditing ? "Edit Slider" : "Add New Slider"}
            </h1>
            <p className="admin-modern-hero-subtitle">
              Control homepage hero visuals, captions, and media fallback
              behavior.
            </p>
          </div>
        </div>
      </header>

      {status ? (
        <div className="mb-4 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/85">
          {status}
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="admin-modern-form admin-modern-panel"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Heading
          </label>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            placeholder="ELENA IT SERVICES"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const nextTitle = e.target.value;
              setTitle(nextTitle);
              if (!isEditing && !slugTouched) {
                setSlug(toSlug(nextTitle));
              }
              if (!imageAlt) {
                setImageAlt(nextTitle);
              }
            }}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Button Text
          </label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            placeholder="Get Started"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Button Link
          </label>
          <input
            type="text"
            value={buttonLink}
            onChange={(e) => setButtonLink(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            placeholder="/services"
          />
          <p className="mt-1 text-xs text-white/55">
            Use an internal route like /services or /contact.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Image Alt Text
          </label>
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white"
            placeholder="Describe the slider image"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/90">
            Image (optional)
          </label>
          <ImageUpload
            key={removeImage ? "removed" : "active"}
            value={!removeImage && existingImageUrl ? encodeURI(existingImageUrl) : ""}
            onFileSelect={(file) => {
              setImage(file);
              setStatus("");
              setRemoveImage(false);
            }}
            label="Slider Image"
            helperText="Upload a slider image"
          />
          {(image || (!removeImage && existingImageUrl)) && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={removingNow}
              className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {removingNow ? "Removing..." : "Remove Image"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            type="submit"
            disabled={loading}
            className="admin-modern-btn-primary w-full px-6 py-2.5 disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/sliders")}
            className="admin-modern-btn-secondary w-full px-6 py-2.5 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
