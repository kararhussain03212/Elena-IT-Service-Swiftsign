import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteSubService,
  getSubServices,
  toggleSubServiceActive,
} from "../../api/subServiceApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function SubServiceList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveIcon = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return apiRoot + raw;
    if (/\.(png|jpe?g|svg|webp|gif)$/i.test(raw)) {
      return apiRoot + "/uploads/" + raw.replace(/^\/?uploads\//i, "");
    }
    return "";
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSubServices();
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;
    if (!window.confirm("Delete this sub service?")) return;
    await deleteSubService(id);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleToggleActive = async (id) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;
    const { data } = await toggleSubServiceActive(id);
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isActive: data.isActive } : item,
      ),
    );
  };

  if (loading) return <p className="text-white/70">Loading sub services...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">Sub Services</h1>
            <p className="admin-modern-hero-subtitle">
              Manage About section service cards.
            </p>
          </div>
          <Link
            to="/sub-services/new"
            onClick={(event) => {
              if (!guard("add_data", "You don't have permission to add data.")) {
                event.preventDefault();
              }
            }}
            className="admin-modern-btn-primary px-4 py-2 text-sm"
          >
            + Add New
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const iconUrl = resolveIcon(item.icon);
          return (
            <article key={item._id} className="admin-modern-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3c72fc]/20 text-[#9bb8ff]">
                  {iconUrl ? (
                    <img src={iconUrl} alt={item.iconAlt || item.title + " icon"} className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="text-xs font-bold">
                      {String(item.title || "S").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              </div>

              <p className="text-sm leading-6 text-white/70">{item.description || "No description."}</p>
              <p className="mt-2 text-xs text-white/45">Order: {Number(item.order || 0)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleToggleActive(item._id)}
                  className={item.isActive ? "admin-modern-btn-active" : "admin-modern-btn-inactive"}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>

                <Link
                  to={"/sub-services/edit/" + item._id}
                  onClick={(event) => {
                    if (!guard("edit_data", "You don't have permission to edit data.")) {
                      event.preventDefault();
                    }
                  }}
                  className="admin-modern-btn-edit"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="admin-modern-btn-danger"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
