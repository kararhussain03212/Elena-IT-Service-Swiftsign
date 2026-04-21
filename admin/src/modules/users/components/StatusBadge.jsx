import { getStatusBadgeClasses, toTitleCase } from "../utils";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(status)}`}
    >
      {toTitleCase(status)}
    </span>
  );
}
