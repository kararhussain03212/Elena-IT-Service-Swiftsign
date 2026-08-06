import { useCallback, useEffect, useState } from "react";
import { getNewsletterSubscribers, exportNewsletterSubscribersCsv } from "../../api/newsletterSubscriberApi";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function NewsletterSubscriberList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNewsletterSubscribers({ page, limit: 20 });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setPages(data?.pages || 1);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportNewsletterSubscribersCsv();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "newsletter-subscribers.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export subscribers.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Newsletter Subscribers</h1>
          <p className="text-sm text-white/65">{total} subscriber{total === 1 ? "" : "s"} collected across the site.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-xl bg-[#0E70C4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:opacity-60"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </header>

      {loading ? (
        <p className="text-white/70">Loading subscribers...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-10 text-center text-sm text-white/60">
          No subscribers yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F2350]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Source Page</th>
                <th className="px-4 py-3">Subscribed At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white">{item.email}</td>
                  <td className="px-4 py-3 text-white/60">{item.source_page || item.sourcePage || "-"}</td>
                  <td className="px-4 py-3 text-white/60">{formatDateTime(item.subscribed_at || item.subscribedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
