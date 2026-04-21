export const formatDateTime = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const toTitleCase = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const safe = String(part || "");
      return safe.charAt(0).toUpperCase() + safe.slice(1).toLowerCase();
    })
    .join(" ");
};

export const getApiRoot = () => {
  const apiUrl = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api");
  return apiUrl.replace(/\/api\/?$/, "");
};

export const resolveAvatarUrl = (value, apiRoot = getApiRoot()) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = raw.startsWith("/uploads/")
    ? raw
    : `/uploads/${raw.replace(/^\/?uploads\//i, "")}`;

  return `${apiRoot}${normalized}`;
};

export const getInitialLetter = (value) => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() : "U";
};

export const getStatusBadgeClasses = (status) => {
  switch (status) {
    case "active":
      return "border-green-400/30 bg-green-500/15 text-green-300";
    case "suspended":
      return "border-red-400/30 bg-red-500/15 text-red-300";
    case "pending":
      return "border-amber-400/30 bg-amber-500/15 text-amber-300";
    default:
      return "border-white/20 bg-white/10 text-white/70";
  }
};
