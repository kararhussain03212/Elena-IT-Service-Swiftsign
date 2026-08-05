import { useEffect, useMemo, useState } from "react";
import { createUser, deleteUser, getUsers, updateUser } from "../../api/userApi";
import { useAuth } from "../../context/useAuth";
import { normalizeUserRole } from "../../modules/users/constants";
import PaginationControls from "../../modules/users/components/PaginationControls";
import DeleteUserDialog from "../../modules/users/components/DeleteUserDialog";
import UserDetailsDrawer from "../../modules/users/components/UserDetailsDrawer";
import UserFilters from "../../modules/users/components/UserFilters";
import UserFormModal from "../../modules/users/components/UserFormModal";
import UserTable from "../../modules/users/components/UserTable";

const DEFAULT_QUERY = {
  search: "",
  role: "",
  status: "",
  page: 1,
  limit: 10, // fixed per request
};

const extractErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function UserManagement() {
  const { user } = useAuth();
  const isAdmin = useMemo(
    () => normalizeUserRole(user?.role) === "admin",
    [user?.role],
  );
  const canViewUsers = isAdmin;
  const canCreateUsers = isAdmin;
  const canEditUsers = isAdmin;
  const canDeleteUsers = isAdmin;

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasPrevPage: false,
    hasNextPage: false,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusedUser, setFocusedUser] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((previous) => ({
        ...previous,
        search: searchInput.trim(),
        page: 1,
      }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    const fetchUsers = async () => {
      if (!canViewUsers) {
        if (!ignore) {
          setUsers([]);
          setLoading(false);
          setError("You do not have permission to view users.");
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getUsers(query);
        if (ignore) return;

        setUsers(response.data?.data || []);
        setPagination(
          response.data?.pagination || {
            page: query.page,
            totalPages: 1,
            total: 0,
            hasPrevPage: false,
            hasNextPage: false,
            limit: query.limit,
          },
        );
      } catch (requestError) {
        if (ignore) return;
        setUsers([]);
        setError(extractErrorMessage(requestError, "Failed to load users."));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [query, refreshCount, canViewUsers]);

  const openCreateModal = () => {
    if (!canCreateUsers) {
      setError("You do not have permission to create users.");
      return;
    }
    setFormMode("create");
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEditModal = (user) => {
    if (!canEditUsers) {
      setError("You do not have permission to edit users.");
      return;
    }
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingUser(null);
  };

  const handleSubmitUser = async (payload) => {
    try {
      if (formMode === "create" && !canCreateUsers) {
        return { success: false, message: "You do not have permission to create users." };
      }

      if (formMode === "edit" && !canEditUsers) {
        return { success: false, message: "You do not have permission to edit users." };
      }

      setSubmittingForm(true);

      if (formMode === "create") {
        await createUser(payload);
        setFlashMessage("User created successfully.");
      } else {
        await updateUser(editingUser?._id, payload);
        setFlashMessage("User updated successfully.");
      }

      closeFormModal();
      setRefreshCount((count) => count + 1);

      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: extractErrorMessage(requestError, "Unable to save user."),
        errors: requestError?.response?.data?.errors || {},
      };
    } finally {
      setSubmittingForm(false);
    }
  };

  const openDeleteDialog = (user) => {
    if (!canDeleteUsers) {
      setError("You do not have permission to delete users.");
      return;
    }
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeletingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser?._id) return;

    try {
      setDeleting(true);
      await deleteUser(deletingUser._id);
      setFlashMessage("User deleted successfully.");
      closeDeleteDialog();
      setRefreshCount((count) => count + 1);
    } catch (requestError) {
      setError(extractErrorMessage(requestError, "Failed to delete user."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-sm text-white/65">
            Manage users, role permissions, account status and activity logs.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!canCreateUsers}
          className="rounded-xl bg-[#0E70C4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add User
        </button>
      </header>

      {flashMessage ? (
        <div className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <UserFilters
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        role={query.role}
        status={query.status}
        onRoleChange={(value) =>
          setQuery((previous) => ({ ...previous, role: value, page: 1 }))
        }
        onStatusChange={(value) =>
          setQuery((previous) => ({ ...previous, status: value, page: 1 }))
        }
      />

      <UserTable
        users={users}
        loading={loading}
        canEditUsers={canEditUsers}
        canDeleteUsers={canDeleteUsers}
        onView={(user) => {
          setFocusedUser(user);
          setDrawerOpen(true);
        }}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
      />

      <PaginationControls
        pagination={pagination}
        onPageChange={(page) =>
          setQuery((previous) => ({ ...previous, page: Math.max(1, page) }))
        }
      />

      <UserFormModal
        key={`${formMode}-${editingUser?._id || "new"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        mode={formMode}
        initialData={editingUser}
        onClose={closeFormModal}
        onSubmit={handleSubmitUser}
        submitting={submittingForm}
      />

      <DeleteUserDialog
        open={deleteOpen}
        user={deletingUser}
        deleting={deleting}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteUser}
      />

      <UserDetailsDrawer
        open={drawerOpen}
        user={focusedUser}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  );
}
