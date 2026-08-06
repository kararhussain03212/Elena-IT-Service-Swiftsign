import { useCallback, useEffect, useState } from "react";
import { getProgramApplications, updateProgramApplicationStatus } from "../../api/programApplicationApi";
import { getAdminCareerPrograms } from "../../api/careerApi";

const STATUS_OPTIONS = ["new", "reviewed", "accepted", "rejected"];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const statusColor = (status) => {
  switch (status) {
    case "accepted":
      return "border-green-400/35 bg-green-500/15 text-green-200";
    case "rejected":
      return "border-red-400/35 bg-red-500/15 text-red-200";
    case "reviewed":
      return "border-blue-400/35 bg-blue-500/15 text-blue-200";
    default:
      return "border-amber-400/35 bg-amber-500/15 text-amber-200";
  }
};

export default function ProgramApplicationList() {
  const [items, setItems] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getAdminCareerPrograms()
      .then(({ data }) => setPrograms(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setPrograms([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (programFilter) params.programId = programFilter;
      const { data } = await getProgramApplications(params);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setPages(data?.pages || 1);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, programFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateProgramApplicationStatus(id, status);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const programTitle = (programId) => {
    const program = programs.find((p) => p.id === programId);
    return program?.title || `Program #${programId}`;
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Program Applications</h1>
        <p className="text-sm text-white/65">
          {total} application{total === 1 ? "" : "s"} received via the Careers page Apply Online form.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Program</span>
            <select
              value={programFilter}
              onChange={(e) => { setPage(1); setProgramFilter(e.target.value); }}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-white/70">Loading applications...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-10 text-center text-sm text-white/60">
          No applications found.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0F2350] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.full_name}</h3>
                  <p className="text-sm text-white/70">{item.email}</p>
                  <p className="text-xs text-white/50">Phone: {item.contact_number}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-2 lg:grid-cols-4">
                <p><span className="text-white/35">Program:</span> {programTitle(item.program_id)}</p>
                <p><span className="text-white/35">Basic IT Knowledge:</span> {item.has_basic_it_knowledge ? "Yes" : "No"}</p>
                <p><span className="text-white/35">Submitted:</span> {formatDateTime(item.created_at)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={item.status === status}
                    onClick={() => handleStatusChange(item.id, status)}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed capitalize"
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-white/60">Page {page} of {pages}</span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
