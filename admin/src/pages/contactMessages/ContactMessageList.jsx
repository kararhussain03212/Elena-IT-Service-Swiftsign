import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteContactMessage,
  getContactMessages,
  toggleContactMessageRead,
} from "../../api/contactMessageApi";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function ContactMessageList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const matchesDayFilter = useCallback(
    (value) => {
      if (dayFilter === "all") return true;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const tomorrowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const dayAfterTomorrowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 2,
      );
      const yesterdayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
      );
      const last7DaysStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      );

      if (dayFilter === "today") {
        return date >= todayStart && date < tomorrowStart;
      }

      if (dayFilter === "tomorrow") {
        return date >= tomorrowStart && date < dayAfterTomorrowStart;
      }

      if (dayFilter === "yesterday") {
        return date >= yesterdayStart && date < todayStart;
      }

      if (dayFilter === "last7") {
        return date >= last7DaysStart && date < dayAfterTomorrowStart;
      }

      return true;
    },
    [dayFilter],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit: 100 };
        const normalizedSearch = search.trim();
        if (normalizedSearch) params.search = normalizedSearch;
        if (readFilter === "read") params.read = true;
        if (readFilter === "unread") params.read = false;

        const { data } = await getContactMessages(params);
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setItems(nextItems.filter((item) => matchesDayFilter(item.createdAt)));
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, readFilter, dayFilter, refreshKey, matchesDayFilter]);

  const counts = useMemo(() => {
    const unread = items.filter((item) => !item.isRead).length;
    return { total: items.length, unread };
  }, [items]);

  const handleToggleRead = async (item) => {
    try {
      const { data } = await toggleContactMessageRead(item._id, !item.isRead);
      setItems((prev) =>
        prev.map((entry) => (entry._id === item._id ? data : entry)),
      );
    } catch (error) {
      console.error(error);
      window.alert("Unable to update message status.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this message permanently?")) return;

    try {
      await deleteContactMessage(item._id);
      setItems((prev) => prev.filter((entry) => entry._id !== item._id));
    } catch (error) {
      console.error(error);
      window.alert("Unable to delete message.");
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
          <p className="text-sm text-white/65">
            Track contact form submissions and manage incoming leads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0F2350] p-4">
          <p className="text-xs uppercase tracking-wider text-white/55">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0F2350] p-4">
          <p className="text-xs uppercase tracking-wider text-white/55">
            Unread
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {counts.unread}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0F2350] p-4">
          <p className="text-xs uppercase tracking-wider text-white/55">Read</p>
          <p className="mt-2 text-2xl font-bold text-green-300">
            {counts.total - counts.unread}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, subject or message"
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#5f8fff]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Read Status
            </span>
            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option
                value="all"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                All Messages
              </option>
              <option
                value="unread"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Unread
              </option>
              <option
                value="read"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Read
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">
              Message Day
            </span>
            <select
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#5f8fff]"
            >
              <option
                value="all"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                All Days
              </option>
              <option
                value="today"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Today
              </option>
              <option
                value="tomorrow"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Tomorrow
              </option>
              <option
                value="yesterday"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Yesterday
              </option>
              <option
                value="last7"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                Last 7 Days
              </option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-white/70">Loading contact messages...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0F2350] p-10 text-center text-sm text-white/60">
          No messages found.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-white/10 bg-[#0F2350] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <p className="text-sm text-white/70">{item.email}</p>
                  {item.phone ? (
                    <p className="text-xs text-white/50">Phone: {item.phone}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      item.isRead
                        ? "rounded-full border border-green-400/35 bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-200"
                        : "rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200"
                    }
                  >
                    {item.isRead ? "Read" : "Unread"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleRead(item)}
                    className="rounded-lg border border-blue-400/35 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/25"
                  >
                    Mark as {item.isRead ? "Unread" : "Read"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  <span className="text-white/35">Subject:</span>{" "}
                  {item.subject || "Website Contact Form"}
                </p>
                <p>
                  <span className="text-white/35">Received:</span>{" "}
                  {formatDateTime(item.createdAt)}
                </p>
                <p>
                  <span className="text-white/35">Email Sent:</span>{" "}
                  {item.emailSent ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-white/35">Read At:</span>{" "}
                  {item.readAt ? formatDateTime(item.readAt) : "-"}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/3 p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/85">
                  {item.message}
                </p>
              </div>

              {!item.emailSent && item.emailError ? (
                <p className="mt-3 text-xs text-amber-300">
                  Email delivery issue: {item.emailError}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
