import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteTestimonial,
  getTestimonials,
  toggleTestimonialActive,
} from "../../api/testimonialApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function TestimonialList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value) return "https://placehold.co/300x300/151327/ffffff?text=User";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTestimonials();
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
    if (!window.confirm("Delete this testimonial?")) return;
    await deleteTestimonial(id);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleToggleActive = async (id) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;
    const { data } = await toggleTestimonialActive(id);
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isActive: data.isActive } : item,
      ),
    );
  };

  if (loading) return <p className="text-white/70">Loading testimonials...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">Testimonials</h1>
            <p className="admin-modern-hero-subtitle">
              Manage dynamic testimonials.
            </p>
          </div>
          <Link
            to="/testimonials/new"
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
        {items.map((item) => (
          <article key={item._id} className="admin-modern-card">
            <div className="grid md:grid-cols-[130px_1fr]">
              <img
                src={resolveImage(item.avatar)}
                alt={item.name}
                className="h-32 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                <p className="mt-1 text-white/70">{item.role || "No role"}</p>
                <p className="mt-2 text-white/60 line-clamp-2">
                  {item.message}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleActive(item._id)}
                    className={
                      item.isActive
                        ? "admin-modern-btn-active"
                        : "admin-modern-btn-inactive"
                    }
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>

                  <Link
                    to={"/testimonials/edit/" + item._id}
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
                    onClick={() => handleDelete(item._id)}
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
