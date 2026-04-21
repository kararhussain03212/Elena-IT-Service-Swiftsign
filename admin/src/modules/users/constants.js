export const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
  { label: "Viewer", value: "viewer" },
];

export const ROLE_FORM_OPTIONS = ROLE_OPTIONS.filter((item) => item.value);

export const ROLE_ALIASES = {
  super_admin: "admin",
  manager: "editor",
  user: "viewer",
};

export const normalizeUserRole = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
};

export const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Pending", value: "pending" },
];

export const PERMISSION_OPTIONS = [
  { label: "Add Data", value: "add_data" },
  { label: "Edit Data", value: "edit_data" },
  { label: "Delete Data", value: "delete_data" },
  { label: "Publish / Active", value: "publish_data" },
];

export const ROLE_DEFAULT_PERMISSIONS = {
  admin: ["add_data", "edit_data", "delete_data", "publish_data"],
  editor: ["add_data", "edit_data", "publish_data"],
  viewer: [],
};

export const USER_FORM_DEFAULTS = {
  name: "",
  email: "",
  designation: "",
  phone: "",
  location: "",
  password: "",
  role: "viewer",
  status: "active",
  permissions: ROLE_DEFAULT_PERMISSIONS.viewer,
};
