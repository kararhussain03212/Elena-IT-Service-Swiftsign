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
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
    <section className="relative bg-[#212529] py-20 md:py-28 overflow-hidden">
      <div className="flex flex-col items-center justify-center relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div
          ref={headingRef}
          className="sr-hidden sr-up flex items-center text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc] mb-3"
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
              stroke="#3C72FC"
              strokeWidth="1.5"
            />
            <mask id="path-2-inside-1_668_146" fill="white">
              <path d="M3 6C3 3.79086 4.79086 2 7 2H13C15.2091 2 17 3.79086 17 6C17 8.20914 15.2091 10 13 10H7C4.79086 10 3 8.20914 3 6Z" />
            </mask>
            <path
              d="M3 6C3 2.96243 5.46243 0.5 8.5 0.5H11.5C14.5376 0.5 17 2.96243 17 6C17 4.61929 15.2091 3.5 13 3.5H7C4.79086 3.5 3 4.61929 3 6ZM17 6C17 9.03757 14.5376 11.5 11.5 11.5H8.5C5.46243 11.5 3 9.03757 3 6C3 7.38071 4.79086 8.5 7 8.5H13C15.2091 8.5 17 7.38071 17 6ZM3 10V2V10ZM17 2V10V2Z"
              fill="#3C72FC"
              mask="url(#path-2-inside-1_668_146)"
            />
          </svg>
          <h2>Our Services</h2>
        </div>
        <h1 className="sr-hidden sr-up text-4xl font-bold py-5 pb-15 leading-tight text-white md:text-[40px] md:leading-[1.12]">
          Smart IT Solutions For Modern Businesses
        </h1>

        {loading ? (
          <div className="text-white/65">Loading sub services...</div>
        ) : null}

        {!loading && subServices.length === 0 ? (
          <div className="text-white/65">No sub services available.</div>
        ) : null}

        <div
          ref={cardsRef}
          className="sr-hidden sr-up grid items-center justify-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
        >
          {subServices.map((service, index) => {
            const Icon = getFallbackIcon(service.title);
            const iconUrl = resolveIcon(service.icon);
            return (
              <div
                key={service._id || index}
                className="group relative flex w-full max-w-[360px] min-h-[220px] flex-col items-center text-center text-white border border-white/25 rounded-2xl px-8 pb-7 pt-14 bg-[#20252b] transition-colors duration-300"
              >
                <span
                  className={[
                    "absolute left-1/2 top-3.5 -translate-x-1/2 -translate-y-1/2",
                    "h-17 w-17 rounded-full",
                    "bg-[linear-gradient(180deg,_#3c72fc_-210.71%,_#00060c_100%)]",
                    "flex items-center justify-center",
                    "group-hover:bg-[linear-gradient(90deg,_#3c72fc_-10.59%,_#00060c_300.59%)]",
                    "transition-all duration-700 ease-out",
                    "group-hover:[transform:rotateY(360deg)]",
                  ].join(" ")}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={service.title + " icon"}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <Icon className="h-5 w-5 transition-colors duration-700 ease-out group-hover:text-white" />
                  )}
                </span>
                <h3 className="text-[20px] font-bold transition-colors mt-5 duration-400 group-hover:text-[#3c72fc]">
                  {service.title}
                </h3>
                <p className="text-[13.5px] mt-5 leading-6 text-white/90 transition-colors duration-300 group-hover:text-white">
                  {service.description ||
                    "Service details will be updated soon."}
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
