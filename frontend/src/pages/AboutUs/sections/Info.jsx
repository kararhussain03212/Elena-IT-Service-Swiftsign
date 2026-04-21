import React from "react";
import icon1 from "@/assets/images/icon/counter-icon1.png";
import icon2 from "@/assets/images/icon/counter-icon2.png";
import icon3 from "@/assets/images/icon/counter-icon3.png";
import icon4 from "@/assets/images/icon/counter-icon4.png";
import righticon from "@/assets/images/shape/counnter-bg-shape.png";
import useScrollReveal from "@/hooks/useScrollReveal";

const ICON_MAP = {
  icon1,
  icon2,
  icon3,
  icon4,
};

const Info = ({ content = {} }) => {
  const statsRef = useScrollReveal();
  const dynamicStats = Array.isArray(content?.items)
    ? content.items.filter(
        (item) =>
          item?.isActive !== false &&
          String(item?.value || "").trim() && String(item?.label || "").trim(),
      )
    : [];

  const stats = dynamicStats.map((item, index) => {
    const key = String(item?.iconKey || "icon1");
    return {
      id: Number(item?.id || index + 1),
      icon: ICON_MAP[key] || ICON_MAP.icon1,
      value: String(item?.value || "").trim(),
      label: String(item?.label || "").trim(),
    };
  });

  if (stats.length === 0) return null;

  return (
    <section className="relative bg-[#151327] py-10 md:py-12">
          <img
            src={righticon}
            alt="Circuit lines"
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-auto opacity-70 md:block"
          />
      <div className="relative mx-auto w-full max-w-[1320px] px-6 md:px-10">
        <div ref={statsRef} className="sr-hidden sr-up relative w-full bg-gradient-to-r from-[#3c72fc]/90 to-[#2a4aa3]/90 py-12 md:py-16">
          <div className="relative z-10 px-6 md:px-10">
            <div className="grid gap-10 md:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 text-white"
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="h-10 w-10 object-contain md:h-14 md:w-14"
                  />
                  <div>
                    <p className="text-2xl font-bold leading-none md:text-3xl">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-white/90 md:text-base">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Info;
