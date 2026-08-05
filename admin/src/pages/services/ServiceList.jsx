import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteService,
  getServices,
  toggleServiceActive,
} from "../../api/serviceApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/800x500/0B1B3A/ffffff?text=Service";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServices();
        setServices(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;
    if (!window.confirm("Delete this service?")) return;
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s._id !== id));
  };

  const handleToggleActive = async (id) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;
    const { data } = await toggleServiceActive(id);
    setServices((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isActive: data.isActive } : item,
      ),
    );
  };

  if (loading) return <p className="text-white/70">Loading services...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">Services</h1>
            <p className="admin-modern-hero-subtitle">
              Manage dynamic services content.
            </p>
          </div>
          <Link
            to="/services/new"
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
        {services.map((service) => (
          <article key={service._id} className="admin-modern-card">
            <div className="grid md:grid-cols-[220px_1fr]">
              <img
                src={resolveImage(service.image)}
                alt={service.imageAlt || service.title}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-white">
                  {service.title}
                </h3>
                <p className="mt-2 text-white/70">{service.shortDescription}</p>
                <p className="mt-1 text-white/60 line-clamp-2">
                  {service.description2 ||
                    service.description1 ||
                    service.description}
                </p>

                {service.image1 || service.detailImage ? (
                  <div className="mt-3">
                    <span className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                      Image 1 Preview
                    </span>
                    <img
                      src={resolveImage(service.image1 || service.detailImage)}
                      alt={service.image1Alt || service.detailImageAlt || (service.title + " image 1")}
                      className="h-16 w-24 rounded object-cover border border-white/10"
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleActive(service._id)}
                    className={
                      service.isActive
                        ? "admin-modern-btn-active"
                        : "admin-modern-btn-inactive"
                    }
                  >
                    {service.isActive ? "Active" : "Inactive"}
                  </button>

                  <Link
                    to={"/services/edit/" + service._id}
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
                    className="admin-modern-btn-edit"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(service._id)}
                    className="admin-modern-btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
