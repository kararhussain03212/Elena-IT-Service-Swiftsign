import { ROLE_OPTIONS, STATUS_OPTIONS } from "../constants";

export default function UserFilters({
  searchValue,
  onSearchChange,
  role,
  status,
  onRoleChange,
  onStatusChange,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Search
          </span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Role
          </span>
          <select
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-sm text-white focus:border-[#3c72fc] focus:outline-none"
          >
            {ROLE_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-sm text-white focus:border-[#3c72fc] focus:outline-none"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

      </div>
    </div>
  );
}
