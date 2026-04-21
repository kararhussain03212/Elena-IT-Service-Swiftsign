export default function PaginationControls({ pagination, onPageChange }) {
  if (!pagination) return null;

  const { page, totalPages, total, hasPrevPage, hasNextPage, limit } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f0d1d] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-white/65">
        Showing <span className="font-semibold text-white">{start}</span> to{" "}
        <span className="font-semibold text-white">{end}</span> of{" "}
        <span className="font-semibold text-white">{total}</span> users
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <span className="text-sm text-white/70">
          Page {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </div>
  );
}
