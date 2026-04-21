import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getSliders,
  deleteSlider,
  toggleSliderActive,
} from "../../api/sliderApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

const FALLBACK_IMAGE =
  "https://placehold.co/1200x700/151327/ffffff?text=Slider";

export default function SliderList() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const normalizeSliders = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.sliders)) return payload.sliders;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const resolveImage = (image) => {
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads/")) return apiRoot + image;
    return encodeURI(apiRoot + "/uploads/" + image);
  };

  const resolveVideo = (video) => {
    if (!video) return "";
    if (video.startsWith("http")) return video;
    if (video.startsWith("/uploads/")) return apiRoot + video;
    return encodeURI(apiRoot + "/uploads/" + video);
  };

  const renderMedia = (slider) => {
    const imageSrc = resolveImage(slider.image);
    const videoSrc = resolveVideo(slider.video);

    if (slider.video) {
      return (
        <video
          src={videoSrc}
          poster={slider.image ? imageSrc : undefined}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
      );
    }

    if (slider.image) {
      return (
        <img
          src={imageSrc}
          alt={slider.title || "Slider"}
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <img
        src={FALLBACK_IMAGE}
        alt={slider.title || "Slider"}
        className="h-full w-full object-cover"
      />
    );
  };

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;

    const ok = window.confirm("Delete this slider?");
    if (!ok) return;

    try {
      await deleteSlider(id);
      setSliders((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Delete slider failed", error);
      alert("Delete failed.");
    }
  };

  const handleToggleActive = async (id) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;

    try {
      const { data } = await toggleSliderActive(id);
      setSliders((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isActive: data.isActive } : item,
        ),
      );
    } catch (error) {
      console.error("Toggle slider active failed", error);
      alert("Failed to toggle active state.");
    }
  };

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const { data } = await getSliders();
        setSliders(normalizeSliders(data));
      } catch (error) {
        console.error(error);
        setSliders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, []);

  if (loading) return <p className="text-white/70">Loading...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div className="min-w-0">
            <h1 className="admin-modern-hero-title">Sliders</h1>
            <p className="admin-modern-hero-subtitle">
              Manage hero heading, text, image, video, and CTA visuals.
            </p>
          </div>

          <Link
            to="/sliders/new"
            onClick={(event) => {
              if (
                !guard("add_data", "You don't have permission to add data.")
              ) {
                event.preventDefault();
              }
            }}
            className="admin-modern-btn-primary px-4 py-2 text-sm"
          >
            + Add New
          </Link>
        </div>
      </header>

      <div className="grid gap-4">
        {sliders.map((slider) => (
          <article key={slider._id} className="admin-modern-card">
            {/* CHANGE: mobile-first card stack */}
            {/* WHY: prevents text/button overlap on small screens */}
            <div className="grid md:grid-cols-[260px_1fr]">
              <div className="h-44 w-full sm:h-52 md:h-full">
                {renderMedia(slider)}
              </div>

              <div className="p-4 sm:p-5">
                {/* CHANGE: actions move below text on mobile */}
                {/* WHY: avoids truncation/cut-off seen in screenshot */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#7ea2ff]">
                      {slider.heading || "No Heading"}
                    </p>
                    <h3 className="wrap-break-word text-2xl font-bold leading-tight text-white">
                      {slider.title || "Untitled Slider"}
                    </h3>
                    <p className="mt-2 wrap-break-word text-base leading-relaxed text-white/75">
                      {slider.subtitle || "No subtitle"}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto sm:flex-col md:flex-row">
                    <button
                      onClick={() => handleToggleActive(slider._id)}
                      className={
                        slider.isActive
                          ? "admin-modern-btn-active flex-1 sm:flex-none"
                          : "admin-modern-btn-inactive flex-1 sm:flex-none"
                      }
                    >
                      {slider.isActive ? "Active" : "Inactive"}
                    </button>
                    <Link
                      to={`/sliders/edit/${slider._id}`}
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
                      className="admin-modern-btn-edit flex-1 sm:flex-none"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(slider._id)}
                      className="admin-modern-btn-danger flex-1 sm:flex-none"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
