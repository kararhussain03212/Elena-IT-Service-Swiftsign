import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminCareerPrograms, deleteCareerProgram } from "../../api/careerApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function CareerProgramList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { guard } = usePermissionGuard();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminCareerPrograms();
      const list = data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;
    if (!window.confirm("Delete this program and all its modules?")) return;
    try {
      await deleteCareerProgram(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete program.");
    }
  };

  if (loading) return <p className="text-white/70">Loading career programs...</p>;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Career Programs</h1>
          <p className="text-sm text-white/65">
            Manage career/internship programs and their modules shown on the Careers page.
          </p>
        </div>
        <Link
          to="/career-programs/new"
          onClick={(event) => {
            if (!guard("add_data", "You don't have permission to add data.")) {
              event.preventDefault();
            }
          }}
          className="rounded-xl bg-[#3c72fc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1]"
        >
          + Add Program
        </Link>
      </header>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-10 text-center text-sm text-white/60">
            No career programs yet.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <span
                      className={
                        item.isActive
                          ? "rounded-full border border-green-400/35 bg-green-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-green-200"
                          : "rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white/50"
                      }
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60">{item.description}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {(item.modules || []).length} module{(item.modules || []).length === 1 ? "" : "s"} &middot; Duration: {item.duration || "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/career-programs/edit/${item.id}`}
                    onClick={(event) => {
                      if (!guard("edit_data", "You don't have permission to edit data.")) {
                        event.preventDefault();
                      }
                    }}
                    className="rounded-lg border border-blue-400/35 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/25"
                  >
                    Manage
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
