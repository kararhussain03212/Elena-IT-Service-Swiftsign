export default function DeleteUserDialog({ open, user, deleting, onCancel, onConfirm }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-400/25 bg-[#150c17] p-5 shadow-2xl shadow-black/60">
        <h3 className="text-lg font-semibold text-white">Delete User</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          Are you sure you want to delete this user?
          <span className="mt-1 block font-semibold text-white">{user.name}</span>
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
