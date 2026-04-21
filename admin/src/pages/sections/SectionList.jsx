import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteSection,
  getSections,
  toggleSectionActive,
} from "../../api/sectionApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

const summarizeContent = (content) => {
  try {
    const json = JSON.stringify(content);
    if (json.length <= 180) return json;
    return `${json.slice(0, 180)}...`;
  } catch {
    return "{ }";
  }
};

export default function SectionList() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { guard } = usePermissionGuard();

  const grouped = useMemo(() => {
    const groups = sections.reduce((accumulator, item) => {
      const page = item?.page || "unknown";
      if (!accumulator[page]) accumulator[page] = [];
      accumulator[page].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups)
      .sort(([leftPage], [rightPage]) => leftPage.localeCompare(rightPage))
      .map(([page, items]) => [
        page,
        [...items].sort((left, right) =>
          String(left?.key || "").localeCompare(String(right?.key || "")),
        ),
      ]);
  }, [sections]);

  const loadSections = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getSections();
      setSections(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error(requestError);
      setSections([]);
      setError("Failed to load sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) {
      return;
    }

    if (!window.confirm("Delete this section content?")) return;

    try {
      await deleteSection(id);
      setSections((previous) => previous.filter((item) => item._id !== id));
    } catch (requestError) {
      console.error(requestError);
      setError("Delete failed.");
    }
  };

  const handleToggleActive = async (id) => {
    if (
      !guard(
        "publish_data",
        "You don't have permission to publish/activate data.",
      )
    ) {
      return;
    }

    try {
      const { data } = await toggleSectionActive(id);
      setSections((previous) =>
        previous.map((item) =>
          item._id === id ? { ...item, isActive: data.isActive } : item,
        ),
      );
    } catch (requestError) {
      console.error(requestError);
      setError("Status update failed.");
    }
  };

  if (loading) {
    return <p className="text-white/70">Loading sections...</p>;
  }

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h1 className="admin-modern-hero-title">Sections</h1>
            <p className="admin-modern-hero-subtitle">
              Manage global, home, and contact dynamic section content.
            </p>
          </div>
          <Link
            to="/sections/new"
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

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      {sections.length === 0 ? (
        <div className="admin-modern-panel p-6 text-white/70">
          No section records found.
        </div>
      ) : (
        <div className="grid gap-5">
          {grouped.map(([page, items]) => (
            <section key={page} className="admin-modern-panel p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white capitalize mb-4">
                {page} Page
              </h2>

              <div className="grid gap-4">
                {items.map((item) => (
                  <article key={item._id} className="admin-modern-card p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">
                            Key
                          </p>
                          <h3 className="text-base font-semibold text-white">
                            {item.key}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
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
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
                          Content Preview
                        </p>
                        <p className="text-sm text-white/70 break-all">
                          {summarizeContent(item.content)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/sections/edit/${item._id}`}
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
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
