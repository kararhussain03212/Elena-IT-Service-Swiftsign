import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProject,
  getProjects,
  toggleProjectActive,
} from "../../api/projectApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/800x500/0B1B3A/ffffff?text=Project";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProjects();
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;
    if (!window.confirm("Delete this project?")) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((item) => item._id !== id));
  };

  const handleToggleActive = async (id) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;
    const { data } = await toggleProjectActive(id);
    setProjects((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, isActive: data.isActive } : item,
      ),
    );
  };

  if (loading) return <p className="text-white/70">Loading projects...</p>;

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">Projects</h1>
            <p className="admin-modern-hero-subtitle">
              Manage dynamic project content.
            </p>
          </div>
          <Link
            to="/projects/new"
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
        {projects.map((project) => (
          <article key={project._id} className="admin-modern-card">
            <div className="grid md:grid-cols-[220px_1fr]">
              <img
                src={resolveImage(project.coverImage)}
                alt={project.coverAlt || project.title}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-white">
                  {project.title}
                </h3>
                <p className="mt-2 text-white/70">
                  {project.category || "No category"}
                </p>
                <p className="mt-1 text-white/60 line-clamp-2">
                  {project.overview || project.description || "No overview"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleActive(project._id)}
                    className={
                      project.isActive
                        ? "admin-modern-btn-active"
                        : "admin-modern-btn-inactive"
                    }
                  >
                    {project.isActive ? "Active" : "Inactive"}
                  </button>

                  <Link
                    to={"/projects/edit/" + project._id}
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
                    onClick={() => handleDelete(project._id)}
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
