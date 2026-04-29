import React, { useEffect, useState } from "react";
import Banner from "@/components/Banner";
import {
  Mail,
  MapPin,
  PhoneCall,
  MessageCircle,
  Clock,
  LifeBuoy,
} from "lucide-react";
import Button from "@/components/Button";
import useScrollReveal from "@/hooks/useScrollReveal";
import { submitContactMessage } from "@/api/Apis";
import { useSections } from "@/hooks/useSections";

const CONTACT_SEND_FAILED =
  "Unable to send your message right now. Please try again.";

const CHANNEL_ICON_MAP = {
  PhoneCall,
  MessageCircle,
  Mail,
};

const Contact = () => {
  const infoRef = useScrollReveal();
  const formRef = useScrollReveal();
  const mapsRef = useScrollReveal();
  const channelsRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const { sections } = useSections("contact");

  const supportChannelsSection = sections.supportChannels || {};
  const supportHoursSection = sections.supportHours || {};
  const faqSection = sections.faq || {};
  const introBadge = String(supportChannelsSection.introBadge || "").trim();
  const introHeading = String(supportChannelsSection.introHeading || "").trim();
  const introDescription = String(
    supportChannelsSection.introDescription || "",
  ).trim();
  const supportHoursTitle = String(supportHoursSection.title || "").trim();
  const faqHeading = String(faqSection.heading || "").trim();
  const faqSubheading = String(faqSection.subheading || "").trim();
  const supportChannels = Array.isArray(supportChannelsSection.channels)
    ? supportChannelsSection.channels.filter(
        (channel) =>
          channel?.isActive !== false &&
          String(channel?.title || "").trim() &&
          String(channel?.href || "").trim() &&
          String(channel?.value || "").trim(),
      )
    : [];
  const supportHoursRows = Array.isArray(supportHoursSection.rows)
    ? supportHoursSection.rows.filter(
        (row) =>
          row?.isActive !== false &&
          (String(row?.label || "").trim() || String(row?.value || "").trim()),
      )
    : [];
  const faqData = Array.isArray(faqSection.items)
    ? faqSection.items.filter(
        (item) =>
          item?.isActive !== false &&
          String(item?.question || "").trim() &&
          String(item?.answer || "").trim(),
      )
    : [];
  const contactMainSection = sections.main || {};

  const infoTitle = String(contactMainSection.infoTitle || "").trim();
  const infoSubtitle = String(contactMainSection.infoSubtitle || "").trim();
  const phoneLabel = String(contactMainSection.phoneLabel || "").trim();
  const phoneValue = String(contactMainSection.phoneValue || "").trim();
  const phoneHref = String(contactMainSection.phoneHref || "").trim();
  const emailLabel = String(contactMainSection.emailLabel || "").trim();
  const emailValue = String(contactMainSection.emailValue || "").trim();
  const emailHref = String(contactMainSection.emailHref || "").trim();
  const formBadge = String(contactMainSection.formBadge || "").trim();
  const formHeading = String(contactMainSection.formHeading || "").trim();
  const formDescription = String(
    contactMainSection.formDescription || "",
  ).trim();
  const formNameLabel = String(contactMainSection.formNameLabel || "").trim();
  const formNamePlaceholder = String(
    contactMainSection.formNamePlaceholder || "",
  ).trim();
  const formEmailLabel = String(contactMainSection.formEmailLabel || "").trim();
  const formEmailPlaceholder = String(
    contactMainSection.formEmailPlaceholder || "",
  ).trim();
  const formMessageLabel = String(
    contactMainSection.formMessageLabel || "",
  ).trim();
  const formMessagePlaceholder = String(
    contactMainSection.formMessagePlaceholder || "",
  ).trim();
  const submitButtonText = String(
    contactMainSection.submitButtonText || "",
  ).trim();

  const dynamicLocations = Array.isArray(contactMainSection.locations)
    ? contactMainSection.locations.filter(
        (item) =>
          item?.isActive !== false &&
          String(item?.label || "").trim() &&
          String(item?.text || "").trim() &&
          String(item?.href || "").trim(),
      )
    : [];

  const locations = dynamicLocations;
  const mapLocations = locations
    .filter((location) => String(location?.embedUrl || "").trim())
    .map((location) => ({
      label: String(location.label || "").trim(),
      embedUrl: String(location.embedUrl || "").trim(),
    }));

  const hasSupportIntro = Boolean(
    introBadge || introHeading || introDescription,
  );
  const hasSupportChannels = supportChannels.length > 0;
  const hasSupportHours =
    Boolean(supportHoursTitle) || supportHoursRows.length > 0;
  const hasFaqSection =
    Boolean(faqHeading || faqSubheading) || faqData.length > 0;
  const hasInfoSection =
    Boolean(infoTitle || infoSubtitle || phoneValue || emailValue) ||
    locations.length > 0;
  const hasContactForm =
    Boolean(formBadge || formHeading || formDescription || submitButtonText) ||
    Boolean(
      formNameLabel ||
      formNamePlaceholder ||
      formEmailLabel ||
      formEmailPlaceholder ||
      formMessageLabel ||
      formMessagePlaceholder,
    );
  const hasContactMainSection = hasInfoSection || hasContactForm;
  const hasMapLocations = mapLocations.length > 0;
  const firstFaqId = faqData[0]?.id ?? null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitState, setSubmitState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [openFaq, setOpenFaq] = useState(firstFaqId);

  useEffect(() => {
    setOpenFaq(firstFaqId);
  }, [firstFaqId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitState.loading) return;

    setSubmitState({ loading: true, error: "", success: "" });

    try {
      const { data } = await submitContactMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      setSubmitState({
        loading: false,
        error: "",
        success:
          typeof data?.message === "string" && data.message.trim()
            ? data.message.trim()
            : "Thank you! Your message has been sent.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      const details =
        (typeof error?.response?.data?.message === "string" &&
          error.response.data.message.trim()) ||
        (typeof error?.message === "string" && error.message.trim()) ||
        "";

      setSubmitState({
        loading: false,
        error: details || CONTACT_SEND_FAILED,
        success: "",
      });
    }
  };

  return (
    <section className="w-full overflow-x-hidden">
      <Banner title="Contact & Support" />

      {/* ── Support intro ── */}
      {hasSupportIntro ? (
        <div className="bg-[#151327] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 text-center">
            {introBadge ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc] mb-4">
                <LifeBuoy className="w-4 h-4" />
                {introBadge}
              </div>
            ) : null}
            {introHeading ? (
              <h2 className="text-3xl md:text-[42px] font-bold text-white leading-snug">
                {introHeading}
              </h2>
            ) : null}
            {introDescription ? (
              <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl mx-auto">
                {introDescription}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Support channels ── */}
      {hasSupportChannels ? (
        <div className="bg-[#151327] py-16 sm:py-20">
          <div
            ref={channelsRef}
            className="sr-hidden sr-up mx-auto w-full max-w-[1200px] px-6 md:px-10"
          >
            <div className="grid gap-6 md:gap-8 md:grid-cols-3">
              {supportChannels.map((channel) => {
                const Icon = CHANNEL_ICON_MAP[channel?.icon] || PhoneCall;
                const channelColor = channel?.color || "#3c72fc";
                return (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target={
                      String(channel.href).startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel="noopener noreferrer"
                    className="group cursor-pointer rounded-2xl border border-white/10 bg-[#1a1835] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-[#3c72fc]/40 hover:shadow-[0_20px_40px_rgba(60,114,252,0.15)]"
                  >
                    <div
                      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${channelColor}22` }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: channelColor }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-white/50 mb-4">
                      {channel.description}
                    </p>
                    <p className="text-[#3c72fc] font-semibold text-sm group-hover:text-white transition-colors">
                      {channel.value}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Support hours ── */}
      {hasSupportHours ? (
        <div className="bg-[#151327] py-16">
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#3c72fc]/10 to-[#6f3fff]/10 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#3c72fc]/20">
                  <Clock className="w-10 h-10 text-[#3c72fc]" />
                </div>
                <div className="text-center md:text-left">
                  {supportHoursTitle ? (
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {supportHoursTitle}
                    </h3>
                  ) : null}
                  <div className="space-y-1 text-white/70">
                    {supportHoursRows.map((row, index) => (
                      <p key={`${row?.label || "row"}-${index}`}>
                        {row?.label ? (
                          <span className="text-white font-semibold">
                            {row.label}:
                          </span>
                        ) : null}{" "}
                        {row?.value || ""}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Main Contact Section ── */}
      {hasContactMainSection ? (
        <div className="bg-[#151327] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 md:px-10">
            <div
              className={`grid gap-8 md:gap-10 ${
                hasInfoSection && hasContactForm
                  ? "lg:grid-cols-[0.9fr_1.1fr]"
                  : "lg:grid-cols-1"
              } lg:gap-12`}
            >
              {hasInfoSection ? (
                <div
                  ref={infoRef}
                  className="sr-hidden sr-left bg-[#3c72fc] text-white p-6 sm:p-8 md:p-10"
                >
                  {infoTitle ? (
                    <h3 className="text-2xl sm:text-3xl font-bold">
                      {infoTitle}
                    </h3>
                  ) : null}
                  {infoSubtitle ? (
                    <p className="mt-3 text-sm sm:text-base text-white/90">
                      {infoSubtitle}
                    </p>
                  ) : null}

                  <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
                    {phoneValue ? (
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                          {phoneLabel ? (
                            <p className="text-sm sm:text-base text-white/80">
                              {phoneLabel}
                            </p>
                          ) : null}
                          {phoneHref ? (
                            <a
                              href={phoneHref}
                              className="text-[20px] font-semibold text-white"
                            >
                              {phoneValue}
                            </a>
                          ) : (
                            <p className="text-[20px] font-semibold text-white">
                              {phoneValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {emailValue ? (
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          {emailLabel ? (
                            <p className="text-sm sm:text-base text-white/80">
                              {emailLabel}
                            </p>
                          ) : null}
                          {emailHref ? (
                            <a
                              href={emailHref}
                              className="text-sm sm:text-base font-semibold"
                            >
                              {emailValue}
                            </a>
                          ) : (
                            <p className="text-sm sm:text-base font-semibold">
                              {emailValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {locations.map((location, index) => (
                      <div
                        key={`${location.label}-${index}`}
                        className="flex items-start gap-4 sm:gap-5"
                      >
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm sm:text-base text-white/80">
                            {location.label}
                          </p>
                          <a
                            className="text-sm sm:text-base leading-7"
                            href={location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {location.text}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {hasContactForm ? (
                <div ref={formRef} className="sr-hidden sr-right text-white">
                  {formBadge ? (
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#3c72fc]">
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
                      {formBadge}
                    </div>
                  ) : null}
                  {formHeading ? (
                    <h2 className="mt-4 text-3xl md:text-4xl font-bold">
                      {formHeading}
                    </h2>
                  ) : null}
                  {formDescription ? (
                    <p className="mt-4 text-base text-white/70">
                      {formDescription}
                    </p>
                  ) : null}

                  <form className="mt-6 space-y-7" onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex flex-col space-y-2">
                        {formNameLabel ? (
                          <label className="text-base font-semibold ">
                            {formNameLabel}
                          </label>
                        ) : null}
                        <input
                          type="text"
                          name="name"
                          placeholder={formNamePlaceholder}
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full rounded-md border border-white/20 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-[#3c72fc]"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        {formEmailLabel ? (
                          <label className="text-base font-semibold">
                            {formEmailLabel}
                          </label>
                        ) : null}
                        <input
                          type="email"
                          name="email"
                          placeholder={formEmailPlaceholder}
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full rounded-md border border-white/20 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-[#3c72fc]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {formMessageLabel ? (
                        <label className="text-base font-semibold">
                          {formMessageLabel}
                        </label>
                      ) : null}
                      <textarea
                        rows={6}
                        name="message"
                        placeholder={formMessagePlaceholder}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-white/20 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-[#3c72fc]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitState.loading}
                      text={
                        submitState.loading
                          ? "Sending..."
                          : submitButtonText || "Submit"
                      }
                      className={
                        submitState.loading
                          ? "pointer-events-none opacity-70"
                          : ""
                      }
                    />

                    {submitState.error ? (
                      <p className="text-sm text-red-400">
                        {submitState.error}
                      </p>
                    ) : null}
                    {submitState.success ? (
                      <p className="text-sm text-green-400">
                        {submitState.success}
                      </p>
                    ) : null}
                  </form>
                </div>
              ) : null}
            </div>

            {hasMapLocations ? (
              <div
                ref={mapsRef}
                className="sr-hidden sr-up mt-14 grid gap-8 md:grid-cols-2"
              >
                {mapLocations.map((location, index) => (
                  <div key={`${location.label}-${index}`}>
                    <div className="mb-3 flex items-center justify-center gap-2 text-[#3c72fc] font-semibold">
                      <MapPin className="h-4 w-4" />
                      {location.label}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <iframe
                        title={`${location.label} Map`}
                        src={location.embedUrl}
                        className="h-[240px] w-full md:h-[280px]"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── FAQ section ── */}
      {hasFaqSection ? (
        <div className="bg-[#151327] py-16 sm:py-20">
          <div
            ref={faqRef}
            className="sr-hidden sr-up mx-auto w-full max-w-[900px] px-6 md:px-10"
          >
            <div className="text-center mb-12">
              {faqHeading ? (
                <h2 className="text-3xl md:text-[36px] font-bold text-white">
                  {faqHeading}
                </h2>
              ) : null}
              {faqSubheading ? (
                <p className="mt-3 text-white/60">{faqSubheading}</p>
              ) : null}
            </div>

            {/* Accordion container with fixed border */}
            <div
              className="overflow-hidden"
              style={{
                background: "#0f0d1d",
                border: "1px solid rgba(60,114,252,0.15)",
              }}
            >
              {faqData.map((faq, idx) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={idx !== 0 ? "border-t border-white/10" : ""}
                  >
                    {/* Question row */}
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left group/faq"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`font-semibold text-[15px] pr-4 transition-colors duration-200 ${
                          isOpen ? "text-[#3c72fc]" : "text-white"
                        }`}
                      >
                        {faq.question}
                      </span>
                      {/* +/- toggle */}
                      <span
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors duration-200 ${
                          isOpen
                            ? "bg-[#3c72fc] text-white"
                            : "bg-transparent border border-white/30 text-white/60"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {/* Answer — CSS grid trick: animates exact content height, no page jump */}
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
        </div>
      ) : null}
    </section>
  );
};

export default Contact;
