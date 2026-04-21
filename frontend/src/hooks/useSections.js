import { useEffect, useState } from "react";
import { getSections } from "@/api/Apis";

const EMPTY_SECTIONS = Object.freeze({});

const normalizeByPage = (page, items = []) => {
  const prefix = `${page}.`;

  return items.reduce((accumulator, item) => {
    if (item?.isActive === false) return accumulator;

    const rawKey = String(item?.key || "").trim();
    if (!rawKey) return accumulator;

    const normalizedKey = rawKey.startsWith(prefix)
      ? rawKey.slice(prefix.length)
      : rawKey;

    accumulator[normalizedKey] = item?.content || {};
    return accumulator;
  }, {});
};

const getErrorMessage = (error) => {
  const serverMessage = error?.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return "Failed to load section content";
};

export const useSections = (page) => {
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchSections = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await getSections({ page, t: Date.now() });

        if (!isMounted) return;

        setSections(normalizeByPage(page, Array.isArray(data) ? data : []));
      } catch (requestError) {
        if (!isMounted) return;

        setSections(EMPTY_SECTIONS);
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSections();

    return () => {
      isMounted = false;
    };
  }, [page]);

  return { sections, loading, error };
};
