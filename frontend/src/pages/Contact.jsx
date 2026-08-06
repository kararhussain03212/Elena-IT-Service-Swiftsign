import React, { useEffect, useRef, useState } from "react";
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

    if (!recaptchaToken) {
      setSubmitState({
        loading: false,
        error: "Please complete the reCAPTCHA verification.",
        success: "",
      });
      return;
    }

    setSubmitState({ loading: true, error: "", success: "" });

    try {
      const { data } = await submitContactMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        recaptchaToken,
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
      recaptchaRef.current?.reset();
      setRecaptchaToken("");
    } catch (error) {
      const details =
        (typeof error?.response?.data?.message === "string" &&
          error.response.data.message.trim()) ||
        (typeof error?.message === "string" && error.message.trim()) ||
        "";

      recaptchaRef.current?.reset();
      setRecaptchaToken("");
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
        <div className="bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 text-center">
            {introBadge ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4] mb-4">
                <LifeBuoy className="w-4 h-4" />
                {introBadge}
              </div>
            ) : null}
            {introHeading ? (
              <h2 className="text-3xl md:text-[42px] font-bold text-[#0B1B3A] leading-snug">
                {introHeading}
              </h2>
            ) : null}
            {introDescription ? (
              <p className="mt-4 text-base md:text-lg text-[#0B1B3A]/60 max-w-2xl mx-auto">
                {introDescription}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Support channels ── */}
      {hasSupportChannels ? (
        <div className="bg-white py-16 sm:py-20">
          <div
            ref={channelsRef}
            className="sr-hidden sr-up mx-auto w-full max-w-[1200px] px-6 md:px-10"
          >
            <div className="grid gap-6 md:gap-8 md:grid-cols-3">
              {supportChannels.map((channel) => {
                const Icon = CHANNEL_ICON_MAP[channel?.icon] || PhoneCall;
                const channelColor = channel?.color || "#1C64EC";
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
                    className="group cursor-pointer rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#1C64EC]/40 hover:shadow-[0_20px_40px_rgba(14,112,196,0.15)]"
                  >
                    <div
                      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${channelColor}1a` }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: channelColor }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B1B3A] mb-2">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-[#0B1B3A]/60 mb-4">
                      {channel.description}
                    </p>
                    <p className="text-[#1C64EC] font-semibold text-sm group-hover:text-[#0B1B3A] transition-colors">
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
        <div className="bg-white py-16">
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
            <div className="rounded-2xl border border-black/10 bg-gradient-to-r from-[#1C64EC]/5 to-[#04B4D4]/5 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1C64EC]/15">
                  <Clock className="w-10 h-10 text-[#1C64EC]" />
                </div>
                <div className="text-center md:text-left">
                  {supportHoursTitle ? (
                    <h3 className="text-2xl font-bold text-[#0B1B3A] mb-2">
                      {supportHoursTitle}
                    </h3>
                  ) : null}
                  <div className="space-y-1 text-[#0B1B3A]/70">
                    {supportHoursRows.map((row, index) => (
                      <p key={`${row?.label || "row"}-${index}`}>
                        {row?.label ? (
                          <span className="text-[#0B1B3A] font-semibold">
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
        <div className="bg-[#f7f7f7] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 md:px-10">
            <div
              className={`grid gap-12 md:gap-16 ${
                hasInfoSection && hasContactForm
                  ? "lg:grid-cols-2"
                  : "lg:grid-cols-1"
              }`}
            >
              {hasInfoSection ? (
                <div
                  ref={infoRef}
                  className="sr-hidden sr-left text-[#0B1B3A] py-4 sm:py-8 lg:pr-10"
                >
                  {infoTitle ? (
                    <h3 className="text-3xl sm:text-[40px] font-bold mb-4 leading-tight">
                      {infoTitle}
                    </h3>
                  ) : null}
                  {infoSubtitle ? (
                    <p className="text-[15px] text-[#555555] mb-10 leading-relaxed">
                      {infoSubtitle}
                    </p>
                  ) : null}

                  <div className="mt-8 space-y-7">
                    {locations.map((location, index) => (
                      <div
                        key={`${location.label}-${index}`}
                        className="flex items-center gap-5"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C64EC] text-white shadow-sm">
                          <MapPin className="h-[22px] w-[22px]" />
                        </div>
                        <div>
                          <p className="text-[16px] font-bold text-[#0B1B3A]">
                            {location.label}
                          </p>
                          <a
                            className="text-[15px] text-[#555555] hover:text-[#1C64EC] transition-colors"
                            href={location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {location.text}
                          </a>
                        </div>
                      </div>
                    ))}
                    
                    {phoneValue ? (
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C64EC] text-white shadow-sm">
                          <PhoneCall className="h-[22px] w-[22px]" />
                        </div>
                        <div>
                          {phoneLabel ? (
                            <p className="text-[16px] font-bold text-[#0B1B3A]">
                              {phoneLabel}
                            </p>
                          ) : null}
                          {phoneHref ? (
                            <a
                              href={phoneHref}
                              className="text-[15px] text-[#555555] hover:text-[#1C64EC] transition-colors"
                            >
                              {phoneValue}
                            </a>
                          ) : (
                            <p className="text-[15px] text-[#555555]">
                              {phoneValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {emailValue ? (
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C64EC] text-white shadow-sm">
                          <Mail className="h-[22px] w-[22px]" />
                        </div>
                        <div>
                          {emailLabel ? (
                            <p className="text-[16px] font-bold text-[#0B1B3A]">
                              {emailLabel}
                            </p>
                          ) : null}
                          {emailHref ? (
                            <a
                              href={emailHref}
                              className="text-[15px] text-[#555555] hover:text-[#1C64EC] transition-colors"
                            >
                              {emailValue}
                            </a>
                          ) : (
                            <p className="text-[15px] text-[#555555]">
                              {emailValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {hasContactForm ? (
                <div ref={formRef} className="sr-hidden sr-right text-[#0B1B3A]">
                  <div className="bg-white rounded-[24px] p-8 sm:p-12 shadow-sm border border-black/5">
                    {formBadge ? (
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#04B4D4] mb-2">
                        {formBadge}
                      </div>
                    ) : null}
                    {formHeading ? (
                      <h2 className="text-2xl sm:text-[32px] font-bold mb-8">
                        {formHeading}
                      </h2>
                    ) : null}
                    {formDescription ? (
                      <p className="mb-8 text-[15px] text-[#555555]">
                        {formDescription}
                      </p>
                    ) : null}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="flex flex-col">
                        {formNameLabel ? (
                          <label className="sr-only">
                            {formNameLabel}
                          </label>
                        ) : null}
                        <input
                          type="text"
                          name="name"
                          placeholder={formNamePlaceholder || "Name"}
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full border-b border-black/10 bg-transparent px-2 py-4 text-[15px] text-[#0B1B3A] placeholder:text-[#999999] focus:outline-none focus:border-[#1C64EC] transition-colors"
                        />
                      </div>
                      <div className="flex flex-col">
                        {formEmailLabel ? (
                          <label className="sr-only">
                            {formEmailLabel}
                          </label>
                        ) : null}
                        <input
                          type="email"
                          name="email"
                          placeholder={formEmailPlaceholder || "E-mail address"}
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full border-b border-black/10 bg-transparent px-2 py-4 text-[15px] text-[#0B1B3A] placeholder:text-[#999999] focus:outline-none focus:border-[#1C64EC] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col">
                        <textarea
                          rows={3}
                          name="message"
                          placeholder={formMessagePlaceholder || "Message"}
                          value={formData.message}
                          onChange={handleChange}
                          required
                          className="w-full border-b border-black/10 bg-transparent px-2 py-4 text-[15px] text-[#0B1B3A] placeholder:text-[#999999] focus:outline-none focus:border-[#1C64EC] transition-colors resize-none"
                        />
                      </div>
                      
                      <div className="pt-4 pb-2">
                        <p className="text-[12.5px] text-[#999999] leading-relaxed">
                          By submitting, you agree to the processing of your personal data by us as described in the Privacy Statement.
                        </p>
                      </div>

                      <RecaptchaField
                        ref={recaptchaRef}
                        onChange={(token) => setRecaptchaToken(token || "")}
                      />

                      <div className="mt-6 flex justify-end">
                        <Button
                          type="submit"
                          disabled={submitState.loading}
                          text={
                            submitState.loading
                              ? "Sending..."
                              : submitButtonText || "Submit"
                          }
                          className={submitState.loading ? "pointer-events-none opacity-70" : ""}
                        />
                      </div>

                      {submitState.error ? (
                        <p className="text-sm text-red-500 mt-4 text-right">
                          {submitState.error}
                        </p>
                      ) : null}
                      {submitState.success ? (
                        <p className="text-sm text-green-500 mt-4 text-right">
                          {submitState.success}
                        </p>
                      ) : null}
                    </form>
                  </div>
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
                    <div className="mb-3 flex items-center justify-center gap-2 text-[#1C64EC] font-semibold">
                      <MapPin className="h-4 w-4" />
                      {location.label}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-black/10">
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
        <div className="bg-white py-16 sm:py-20">
          <div
            ref={faqRef}
            className="sr-hidden sr-up mx-auto w-full max-w-[900px] px-6 md:px-10"
          >
            <div className="text-center mb-12">
              {faqHeading ? (
                <h2 className="text-3xl md:text-[36px] font-bold text-[#0B1B3A]">
                  {faqHeading}
                </h2>
              ) : null}
              {faqSubheading ? (
                <p className="mt-3 text-[#0B1B3A]/60">{faqSubheading}</p>
              ) : null}
            </div>

            {/* Accordion container with fixed border */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(14,112,196,0.15)",
              }}
            >
              {faqData.map((faq, idx) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={idx !== 0 ? "border-t border-black/10" : ""}
                  >
                    {/* Question row */}
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left group/faq"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`font-semibold text-[15px] pr-4 transition-colors duration-200 ${
                          isOpen ? "text-[#0E70C4]" : "text-[#0B1B3A]"
                        }`}
                      >
                        {faq.question}
                      </span>
                      {/* +/- toggle */}
                      <span
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors duration-200 ${
                          isOpen
                            ? "bg-[#0E70C4] text-white"
                            : "bg-transparent border border-black/20 text-[#0B1B3A]/60"
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
                        <p className="px-5 pb-5 text-[#0B1B3A]/70 text-[14.5px] leading-relaxed">
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
