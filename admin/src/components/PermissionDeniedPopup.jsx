import { useEffect, useRef, useState } from "react";

const DEFAULT_MESSAGE = "You don't have permission.";
const EVENT_NAME = "permission-denied";

export default function PermissionDeniedPopup() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const timerRef = useRef(null);

  useEffect(() => {
    const onPermissionDenied = (event) => {
      const nextMessage =
        String(event?.detail?.message || "").trim() || DEFAULT_MESSAGE;
      setMessage(nextMessage);
      setOpen(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setOpen(false);
      }, 2600);
    };

    window.addEventListener(EVENT_NAME, onPermissionDenied);

    return () => {
      window.removeEventListener(EVENT_NAME, onPermissionDenied);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[300]">
      <div className="pointer-events-auto min-w-72 max-w-sm rounded-xl border border-red-400/40 bg-[#1b1020] px-4 py-3 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold text-red-300">Permission denied</p>
        <p className="mt-1 text-sm text-white/85">{message}</p>
      </div>
    </div>
  );
}
