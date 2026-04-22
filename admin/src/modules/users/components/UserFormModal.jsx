import { useEffect, useState } from "react";
import {
  normalizeUserRole,
  PERMISSION_OPTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_FORM_OPTIONS,
  USER_FORM_DEFAULTS,
} from "../constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildInitialState = (initialData) => {
  const normalizedRole = normalizeUserRole(
    initialData?.role || USER_FORM_DEFAULTS.role,
  );
  const hasExplicitPermissions = Array.isArray(initialData?.permissions);

  return {
    name: initialData?.name ?? USER_FORM_DEFAULTS.name,
    email: initialData?.email ?? USER_FORM_DEFAULTS.email,
    designation: initialData?.designation ?? USER_FORM_DEFAULTS.designation,
    phone: initialData?.phone ?? USER_FORM_DEFAULTS.phone,
    location: initialData?.location ?? USER_FORM_DEFAULTS.location,
    password: USER_FORM_DEFAULTS.password,
    role: normalizedRole,
    status: initialData?.status ?? USER_FORM_DEFAULTS.status,
    permissions: hasExplicitPermissions
      ? initialData.permissions
      : ROLE_DEFAULT_PERMISSIONS[normalizedRole] ||
        USER_FORM_DEFAULTS.permissions,
  };
};

export default function UserFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState(() => buildInitialState(initialData));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const setField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!String(form.name || "").trim())
      nextErrors.name = "Full name is required.";
    if (!EMAIL_REGEX.test(String(form.email || "").trim()))
      nextErrors.email = "Enter a valid email.";
    if (String(form.designation || "").trim().length > 120) {
      nextErrors.designation = "Designation must be 120 characters or less.";
    }
    if (String(form.phone || "").trim().length > 40) {
      nextErrors.phone = "Phone must be 40 characters or less.";
    }
    if (String(form.location || "").trim().length > 120) {
      nextErrors.location = "Location must be 120 characters or less.";
    }

    if (mode === "create" && !String(form.password || "").trim()) {
      nextErrors.password = "Password is required.";
    } else if (
      String(form.password || "").trim() &&
      String(form.password).length < 8
    ) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.role) nextErrors.role = "Role is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      designation: String(form.designation || "").trim(),
      phone: String(form.phone || "").trim(),
      location: String(form.location || "").trim(),
      role: form.role,
      status: form.status,
      permissions: form.permissions,
    };

    if (String(form.password || "").trim()) {
      payload.password = form.password;
    }

    const result = await onSubmit(payload);
    if (result?.success) return;

    if (result?.errors && typeof result.errors === "object") {
      setErrors((previous) => ({ ...previous, ...result.errors }));
    }
    if (result?.message) setSubmitError(result.message);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto px-4 py-6 sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f0d1d] p-4 shadow-2xl shadow-black/50 transition-all duration-300 sm:p-5">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {mode === "create" ? "Add User" : "Edit User"}
            </h2>
            <p className="text-sm text-white/55">
              {mode === "create"
                ? "Create a new account and assign its role permissions."
                : "Update profile, access role and account status."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100dvh-8rem)] space-y-4 overflow-y-auto pr-1"
        >
          {submitError ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {submitError}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">
              Full Name
            </span>
            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
              placeholder="Jane Doe"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-300">{errors.name}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
              placeholder="jane@company.com"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-300">{errors.email}</p>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Designation
              </span>
              <input
                value={form.designation}
                onChange={(event) =>
                  setField("designation", event.target.value)
                }
                className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
                placeholder="Senior Editor"
              />
              {errors.designation ? (
                <p className="mt-1 text-xs text-red-300">
                  {errors.designation}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Phone
              </span>
              <input
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
                placeholder="+92 300 1234567"
              />
              {errors.phone ? (
                <p className="mt-1 text-xs text-red-300">{errors.phone}</p>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">
              Location
            </span>
            <input
              value={form.location}
              onChange={(event) => setField("location", event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
              placeholder="Lahore, Pakistan"
            />
            {errors.location ? (
              <p className="mt-1 text-xs text-red-300">{errors.location}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">
              Password {mode === "edit" ? "(optional)" : ""}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white placeholder:text-white/35 focus:border-[#3c72fc] focus:outline-none"
              placeholder={
                mode === "edit"
                  ? "Leave blank to keep existing password"
                  : "At least 8 characters"
              }
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-300">{errors.password}</p>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Role
              </span>
              <select
                value={form.role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setForm((previous) => ({
                    ...previous,
                    role: nextRole,
                    permissions:
                      ROLE_DEFAULT_PERMISSIONS[nextRole] ||
                      USER_FORM_DEFAULTS.permissions,
                  }));
                  setErrors((previous) => ({
                    ...previous,
                    role: "",
                    permissions: "",
                  }));
                  setSubmitError("");
                }}
                className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white focus:border-[#3c72fc] focus:outline-none"
              >
                {ROLE_FORM_OPTIONS.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
              {errors.role ? (
                <p className="mt-1 text-xs text-red-300">{errors.role}</p>
              ) : null}
            </label>

            <div className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#151327] px-3 py-2 text-white focus:border-[#3c72fc] focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-white/80">
              Permissions
            </span>
            <div className="grid gap-2 rounded-xl border border-white/15 bg-[#151327] p-3 sm:grid-cols-2">
              {PERMISSION_OPTIONS.map((permission) => {
                const checked = form.permissions.includes(permission.value);
                return (
                  <label
                    key={permission.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/85 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setField(
                          "permissions",
                          checked
                            ? form.permissions.filter(
                                (item) => item !== permission.value,
                              )
                            : [...form.permissions, permission.value],
                        );
                      }}
                      className="h-4 w-4 accent-[#3c72fc]"
                    />
                    {permission.label}
                  </label>
                );
              })}
            </div>
            {errors.permissions ? (
              <p className="mt-1 text-xs text-red-300">{errors.permissions}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#3c72fc] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
