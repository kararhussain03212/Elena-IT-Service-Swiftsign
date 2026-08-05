import { FaPlay } from "react-icons/fa";
import chooseImg from "../../../assets/images/choose/choose-image1.png";
import icon1 from "../../../assets/images/icon/about-icon1.png";
import icon2 from "../../../assets/images/icon/about-icon2.png";
import serviceItemShape from "../../../assets/images/shape/choose-shape-left.png";
import useScrollReveal from "@/hooks/useScrollReveal";

const featureIconMap = {
  icon1,
  icon2,
};

const ChooseUs = ({ content = {} }) => {
  const imgRef = useScrollReveal();
  const contentRef = useScrollReveal();

  const badge = String(content.badge || "").trim();
  const heading = String(content.heading || "").trim();
  const featureCards = Array.isArray(content.featureCards)
    ? content.featureCards.filter((item) => item?.isActive !== false)
    : [];
  const progressBars = Array.isArray(content.progressBars)
    ? content.progressBars.filter((item) => item?.isActive !== false)
    : [];
  const videoUrl = String(content.videoUrl || "").trim();

  const hasContent =
    Boolean(badge || heading || videoUrl) ||
    featureCards.length > 0 ||
    progressBars.length > 0;

  if (!hasContent) return null;

  return (
    <section className="relative bg-white py-20 md:py-28 overflow-hidden">
      <img
        src={serviceItemShape}
        alt="icon"
        className="absolute left-0 bottom-0 pointer-events-none z-[-1] opacity-10"
      />
      <div className=" mx-auto w-full max-w-[1320px] px-6 md:px-10 z-0 inset-0">
        {/*
          On desktop (lg+): left content takes ~53% width, and the image
          is absolutely placed on the right 47% of the SECTION.
          On mobile/tablet: stacked layout — content first, image below.
        */}
        <div ref={contentRef} className="sr-hidden sr-left lg:w-[53%] lg:pr-14">
          {/* Badge */}
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4]">
            <svg
              className="mr-1"
              width="20"
              height="12"
              viewBox="0 0 20 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.75"
                y="0.747803"
                width="18.5"
                height="10.5"
                rx="5.25"
                stroke="#0E70C4"
                strokeWidth="1.5"
              />
              <mask id="ci-mask" fill="white">
                <path d="M3 5.9978C3 3.78866 4.79086 1.9978 7 1.9978H13C15.2091 1.9978 17 3.78866 17 5.9978C17 8.20694 15.2091 9.9978 13 9.9978H7C4.79086 9.9978 3 8.20694 3 5.9978Z" />
              </mask>
              <path
                d="M3 5.9978C3 2.96024 5.46243 0.497803 8.5 0.497803H11.5C14.5376 0.497803 17 2.96024 17 5.9978C17 4.61709 15.2091 3.4978 13 3.4978H7C4.79086 3.4978 3 4.61709 3 5.9978ZM17 5.9978C17 9.03537 14.5376 11.4978 11.5 11.4978H8.5C5.46243 11.4978 3 9.03537 3 5.9978C3 7.37851 4.79086 8.4978 7 8.4978H13C15.2091 8.4978 17 7.37851 17 5.9978ZM3 9.9978V1.9978V9.9978ZM17 1.9978V9.9978V1.9978Z"
                fill="#0E70C4"
                mask="url(#ci-mask)"
              />
            </svg>
            {badge}
          </p>

          {/* Heading */}
          <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0B1B3A] sm:text-3xl md:text-[40px] md:leading-[1.15]">
            {heading}
          </h2>

          {/* Feature cards — inlined */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {featureCards.map((card, index) => {
              const iconSrc = featureIconMap[card.iconKey] || icon1;
              const cardTitle = card?.title || `Feature ${index + 1}`;

              return (
                <div
                  key={`${cardTitle}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
                >
                  <div className="flex h-19 w-19 shrink-0 items-center justify-center bg-white border border-black/15 rounded-full transition-colors hover:bg-black/5">
                    <img
                      src={iconSrc}
                      alt={cardTitle}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#0B1B3A]">
                      {cardTitle}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#0B1B3A]/60">
                      {card?.description || ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bars — inlined */}
          <div className="mt-10 space-y-6">
            {progressBars.map((bar, index) => {
              const value = Math.max(0, Math.min(100, Number(bar?.value) || 0));

              return (
                <div key={`${bar?.label || "progress"}-${index}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0B1B3A]/90">
                      {bar?.label || "Progress"}
                    </span>
                    <span className="text-sm font-bold text-[#0E70C4]">
                      {value}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden bg-[#0B1B3A]/10">
                    <div
                      className="h-full bg-[#0E70C4] transition-all duration-1000"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* END left content */}

        {/* ── IMAGE ── mobile/tablet: relative block below content; desktop: absolute right panel ── */}
        <div
          ref={imgRef}
          className={[
            "sr-hidden sr-right",
            // Mobile / tablet — relative, full width, with border-radius
            "relative mt-10 w-full overflow-hidden rounded-2xl",
            "h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px]",
            // Desktop — absolute, right 0, full section height, no border-radius
            "lg:absolute lg:top-0 lg:right-0 lg:mt-0 lg:h-full lg:w-[47%] lg:rounded-none",
          ].join(" ")}
        >
          <img
            src={chooseImg}
            alt="Why choose us"
            className="h-full w-full object-cover object-center block"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#0F2350]/40" />

          {/* Play button — centred with video-pulse ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Play video"
                className={[
                  "video-pulse",
                  "group relative flex items-center justify-center rounded-full",
                  "bg-white hover:bg-black/10",
                  "transition-transform duration-300 hover:scale-110",
                  // responsive sizes
                  "w-[50px] h-[50px] text-[16px]",
                  "sm:w-[60px] sm:h-[60px] sm:text-[18px]",
                  "md:w-[70px] md:h-[70px] md:text-[20px]",
                  "lg:w-[80px] lg:h-[80px] lg:text-[22px]",
                  "xl:w-[90px] xl:h-[90px] xl:text-[25px]",
                ].join(" ")}
              >
                {/* Third pulse ring (::before and ::after cover rings 1 & 2) */}
                <span className="pulse-ring" />
                <FaPlay className="relative z-10 ml-1 text-black transition-transform duration-300 group-hover:scale-110" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChooseUs;
