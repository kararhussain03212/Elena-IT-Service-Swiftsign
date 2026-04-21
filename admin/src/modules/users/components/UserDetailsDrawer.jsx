import StatusBadge from "./StatusBadge";
import { formatDateTime, getApiRoot, getInitialLetter, resolveAvatarUrl, toTitleCase } from "../utils";

const API_ROOT = getApiRoot();

export default function UserDetailsDrawer({ open, user, onClose }) {
  if (!user) return null;

  const avatarUrl = resolveAvatarUrl(user.avatar, API_ROOT);

  return (
    <div
      className={`fixed inset-0 z-[130] transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#0f0d1d] p-5 shadow-2xl shadow-black/70 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user.name || "User"} avatar`}
                className="h-12 w-12 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#2a3d7e] text-base font-semibold text-white">
                {getInitialLetter(user.name || user.email)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-white">{user.name}</h3>
              <p className="text-sm text-white/55">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 pb-8">
          <section className="rounded-xl border border-white/10 bg-[#151327] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Profile</h4>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Role</dt>
                <dd className="font-medium text-white">{toTitleCase(user.role)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Status</dt>
                <dd>
                  <StatusBadge status={user.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Last Login</dt>
                <dd className="text-right text-white/85">{formatDateTime(user.lastLogin)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Created</dt>
                <dd className="text-right text-white/85">{formatDateTime(user.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#151327] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Contact Details
            </h4>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Designation</dt>
                <dd className="text-right text-white/85">{user.designation || "-"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Phone</dt>
                <dd className="text-right text-white/85">{user.phone || "-"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Location</dt>
                <dd className="text-right text-white/85">{user.location || "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#151327] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Role Permissions
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {(user.permissions || []).length === 0 ? (
                <p className="text-sm text-white/55">No permissions mapped.</p>
              ) : (
                (user.permissions || []).map((permission) => (
                  <span
                    key={permission}
                    className="rounded-md border border-blue-400/30 bg-blue-500/15 px-2 py-1 text-xs font-medium text-blue-200"
                  >
                    {permission}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#151327] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Activity</h4>
            <ul className="mt-3 space-y-2">
              {(user.activity || []).length === 0 ? (
                <li className="text-sm text-white/55">No activity logged yet.</li>
              ) : (
                [...(user.activity || [])]
                  .sort((a, b) => new Date(b.at) - new Date(a.at))
                  .slice(0, 8)
                  .map((entry, index) => (
                    <li key={`${entry.action}-${entry.at}-${index}`} className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-sm font-medium text-white">{toTitleCase(entry.action)}</p>
                      <p className="text-xs text-white/55">{entry.description || "No details provided."}</p>
                      <p className="mt-1 text-[11px] text-white/45">{formatDateTime(entry.at)}</p>
                    </li>
                  ))
              )}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
