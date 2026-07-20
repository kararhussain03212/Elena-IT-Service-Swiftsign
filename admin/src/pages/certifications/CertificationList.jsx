import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCertifications, deleteCertification } from "../../api/certificationApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

export default function CertificationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { guard } = usePermissionGuard();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const imageSrc = (value) => {
    if (!value) return "https://placehold.co/600x800/151327/ffffff?text=SSCC";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    if (/^uploads\//i.test(value)) return apiRoot + "/" + value;
    return apiRoot + "/uploads/" + value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCertifications();
        // Since PHP returns {status: 200, data: [...]}, we extract data
        const list = data?.data || data || [];
        setItems(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const status = item.isOpen ? "open" : "soon";

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;

      return [item.code, item.title, item.fullName, item.tagline]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(query));
    });
  }, [items, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;
    if (!window.confirm("Are you sure you want to delete this certification?")) return;
    try {
      await deleteCertification(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete certification.");
    }
  };

  if (loading) return <p className="text-white/70">Loading certifications...</p>;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Certifications List</h1>
          <p className="text-sm text-white/65">
            Manage your SSCC program certification levels and detail pages.
          </p>
        </div>
        <Link
          to="/certifications/new"
          onClick={(event) => {
            if (!guard("add_data", "You don't have permission to add data.")) {
              event.preventDefault();
            }
          }}
          className="rounded-xl bg-[#3c72fc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1]"
        >
          + Add Certification
        </Link>
      </header>

      <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code, title, description..."
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#5f8fff]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Admissions Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="all">All</option>
              <option value="open">🟢 Admissions Open</option>
              <option value="soon">⚪ Coming Soon</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-10 text-center text-sm text-white/60">
            No certifications found with current search filters.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d1d] flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[3/4] w-full overflow-hidden relative bg-white/2">
                    <img
                      src={imageSrc(item.image)}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        item.isOpen
                          ? "bg-green-500/15 border border-green-400/35 text-green-300"
                          : "bg-white/10 border border-white/15 text-white/50"
                      }`}
                    >
                      {item.isOpen ? "Open" : "Soon"}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#3c72fc] tracking-wider uppercase">
                        {item.code}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/65 line-clamp-2">
                      {item.tagline || "No description tagline provided."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  <Link
                    to={`/certifications/edit/${item.id}`}
                    onClick={(event) => {
                      if (!guard("edit_data", "You don't have permission to edit data.")) {
                        event.preventDefault();
                      }
                    }}
                    className="flex-1 text-center rounded-lg border border-blue-400/35 bg-blue-500/15 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/25"
                  >
                    Edit Details
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
