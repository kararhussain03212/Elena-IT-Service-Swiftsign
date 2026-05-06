import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteTeamMember,
  getTeamMembers,
  toggleTeamMemberActive,
} from "../../api/teamApi";
import usePermissionGuard from "../../hooks/usePermissionGuard";

const FALLBACK_IMAGE = "https://placehold.co/600x800/151327/ffffff?text=Team";

export default function TeamList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { guard } = usePermissionGuard();

  // CHANGE: normalize API root once
  // WHY: backend URL may include /api suffix in env config
  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (image) => {
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads/")) return apiRoot + image;
    return apiRoot + "/uploads/" + image;
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getTeamMembers();
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Team list fetch failed:", err);
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (memberId, memberName) => {
    if (!guard("delete_data", "You don't have permission to delete data.")) return;

    const confirmed = window.confirm(`Delete ${memberName}?`);
    if (!confirmed) return;

    try {
      await deleteTeamMember(memberId);
      setMembers((prev) => prev.filter((item) => item._id !== memberId));
    } catch (err) {
      console.error("Team delete failed:", err);
      alert("Delete failed.");
    }
  };

  const handleToggleActive = async (memberId) => {
    if (!guard("publish_data", "You don't have permission to publish/activate data.")) return;

    try {
      const { data } = await toggleTeamMemberActive(memberId);
      setMembers((prev) =>
        prev.map((item) =>
          item._id === memberId ? { ...item, isActive: data.isActive } : item,
        ),
      );
    } catch (err) {
      console.error("Team toggle active failed:", err);
      alert("Failed to toggle active state.");
    }
  };

  if (loading) {
    return <div className="text-white/70">Loading team members...</div>;
  }

  return (
    <section className="admin-modern-page">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="admin-modern-hero-title">Team Management</h2>
            <p className="admin-modern-hero-subtitle">
              Create, edit, and delete team members.
            </p>
          </div>

          <Link
            to="/team/new"
            onClick={(event) => {
              if (
                !guard("add_data", "You don't have permission to add data.")
              ) {
                event.preventDefault();
              }
            }}
            className="admin-modern-btn-primary px-4 py-2 text-sm self-start sm:self-auto"
          >
            + Add Member
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      {members.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0f0d1d] p-6 text-white/70">
          No team members found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {members.map((member) => (
            <article
              key={member._id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151327] shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            >
              <div className="h-72 sm:h-80 md:h-96 lg:h-104 xl:h-112 w-full overflow-hidden">
                <img
                  src={resolveImage(member.image)}
                  alt={member.imageAlt || member.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(90deg,rgb(60,114,252)_-10.59%,rgb(0,6,12)_300.59%)] p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold leading-tight text-white truncate">
                    {member.name}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-white/90 line-clamp-2">
                    {member.role || "Team Member"}
                  </p>
                  </div>

                  <div className="flex flex-nowrap items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(member._id)}
                      className={
                        member.isActive
                          ? "admin-modern-btn-active text-xs px-2.5 py-1 whitespace-nowrap"
                          : "admin-modern-btn-inactive text-xs px-2.5 py-1 whitespace-nowrap"
                      }
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </button>
                    <Link
                      to={`/team/edit/${member._id}`}
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
                      className="admin-modern-btn-edit text-xs px-2.5 py-1 whitespace-nowrap"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(member._id, member.name)}
                      className="admin-modern-btn-danger text-xs px-2.5 py-1 whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
