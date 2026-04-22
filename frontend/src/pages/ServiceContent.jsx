import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Banner1 from "@/components/Banner1";
import { getServiceById, getServiceBySlug, getServices } from "@/api/Apis";
import { Check } from "lucide-react";
import useScrollReveal from "@/hooks/useScrollReveal";
import { sortContentItems } from "@/lib/sortContentItems";


const ServiceContent = () => {
  const { slug, id } = useParams();
  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(0);
  const mainImageRef = useScrollReveal();
  const detailTextRef = useScrollReveal();
  const benefitsRef = useScrollReveal();
  const secondaryImageRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const asideRef = useScrollReveal();

  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const resolveImage = (value) => {
    if (!value)
      return "https://placehold.co/1000x600/1b1832/ffffff?text=Service";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/uploads/" + value;
  };

  const toggle = (faqId) => setOpenId(openId === faqId ? null : faqId);

  const benefitItems = Array.isArray(service?.benefits) ? service.benefits : [];
  const faqItems = Array.isArray(service?.faqs) ? service.faqs : [];

  useEffect(() => {
    const load = async () => {
      try {
        const [detailRes, listRes] = await Promise.all([
          slug ? getServiceBySlug(slug) : getServiceById(id),
          getServices(),
        ]);

        const detail = detailRes?.data || null;
        const list = sortContentItems(
          Array.isArray(listRes?.data) ? listRes.data : [],
        );

        setService(detail);
        setServices(list);
        setOpenId(detail?.faqs?.[0]?.id ?? 0);
      } catch (error) {
        console.error("Service detail load failed", error);
        setService(null);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, id]);

  if (loading) {
    return (
      <section className="bg-[#151327] p-10 text-white">
        Loading service...
      </section>
    );
  }

  if (!service) {
    return (
      <section className="bg-[#151327]">
        <Banner1 title="Service Details" />
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-10 py-20 text-white">
          <h2 className="text-2xl font-bold">Service not found</h2>
          <p className="mt-3 text-white/70">
            The service you are looking for does not exist.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 text-[#3c72fc] hover:text-white transition-colors"
          >
            Back to Services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#151327]">
      <Banner1 title={service.title} />
      <div className="py-20 md:py-28 ">
        <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.6fr]">
            <div className="text-white">
              <div
                ref={mainImageRef}
                className="sr-hidden sr-up overflow-hidden"
              >
                <img
                  src={resolveImage(service.image)}
                  alt={service.title}
                  className="h-[200px] w-full object-cover md:h-[500px]"
                />
                <div
                  ref={detailTextRef}
                  className="sr-hidden sr-up pb-8 pt-6 md:pb-10 md:pt-8"
                >
                  <h3 className="text-2xl font-bold md:text-3xl">
                    {service.title}
                  </h3>
                  <p className="mt-5 text-[17px] leading-7 text-white/80 md:text-[15px] text-justify">
                    {service.description1 || service.description}
                  </p>

                  <p className="mt-4 text-[17px] leading-7 text-white/80 md:text-[15px] text-justify">
                    {service.description2 || ""}
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1fr]">
                {benefitItems.length > 0 ? (
                  <div ref={benefitsRef} className="sr-hidden sr-left">
                    <h4 className="text-xl font-semibold">
                      Benefits With Our Service
                    </h4>
                    <ul className="mt-4 space-y-4 text-sm text-white/80">
                      {benefitItems.map((item, index) => (
                        <li
                          key={`${index}-${item}`}
                          className="flex items-center gap-3 text-[16px]"
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#3c72fc] text-white">
                            <Check size={14} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div
                  ref={secondaryImageRef}
                  className="sr-hidden sr-right overflow-hidden"
                >
                  <img
                    src={resolveImage(service.image1 || service.detailImage)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {faqItems.length > 0 ? (
                <div ref={faqRef} className="sr-hidden sr-up mt-12">
                  <h4 className="text-xl font-bold text-white">
                    Most Common Questions
                  </h4>
                  <div className="mt-5 overflow-hidden bg-[#0f0d1d]">
                    {faqItems.map((faq, idx) => {
                      const faqKey = faq?.id ?? idx;
                      const isOpen = openId === faqKey;
                      return (
                        <div
                          key={faqKey}
                          className={`${idx !== 0 ? "border-t border-white/10" : ""}`}
                        >
                          <button
                            onClick={() => toggle(faqKey)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left group/faq"
                          >
                            <span
                              className={`font-semibold text-[15px] pr-4 transition-colors duration-200 ${
                                isOpen ? "text-[#3c72fc]" : "text-white"
                              }`}
                            >
                              {faq.question}
                            </span>
                            <span
                              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors duration-200 ${
                                isOpen
                                  ? "bg-[#3c72fc] text-white"
                                  : "bg-transparent border border-white/30 text-white/60"
                              }`}
                            >
                              {isOpen ? "-" : "+"}
                            </span>
                          </button>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateRows: isOpen ? "1fr" : "0fr",
                              transition: "grid-template-rows 300ms ease",
                            }}
                          >
                            <div style={{ overflow: "hidden", minHeight: 0 }}>
                              <p className="px-5 pb-5 text-white/70 text-[14.5px] leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <aside ref={asideRef} className="sr-hidden sr-left text-white">
              <h4 className="text-lg font-semibold mb-4">All Services</h4>
              <div className="space-y-2">
                {services.map((item) => (
                  <Link
                    key={item._id}
                    to={"/services/" + item.slug}
                    className={`block px-4 py-5 text-sm font-semibold transition-colors ${
                      item.slug === service.slug
                        ? "bg-[#3c72fc] text-white"
                        : "bg-[#221a4a] text-white/90 hover:bg-[#2c1f62]"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceContent;
