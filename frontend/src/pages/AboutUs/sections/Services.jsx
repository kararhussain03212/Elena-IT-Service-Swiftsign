import React, { useEffect, useMemo, useState } from "react";
import { Bot, Cloud, Globe, Search, Shield, Smartphone } from "lucide-react";
import { getSubServices } from "@/api/Apis";
import useScrollReveal from "@/hooks/useScrollReveal";
import { sortContentItems } from "@/lib/sortContentItems";

const Services = () => {
  const headingRef = useScrollReveal();
  const cardsRef = useScrollReveal();
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveIcon = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return apiRoot + raw;
    if (/\.(png|jpe?g|svg|webp|gif)$/i.test(raw)) {
      return apiRoot + "/uploads/" + raw.replace(/^\/?uploads\//i, "");
    }
    return "";
  };

  const getFallbackIcon = (title) => {
    const normalized = String(title || "").toLowerCase();
    if (normalized.includes("app") || normalized.includes("mobile"))
      return Smartphone;
    if (normalized.includes("seo") || normalized.includes("search"))
      return Search;
    if (normalized.includes("cyber") || normalized.includes("security"))
      return Shield;
    if (normalized.includes("cloud")) return Cloud;
    if (normalized.includes("ai") || normalized.includes("automation"))
      return Bot;
    return Globe;
  };

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await getSubServices();
        if (ignore) return;
        setSubServices(
          sortContentItems(Array.isArray(response.data) ? response.data : []),
        );
      } catch {
        if (!ignore) setSubServices([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="relative bg-white py-20 md:py-28 overflow-hidden">
      <div className="flex flex-col items-center justify-center relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div
          ref={headingRef}
          className="sr-hidden sr-up flex items-center text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4] mb-3"
        >
          <svg
            className="me-1"
            width="20"
            height="12"
            viewBox="0 0 20 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.75"
              y="0.75"
              width="18.5"
              height="10.5"
              rx="5.25"
              stroke="#0E70C4"
              strokeWidth="1.5"
            />
            <mask id="path-2-inside-1_668_146" fill="white">
              <path d="M3 6C3 3.79086 4.79086 2 7 2H13C15.2091 2 17 3.79086 17 6C17 8.20914 15.2091 10 13 10H7C4.79086 10 3 8.20914 3 6Z" />
            </mask>
            <path
              d="M3 6C3 2.96243 5.46243 0.5 8.5 0.5H11.5C14.5376 0.5 17 2.96243 17 6C17 4.61929 15.2091 3.5 13 3.5H7C4.79086 3.5 3 4.61929 3 6ZM17 6C17 9.03757 14.5376 11.5 11.5 11.5H8.5C5.46243 11.5 3 9.03757 3 6C3 7.38071 4.79086 8.5 7 8.5H13C15.2091 8.5 17 7.38071 17 6ZM3 10V2V10ZM17 2V10V2Z"
              fill="#0E70C4"
              mask="url(#path-2-inside-1_668_146)"
            />
          </svg>
          <h2>Our Services</h2>
        </div>
        <h1 className="sr-hidden sr-up text-4xl font-bold py-5 pb-15 leading-tight text-[#0B1B3A] md:text-[40px] md:leading-[1.12]">
          Smart IT Solutions For Modern Businesses
        </h1>

        {loading ? (
          <div className="text-[#0B1B3A]/65">Loading sub services...</div>
        ) : null}

        {!loading && subServices.length === 0 ? (
          <div className="text-[#0B1B3A]/65">No sub services available.</div>
        ) : null}

        <div
          ref={cardsRef}
          className="sr-hidden sr-up grid items-start justify-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {subServices.map((service, index) => {
            const Icon = getFallbackIcon(service.title);
            const iconUrl = resolveIcon(service.icon);
            return (
              <div
                key={service._id || index}
                className="group relative flex w-full flex-col text-left border border-black/10 rounded-2xl p-8 bg-white shadow-sm transition-all duration-300 hover:border-[#0E70C4] hover:shadow-[0_8px_30px_rgba(14,112,196,0.12)]"
              >
                {/* Top Row: Icon Box & Hover Arrow */}
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-xl bg-[#0E70C4]/10 flex items-center justify-center text-[#0E70C4] transition-colors duration-300">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={service.title + " icon"}
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <Icon className="h-7 w-7" />
                    )}
                  </div>
                </div>

                <h3 className="text-[20px] font-bold text-[#0B1B3A] transition-colors duration-300 group-hover:text-[#0E70C4]">
                  {service.title}
                </h3>
                <p className="text-[14px] mt-3 leading-relaxed text-[#555555]">
                  {service.description || "Service details will be updated soon."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
