import Banner from "@/components/Banner";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getServices } from "@/api/Apis";
import serviceItemShape from "@/assets/images/shape/service-two-item-shape.png";
import useScrollReveal from "@/hooks/useScrollReveal";
import useScrollRevealGrid from "@/hooks/useScrollRevealGrid";
import { sortContentItems } from "@/lib/sortContentItems";

const serviceAssetModules = import.meta.glob(
  "@/assets/images/service/*",
  { eager: true, import: "default" },
);

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const headingRef = useScrollReveal();
  const gridRef = useScrollRevealGrid(services);

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    const raw = String(value || "").trim();
    
    // CHANGE: Check if value is a valid image path from database
    if (raw) {
      // Try local static assets first
      const key = Object.keys(serviceAssetModules).find((path) =>
        path.toLowerCase().endsWith("/" + raw.toLowerCase().replace(/^uploads\//i, "").replace(/^\//, "")),
      );
      if (key) return serviceAssetModules[key];
      
      // CHANGE: Handle absolute paths from database
      if (raw.startsWith("http")) return raw;
      if (raw.startsWith("/uploads/")) return apiRoot + raw;
      if (raw.startsWith("uploads/")) return apiRoot + "/" + raw;
      
      // WHY: Treat as filename if it's just a name
      return apiRoot + "/uploads/" + raw;
    }

    // Fallback placeholder
    return "https://placehold.co/800x500/142A52/ffffff?text=Service";
  };

  const pickServiceImage = (service) => {
    // CHANGE: Check API fields first (snake_case), then fallbacks
    const candidates = [
      service?.image,
      service?.image1,
      service?.detail_image,
      service?.detailImage,
      service?.icon,
    ];

    for (const raw of candidates) {
      const value = String(raw || "").trim();
      if (!value) continue;
      
      // WHY: Accept any non-empty image field from database
      // CHANGE: Simpler detection - if it looks like a path or has extension, use it
      if (value.includes("/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(value)) {
        return value;
      }
      
      // WHY: Also accept anything that starts with protocol or /uploads
      if (value.startsWith("http") || value.startsWith("/uploads/") || value.startsWith("uploads/")) {
        return value;
      }
    }
    
    return "";
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServices();
        setServices(sortContentItems(Array.isArray(res.data) ? res.data : []));
      } catch (error) {
        console.error("Services load failed", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section>
      <Banner title="Service" />

      <div className="py-28 bg-white">
        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
          <div ref={headingRef} className="sr-hidden sr-up text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1B3A] mb-3">
              Our Services
            </h2>
            <p className="text-[#0B1B3A]/60 max-w-xl mx-auto">
              Smart, scalable IT solutions tailored for the digital
              era.
            </p>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {loading ? (
              <p className="col-span-full text-[#0B1B3A]/70 text-center">
                Loading services...
              </p>
            ) : (
              services.map((service, index) => (
                <article
                  key={service._id || service.slug || index}
                  className="sr-hidden sr-up group relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-[60px] rounded-tr-none rounded-bl-none bg-white border border-black/10 shadow-[0_18px_45px_rgba(11,27,58,0.08)]"
                >
                  <img
                    src={resolveImage(pickServiceImage(service))}
                    alt={service.title}
                    className="h-[230px] w-full object-cover"
                  />

                  <div className="relative flex flex-1 flex-col px-6 pb-7 pt-14">
                    <img
                      src={serviceItemShape}
                      alt=""
                      className="pointer-events-none absolute right-0 top-3 w-[145px] opacity-10"
                    />

                    <h3 className="text-[24px] font-bold leading-tight text-[#0B1B3A]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#0B1B3A]/70">
                      {service.shortDescription || service.description}
                    </p>

                    <Link
                      to={"/services/" + service.slug}
                      className="mt-auto inline-flex items-center gap-2 pt-5 text-[15px] font-semibold text-[#0E70C4] hover:text-[#0B1B3A]"
                    >
                      <span>Read More</span>
                      <span>-&gt;</span>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
