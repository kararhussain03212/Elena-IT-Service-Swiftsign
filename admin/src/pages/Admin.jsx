import { useEffect, useMemo, useState } from "react";
import ProfilePhotoUpload from "../components/ProfilePhotoUpload";
import { useAuth } from "../context/useAuth";
import { normalizeUserRole } from "../modules/users/constants";

const ROLE_LABELS = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
};

const getApiRoot = () => {
  const apiUrl = String(
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  );
  return apiUrl.replace(/\/api\/?$/, "");
};

const resolveAvatarUrl = (value, apiRoot) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = raw.startsWith("/uploads/")
    ? raw
    : `/uploads/${raw.replace(/^\/?uploads\//i, "")}`;

  return `${apiRoot}${normalized}`;
};

const getRequestErrorMessage = (error, fallbackMessage) => {
  const apiErrors = error?.response?.data?.errors;
  if (apiErrors && typeof apiErrors === "object") {
    const firstError = Object.values(apiErrors).find(Boolean);
    if (firstError) return String(firstError);
  }
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export default function Admin() {
  const { user, updateProfile, changePassword } = useAuth();
  const apiRoot = useMemo(getApiRoot, []);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    designation: "",
    phone: "",
    location: "",
    bio: "",
    avatarFile: null,
    removeAvatar: false,
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const resolvedRole = normalizeUserRole(user?.role);
  const currentAvatarUrl = resolveAvatarUrl(user?.avatar, apiRoot);

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      email: user?.email || "",
      designation: user?.designation || "",
      phone: user?.phone || "",
      location: user?.location || "",
      bio: user?.bio || "",
      avatarFile: null,
      removeAvatar: false,
    });
  }, [user]);

  const handlePhotoChange = ({ file, removeAvatar }) => {
    setProfileError("");
    setProfile((prev) => ({
      ...prev,
      avatarFile: file || null,
      removeAvatar: Boolean(removeAvatar),
    }));

    if (file) {
      setProfileMessage("Photo selected. Click Save Photo to upload.");
      return;
    }
    if (removeAvatar) {
      setProfileMessage("Photo will be removed after you click Save Photo.");
      return;
    }
    setProfileMessage("");
  };

  const onUpdateProfile = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");

    try {
      setProfileSubmitting(true);

      const response = await updateProfile({
        name: profile.name,
        email: profile.email,
        designation: profile.designation,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        avatarFile: profile.avatarFile,
        removeAvatar: profile.removeAvatar,
      });

      setProfileMessage(response?.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(
        getRequestErrorMessage(error, "Failed to update profile."),
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const onSavePhoto = async () => {
    setProfileMessage("");
    setProfileError("");

    if (!profile.avatarFile && !profile.removeAvatar) {
      setProfileError("Please choose a photo first.");
      return;
    }

    try {
      setProfileSubmitting(true);

      const response = await updateProfile({
        // Save only photo changes while preserving current account identity fields.
        name: user?.name || profile.name,
        email: user?.email || profile.email,
        designation: user?.designation || profile.designation,
        phone: user?.phone || profile.phone,
        location: user?.location || profile.location,
        bio: user?.bio || profile.bio,
        avatarFile: profile.avatarFile,
        removeAvatar: profile.removeAvatar,
      });

      setProfileMessage(
        response?.message || "Profile photo saved successfully.",
      );
    } catch (error) {
      setProfileError(
        getRequestErrorMessage(error, "Failed to save profile photo."),
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwords.next !== passwords.confirm) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setPasswordSubmitting(true);

      const response = await changePassword({
        currentPassword: passwords.current,
        nextPassword: passwords.next,
      });

      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordMessage(response?.message || "Password changed successfully.");
    } catch (error) {
      setPasswordError(
        getRequestErrorMessage(error, "Failed to change password."),
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/65">
          Manage your profile photo, designation, account email and security
          password.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          onSubmit={onUpdateProfile}
          className="min-w-0 rounded-2xl border border-white/10 bg-[#0f0d1d] p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="text-sm text-white/60">
                Update your personal account details.
              </p>
            </div>
            <span className="rounded-full border border-[#3c72fc]/35 bg-[#3c72fc]/15 px-3 py-1 text-xs font-semibold text-[#8eb1ff]">
              {ROLE_LABELS[resolvedRole] || "User"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-3">
              <ProfilePhotoUpload
                initialImage={currentAvatarUrl}
                fallbackText={user?.name || "U"}
                disabled={profileSubmitting}
                onChange={handlePhotoChange}
              />

              <button
                type="button"
                onClick={onSavePhoto}
                disabled={
                  profileSubmitting ||
                  (!profile.avatarFile && !profile.removeAvatar)
                }
                className="w-full rounded-lg bg-[#3c72fc] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSubmitting ? "Saving Photo..." : "Save Photo"}
              </button>
            </div>

            <div className="min-w-0 space-y-3">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Full Name</span>
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Designation</span>
                <input
                  value={profile.designation}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      designation: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  placeholder="Senior Editor"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Bio</span>
                <textarea
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  placeholder="Short professional intro..."
                />
              </label>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="rounded-lg bg-[#3c72fc] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {profileSubmitting ? "Saving..." : "Save Profile"}
              </button>

              {profileMessage ? (
                <p className="text-sm text-green-400">{profileMessage}</p>
              ) : null}
              {profileError ? (
                <p className="text-sm text-red-400">{profileError}</p>
              ) : null}
            </div>
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          <form
            onSubmit={onChangePassword}
            className="min-w-0 rounded-2xl border border-white/10 bg-[#0f0d1d] p-4 sm:p-5"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Security</h2>

            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Current Password</span>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(event) =>
                    setPasswords((prev) => ({
                      ...prev,
                      current: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">New Password</span>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords((prev) => ({
                      ...prev,
                      next: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">
                  Confirm New Password
                </span>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords((prev) => ({
                      ...prev,
                      confirm: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="mt-4 rounded-lg bg-[#3c72fc] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {passwordSubmitting ? "Updating..." : "Change Password"}
            </button>

            {passwordMessage ? (
              <p className="mt-2 text-sm text-green-400">{passwordMessage}</p>
            ) : null}
            {passwordError ? (
              <p className="mt-2 text-sm text-red-400">{passwordError}</p>
            ) : null}
          </form>

          <div className="rounded-2xl border border-white/10 bg-[#0f0d1d] p-5">
            <h3 className="mb-3 text-base font-semibold text-white">Account</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white/70">
                Role:{" "}
                <span className="font-medium text-white">
                  {ROLE_LABELS[resolvedRole] || "User"}
                </span>
              </p>
              <p className="text-white/70">
                Designation:{" "}
                <span className="font-medium text-white">
                  {user?.designation || "Not set"}
                </span>
              </p>
              <p className="text-white/70">
                Status:{" "}
                <span className="font-medium text-white">
                  {STATUS_LABELS[user?.status] || "Unknown"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
