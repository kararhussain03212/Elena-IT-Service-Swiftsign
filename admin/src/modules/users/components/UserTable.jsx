import StatusBadge from "./StatusBadge";
import {
  formatDateTime,
  getApiRoot,
  getInitialLetter,
  resolveAvatarUrl,
  toTitleCase,
} from "../utils";

const API_ROOT = getApiRoot();

export default function UserTable({
  users,
  loading,
  canEditUsers,
  canDeleteUsers,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d1d]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Role
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Last Login
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-white/5">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="h-4 w-full animate-pulse rounded bg-white/8" />
                  </td>
                </tr>
              ))}

            {!loading && users.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-white/55" colSpan={6}>
                  No users matched your filters. Try adjusting search or status.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((user) => {
                const avatarUrl = resolveAvatarUrl(user.avatar, API_ROOT);

                return (
                  <tr key={user._id} className="border-b border-white/5 text-white/85">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${user.name || "User"} avatar`}
                            className="h-10 w-10 rounded-full border border-white/20 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#2a3d7e] text-sm font-semibold text-white">
                            {getInitialLetter(user.name || user.email)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-xs text-white/45">Joined {formatDateTime(user.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/80">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-medium text-white/90">
                        {toTitleCase(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-4 text-white/75">{formatDateTime(user.lastLogin)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onView(user)}
                          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          disabled={!canEditUsers}
                          className="rounded-lg border border-blue-400/30 bg-blue-500/15 px-2.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          disabled={!canDeleteUsers}
                          className="rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
