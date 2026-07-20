import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSection,
  getSectionByKey,
  getSectionById,
  uploadSectionImage,
  updateSection,
} from "../../api/sectionApi";
import ImageUpload from "../../components/ImageUpload";
import { PRESET_KEYS } from "./sectionDefinitions";

const STRUCTURED_KEYS = new Set(PRESET_KEYS);
const INPUT_CLASS =
  "w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white";
const SUBSECTION_CLASS = "rounded-lg border border-white/12 p-4";

const getPageFromKey = (key) => String(key || "").split(".")[0] || "home";

const createDefaultContentByKey = (key) => {
  switch (key) {
    case "global.navbar":
      return {
        topBar: { liveLabel: "LIVE", badgeText: "IT", message: "" },
        logoUrl: "",
        navLinks: [{ name: "Home", href: "/", order: 1 }],
        cta: { text: "Get a Quote", to: "/contact" },
        whatsappHref: "",
        mobile: {
          locationText: "",
          locationHref: "",
          phone: "",
          phoneHref: "",
          email: "",
          emailHref: "",
          socials: [{ name: "Facebook", href: "" }],
        },
      };
    case "global.footer":
      return {
        brandDescription: "",
        itSolutionsTitle: "IT Solution",
        itSolutions: [{ name: "", href: "/services" }],
        itSolutionsSecondTitle: "IT Solution",
        itSolutionsSecond: [{ name: "", href: "/services" }],
        quickLinks: [{ name: "", href: "" }],
        socials: [{ name: "", href: "" }],
        locations: [{ text: "", href: "" }],
        openingHours: "",
        phone: "",
        phoneHref: "",
        policies: [{ name: "Privacy Policy", href: "/contact" }],
      };
    case "home.about":
      return {
        badge: "WHO WE ARE",
        heading: "",
        description: "",
        highlights: [""],
        buttonText: "",
        buttonTo: "",
      };
    case "about.whoWeAre":
      return {
        badge: "WHO WE ARE",
        heading: "",
        description: "",
        highlights: [""],
        mainImage: "",
        smallImage: "",
      };
    case "home.chooseUs":
      return {
        badge: "Why Choose Us",
        heading: "",
        featureCards: [{ iconKey: "icon1", title: "", description: "" }],
        progressBars: [{ label: "", value: 0 }],
        videoUrl: "",
      };
    case "home.faq":
      return {
        badge: "FAQ",
        heading: "",
        items: [{ id: 1, question: "", answer: "" }],
      };
    case "home.servicesHeader":
      return {
        badge: "SERVICES WE'RE OFFERING",
        heading: "",
      };
    case "home.caseStudiesHeader":
      return {
        badge: "From Our Case Studies",
        heading: "",
        ctaText: "View All Cases",
        ctaTo: "/projects",
      };
    case "home.inTouch":
      return {
        badge: "Get In Touch",
        heading: "",
        buttonText: "Get A Quote",
        buttonTo: "/contact",
      };
    case "about.stats":
      return {
        items: [
          { iconKey: "icon1", value: "300+", label: "Satisfied Clients" },
          { iconKey: "icon2", value: "1000+", label: "Finished Projects" },
          { iconKey: "icon3", value: "60+", label: "Skilled Experts" },
          { iconKey: "icon4", value: "1000+", label: "Media Posts" },
        ],
      };
    case "contact.supportChannels":
      return {
        introBadge: "We're Here to Help",
        introHeading: "",
        introDescription: "",
        channels: [
          {
            icon: "PhoneCall",
            title: "",
            description: "",
            value: "",
            href: "",
            color: "#3c72fc",
          },
        ],
      };
    case "contact.supportHours":
      return {
        title: "Support Hours",
        rows: [{ label: "", value: "" }],
      };
    case "contact.faq":
      return {
        heading: "Frequently Asked Questions",
        subheading: "",
        items: [{ id: 1, question: "", answer: "" }],
      };
    case "contact.main":
      return {
        infoTitle: "Contact Information",
        infoSubtitle: "Let's Collaborate with Us!",
        phoneLabel: "Call Us 7/24",
        phoneValue: "",
        phoneHref: "",
        emailLabel: "Make a Quote",
        emailValue: "",
        emailHref: "",
        locations: [
          { label: "Location", text: "", href: "" },
          { label: "Dubai Office", text: "", href: "" },
        ],
        formBadge: "Get In Touch",
        formHeading: "",
        formDescription: "",
        formNameLabel: "Your Name*",
        formNamePlaceholder: "Your Name",
        formEmailLabel: "Your Email*",
        formEmailPlaceholder: "Your Email",
        formMessageLabel: "Write Message*",
        formMessagePlaceholder: "Write Message",
        submitButtonText: "Send Message",
      };
    case "career.info":
      return {
        heroBadge: "Applications Open",
        statusBadge: "Join Swift Sign IT",
        title: "Cybersecurity & IT Associates Program",
        description: "Kickstart your technical career with our intensive learning pathway. We bridge the gap between academic knowledge and real-world business demands through structured mentorship.",
        duration: "3-Month Program",
        prerequisite: "Basic IT & Networking",
        whoCanApply: [
          "Undergraduates & Graduates",
          "Computer Science & IT Students",
          "Aspiring Security Professionals"
        ],
        whyChoose: [
          "Industry-aligned Curriculum",
          "Hands-on Sandbox Environment",
          "Placement Assistance & Referrals"
        ]
      };
    case "career.modules":
      return {
        modules: [
          { num: "1", title: "IT Infrastructure & Support", desc: "Master hardware, operating systems (Windows/Linux hardening), network protocols, and troubleshooting workflows." },
          { num: "2", title: "Full-Stack Web Technologies", desc: "Build modern, responsive web architectures using HTML, CSS, JavaScript, and advanced framework concepts." },
          { num: "3", title: "Cybersecurity Fundamentals", desc: "Learn network security, encryption standards, PKI infrastructure, and vulnerability assessment methodologies." },
          { num: "4", title: "App Development & UI/UX", desc: "Design elegant user interfaces and implement robust application logic using modern software design patterns." },
          { num: "5", title: "Security Operations & GRC", desc: "Understand Security Operations Center (SOC) flows, log monitoring, and Governance, Risk & Compliance standards." },
          { num: "6", title: "Capstone & Real-World Lab", desc: "Collaborate in teams on cross-functional business projects, staging environments, and production deployments." }
        ]
      };
    case "career.team":
      return {
        formTitle: "Apply Online",
        formSubtitle: "Submit your application to reserve a slot. Our admissions committee will review your profile within 48 hours.",
        formPrereqQuestion: "Do you have basic IT/Programming knowledge?",
        teamTitle: "Join Our Team",
        teamDesc: "Looking for a full-time career? We are always on the lookout for passion-driven cybersecurity analysts, systems engineers, full-stack developers, and technology consultants who want to make an impact.",
        teamSub: "Even if we don't have an active opening matching your profile, drop your credentials to get pre-evaluated for future roles in our global tech hubs.",
        teamEmailSubject: "Job Application",
        newsTitle: "Stay updated with Swift Sign IT",
        newsSub: "Subscribe to receive program launch alerts, cyber insights, and internship announcements."
      };
    default:
      return { title: "", description: "" };
  }
};

const toPrettyJson = (value) => JSON.stringify(value ?? {}, null, 2);

const getTextValue = (value) =>
  value === undefined || value === null ? "" : String(value);

const resolveUploadedAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiRoot = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");

  if (raw.startsWith("/uploads/")) return apiRoot + raw;
  if (/^uploads\//i.test(raw)) return apiRoot + "/" + raw;
  return raw;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(file);
  });

const TextInput = ({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) => (
  <div>
    <label className="mb-1 block text-sm text-white/80">{label}</label>
    <input
      type={type}
      value={getTextValue(value)}
      placeholder={placeholder}
      onChange={(event) =>
        onChange(
          type === "number" ? Number(event.target.value) : event.target.value,
        )
      }
      className={INPUT_CLASS}
    />
  </div>
);

const TextAreaInput = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder = "",
}) => (
  <div>
    <label className="mb-1 block text-sm text-white/80">{label}</label>
    <textarea
      rows={rows}
      value={getTextValue(value)}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT_CLASS}
    />
  </div>
);

const StringListEditor = ({
  label,
  values,
  onChange,
  placeholder = "Value",
}) => {
  const list = Array.isArray(values) ? values : [];

  const updateItem = (index, nextValue) => {
    const updated = [...list];
    updated[index] = nextValue;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white/80">{label}</p>
      {list.map((item, index) => (
        <div key={`${label}-${index}`} className="flex gap-2">
          <input
            value={getTextValue(item)}
            placeholder={placeholder}
            onChange={(event) => updateItem(index, event.target.value)}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() =>
              onChange(list.filter((_, rowIndex) => rowIndex !== index))
            }
            className="admin-modern-btn-danger px-3 py-2"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, ""])}
        className="admin-modern-btn-secondary px-3 py-2 text-sm"
      >
        + Add
      </button>
    </div>
  );
};

const ObjectListEditor = ({ title, items, fields, createItem, onChange }) => {
  const list = Array.isArray(items) ? items : [];

  const updateField = (index, fieldKey, value, type) => {
    const updated = [...list];
    updated[index] = {
      ...updated[index],
      [fieldKey]: type === "number" ? Number(value) : value,
    };
    onChange(updated);
  };

  return (
    <section className={SUBSECTION_CLASS}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...list, createItem()])}
          className="admin-modern-btn-secondary px-3 py-2 text-sm"
        >
          + Add {title.endsWith("s") ? title.slice(0, -1) : "Item"}
        </button>
      </div>

      <div className="space-y-3">
        {list.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-lg border border-white/12 p-3"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) =>
                field.type === "textarea" ? (
                  <div key={field.key} className="md:col-span-2">
                    <TextAreaInput
                      label={field.label}
                      value={item?.[field.key]}
                      rows={field.rows || 3}
                      placeholder={field.placeholder || ""}
                      onChange={(value) =>
                        updateField(index, field.key, value, field.type)
                      }
                    />
                  </div>
                ) : (
                  <TextInput
                    key={field.key}
                    type={field.type || "text"}
                    label={field.label}
                    value={item?.[field.key]}
                    placeholder={field.placeholder || ""}
                    onChange={(value) =>
                      updateField(index, field.key, value, field.type)
                    }
                  />
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                onChange(list.filter((_, rowIndex) => rowIndex !== index))
              }
              className="mt-3 admin-modern-btn-danger px-3 py-2"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-white/55">
          No {title.toLowerCase()} added yet.
        </p>
      ) : null}
    </section>
  );
};

const SectionContentEditor = ({
  sectionKey,
  content,
  setContent,
  onUploadNavbarLogo,
  isUploadingNavbarLogo,
  navbarLogoUploadError,
}) => {
  const data = content || {};
  if (sectionKey === "career.info") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <h4 className="text-md font-bold mb-3 text-white/90">Info Block Copy</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Hero Badge"
              value={data.heroBadge}
              onChange={(value) => setContent({ ...data, heroBadge: value })}
            />
            <TextInput
              label="Status Badge"
              value={data.statusBadge}
              onChange={(value) => setContent({ ...data, statusBadge: value })}
            />
            <div className="md:col-span-2">
              <TextInput
                label="Program Title"
                value={data.title}
                onChange={(value) => setContent({ ...data, title: value })}
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaInput
                label="Program Description"
                value={data.description}
                rows={4}
                onChange={(value) => setContent({ ...data, description: value })}
              />
            </div>
            <TextInput
              label="Duration Info"
              value={data.duration}
              onChange={(value) => setContent({ ...data, duration: value })}
            />
            <TextInput
              label="Prerequisite Info"
              value={data.prerequisite}
              onChange={(value) => setContent({ ...data, prerequisite: value })}
            />
          </div>
        </section>

        <StringListEditor
          label="Who Can Apply"
          values={data.whoCanApply}
          onChange={(whoCanApply) => setContent({ ...data, whoCanApply })}
          placeholder="Audience target"
        />
        <StringListEditor
          label="Why Choose This Section"
          values={data.whyChoose}
          onChange={(whyChoose) => setContent({ ...data, whyChoose })}
          placeholder="Benefit highlight"
        />
      </div>
    );
  }

  if (sectionKey === "career.modules") {
    return (
      <div className="space-y-4">
        <ObjectListEditor
          title="Program Modules"
          items={data.modules}
          onChange={(modules) => setContent({ ...data, modules })}
          createItem={() => ({ num: "", title: "", desc: "" })}
          fields={[
            { key: "num", label: "Badge/Number (e.g. 1)" },
            { key: "title", label: "Module Title" },
            { key: "desc", label: "Module Description", type: "textarea", rows: 3 }
          ]}
        />
      </div>
    );
  }

  if (sectionKey === "career.team") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <h4 className="text-md font-bold mb-3 text-white/90">Registration Form & Focus Area</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Form Title"
              value={data.formTitle}
              onChange={(value) => setContent({ ...data, formTitle: value })}
            />
            <TextInput
              label="Prerequisite Question"
              value={data.formPrereqQuestion}
              onChange={(value) => setContent({ ...data, formPrereqQuestion: value })}
            />
            <div className="md:col-span-2">
              <TextAreaInput
                label="Form Subtitle"
                value={data.formSubtitle}
                rows={3}
                onChange={(value) => setContent({ ...data, formSubtitle: value })}
              />
            </div>
          </div>
        </section>

        <section className={SUBSECTION_CLASS}>
          <h4 className="text-md font-bold mb-3 text-white/90">Join Our Team Section</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Section Title"
              value={data.teamTitle}
              onChange={(value) => setContent({ ...data, teamTitle: value })}
            />
            <TextInput
              label="Email Subject for CV Submit"
              value={data.teamEmailSubject}
              onChange={(value) => setContent({ ...data, teamEmailSubject: value })}
            />
            <div className="md:col-span-2">
              <TextAreaInput
                label="Section Description"
                value={data.teamDesc}
                rows={3}
                onChange={(value) => setContent({ ...data, teamDesc: value })}
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaInput
                label="Sub-info / Alternate CTA text"
                value={data.teamSub}
                rows={3}
                onChange={(value) => setContent({ ...data, teamSub: value })}
              />
            </div>
          </div>
        </section>

        <section className={SUBSECTION_CLASS}>
          <h4 className="text-md font-bold mb-3 text-white/90">Newsletter Section</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Newsletter Title"
              value={data.newsTitle}
              onChange={(value) => setContent({ ...data, newsTitle: value })}
            />
            <div className="md:col-span-2">
              <TextAreaInput
                label="Newsletter Subtitle"
                value={data.newsSub}
                rows={3}
                onChange={(value) => setContent({ ...data, newsSub: value })}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (sectionKey === "contact.supportHours") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <TextInput
            label="Section Title"
            value={data.title}
            onChange={(value) => setContent({ ...data, title: value })}
          />
        </section>
        <ObjectListEditor
          title="Rows"
          items={data.rows}
          onChange={(rows) => setContent({ ...data, rows })}
          createItem={() => ({ label: "", value: "" })}
          fields={[
            { key: "label", label: "Label" },
            { key: "value", label: "Value" },
          ]}
        />
      </div>
    );
  }

  if (sectionKey === "contact.supportChannels") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Intro Badge"
              value={data.introBadge}
              onChange={(value) => setContent({ ...data, introBadge: value })}
            />
            <TextInput
              label="Intro Heading"
              value={data.introHeading}
              onChange={(value) => setContent({ ...data, introHeading: value })}
            />
          </div>
          <TextAreaInput
            label="Intro Description"
            value={data.introDescription}
            onChange={(value) =>
              setContent({ ...data, introDescription: value })
            }
          />
        </section>
        <ObjectListEditor
          title="Channels"
          items={data.channels}
          onChange={(channels) => setContent({ ...data, channels })}
          createItem={() => ({
            icon: "PhoneCall",
            title: "",
            description: "",
            value: "",
            href: "",
            color: "#3c72fc",
          })}
          fields={[
            { key: "icon", label: "Icon (PhoneCall / MessageCircle / Mail)" },
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
            { key: "value", label: "Display Value" },
            { key: "href", label: "Link (tel:/mailto:/https://)" },
          ]}
        />
      </div>
    );
  }

  if (sectionKey === "contact.faq") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
            <TextInput
              label="Subheading"
              value={data.subheading}
              onChange={(value) => setContent({ ...data, subheading: value })}
            />
          </div>
        </section>
        <ObjectListEditor
          title="Items"
          items={data.items}
          onChange={(items) =>
            setContent({
              ...data,
              items: items.map((item, index) => ({
                ...item,
                id: Number(item?.id || index + 1),
              })),
            })
          }
          createItem={() => ({
            id: (Array.isArray(data.items) ? data.items.length : 0) + 1,
            question: "",
            answer: "",
          })}
          fields={[
            { key: "id", label: "ID", type: "number" },
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer", type: "textarea", rows: 4 },
          ]}
        />
      </div>
    );
  }

  if (sectionKey === "home.about") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
          <TextAreaInput
            label="Description"
            value={data.description}
            rows={5}
            onChange={(value) => setContent({ ...data, description: value })}
          />
        </section>
        <StringListEditor
          label="Highlights"
          values={data.highlights}
          onChange={(highlights) => setContent({ ...data, highlights })}
          placeholder="Highlight"
        />
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Button Text"
              value={data.buttonText}
              onChange={(value) => setContent({ ...data, buttonText: value })}
            />
            <TextInput
              label="Button Link"
              value={data.buttonTo}
              onChange={(value) => setContent({ ...data, buttonTo: value })}
            />
          </div>
        </section>
      </div>
    );
  }

  if (sectionKey === "about.whoWeAre") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
          <TextAreaInput
            label="Description"
            value={data.description}
            rows={5}
            onChange={(value) => setContent({ ...data, description: value })}
          />
        </section>
        <StringListEditor
          label="Highlights"
          values={data.highlights}
          onChange={(highlights) => setContent({ ...data, highlights })}
          placeholder="Highlight"
        />
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ImageUpload
              value={resolveUploadedAssetUrl(data.mainImage)}
              onFileSelect={async (file) => {
                if (typeof onUploadNavbarLogo !== "function") return;

                const uploadedPath = await onUploadNavbarLogo(file);
                if (!uploadedPath) return;

                setContent({ ...data, mainImage: uploadedPath });
              }}
              label={
                isUploadingNavbarLogo
                  ? "Uploading Main Image..."
                  : "Upload Main Image"
              }
              helperText="Auto-uploads to backend uploads and stores returned path"
            />
            <ImageUpload
              value={resolveUploadedAssetUrl(data.smallImage)}
              onFileSelect={async (file) => {
                if (typeof onUploadNavbarLogo !== "function") return;

                const uploadedPath = await onUploadNavbarLogo(file);
                if (!uploadedPath) return;

                setContent({ ...data, smallImage: uploadedPath });
              }}
              label={
                isUploadingNavbarLogo
                  ? "Uploading Small Image..."
                  : "Upload Small Image"
              }
              helperText="Auto-uploads to backend uploads and stores returned path"
            />
          </div>
          {navbarLogoUploadError ? (
            <p className="mt-2 text-sm text-red-300">{navbarLogoUploadError}</p>
          ) : null}
        </section>
      </div>
    );
  }

  if (sectionKey === "home.chooseUs") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
        </section>
        <ObjectListEditor
          title="Feature Cards"
          items={data.featureCards}
          onChange={(featureCards) => setContent({ ...data, featureCards })}
          createItem={() => ({ iconKey: "icon1", title: "", description: "" })}
          fields={[
            { key: "iconKey", label: "Icon Key (icon1 / icon2)" },
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
          ]}
        />
        <ObjectListEditor
          title="Progress Bars"
          items={data.progressBars}
          onChange={(progressBars) => setContent({ ...data, progressBars })}
          createItem={() => ({ label: "", value: 0 })}
          fields={[
            { key: "label", label: "Label" },
            { key: "value", label: "Value (%)", type: "number" },
          ]}
        />
        <section className={SUBSECTION_CLASS}>
          <TextInput
            label="Video URL"
            value={data.videoUrl}
            onChange={(value) => setContent({ ...data, videoUrl: value })}
          />
        </section>
      </div>
    );
  }

  if (sectionKey === "home.faq") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
        </section>
        <ObjectListEditor
          title="Items"
          items={data.items}
          onChange={(items) =>
            setContent({
              ...data,
              items: items.map((item, index) => ({
                ...item,
                id: Number(item?.id || index + 1),
              })),
            })
          }
          createItem={() => ({
            id: (Array.isArray(data.items) ? data.items.length : 0) + 1,
            question: "",
            answer: "",
          })}
          fields={[
            { key: "id", label: "ID", type: "number" },
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer", type: "textarea", rows: 4 },
          ]}
        />
      </div>
    );
  }

  if (sectionKey === "home.servicesHeader") {
    return (
      <section className={SUBSECTION_CLASS}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInput
            label="Badge"
            value={data.badge}
            onChange={(value) => setContent({ ...data, badge: value })}
          />
          <TextInput
            label="Heading"
            value={data.heading}
            onChange={(value) => setContent({ ...data, heading: value })}
          />
        </div>
      </section>
    );
  }

  if (sectionKey === "home.caseStudiesHeader") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
        </section>
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="CTA Text"
              value={data.ctaText}
              onChange={(value) => setContent({ ...data, ctaText: value })}
            />
            <TextInput
              label="CTA Link"
              value={data.ctaTo}
              onChange={(value) => setContent({ ...data, ctaTo: value })}
            />
          </div>
        </section>
      </div>
    );
  }

  if (sectionKey === "home.inTouch") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Badge"
              value={data.badge}
              onChange={(value) => setContent({ ...data, badge: value })}
            />
            <TextInput
              label="Heading"
              value={data.heading}
              onChange={(value) => setContent({ ...data, heading: value })}
            />
          </div>
        </section>
        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Button Text"
              value={data.buttonText}
              onChange={(value) => setContent({ ...data, buttonText: value })}
            />
            <TextInput
              label="Button Link"
              value={data.buttonTo}
              onChange={(value) => setContent({ ...data, buttonTo: value })}
            />
          </div>
        </section>
      </div>
    );
  }

  if (sectionKey === "about.stats") {
    return (
      <ObjectListEditor
        title="Stats"
        items={data.items}
        onChange={(items) => setContent({ ...data, items })}
        createItem={() => ({ iconKey: "icon1", value: "", label: "" })}
        fields={[
          { key: "iconKey", label: "Icon Key (icon1 / icon2 / icon3 / icon4)" },
          { key: "value", label: "Value (e.g. 300+)" },
          { key: "label", label: "Label" },
        ]}
      />
    );
  }

  if (sectionKey === "contact.main") {
    return (
      <div className="space-y-4">
        <section className={SUBSECTION_CLASS}>
          <p className="mb-3 text-sm font-medium text-white/85">Info Card</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Info Title"
              value={data.infoTitle}
              onChange={(value) => setContent({ ...data, infoTitle: value })}
            />
            <TextInput
              label="Info Subtitle"
              value={data.infoSubtitle}
              onChange={(value) => setContent({ ...data, infoSubtitle: value })}
            />
            <TextInput
              label="Phone Label"
              value={data.phoneLabel}
              onChange={(value) => setContent({ ...data, phoneLabel: value })}
            />
            <TextInput
              label="Phone Value"
              value={data.phoneValue}
              onChange={(value) => setContent({ ...data, phoneValue: value })}
            />
            <TextInput
              label="Phone Link"
              value={data.phoneHref}
              onChange={(value) => setContent({ ...data, phoneHref: value })}
            />
            <TextInput
              label="Email Label"
              value={data.emailLabel}
              onChange={(value) => setContent({ ...data, emailLabel: value })}
            />
            <TextInput
              label="Email Value"
              value={data.emailValue}
              onChange={(value) => setContent({ ...data, emailValue: value })}
            />
            <TextInput
              label="Email Link"
              value={data.emailHref}
              onChange={(value) => setContent({ ...data, emailHref: value })}
            />
          </div>
        </section>

        <ObjectListEditor
          title="Locations"
          items={data.locations}
          onChange={(locations) => setContent({ ...data, locations })}
          createItem={() => ({ label: "", text: "", href: "" })}
          fields={[
            { key: "label", label: "Label" },
            { key: "text", label: "Address Text", type: "textarea", rows: 3 },
            { key: "href", label: "Map Link" },
          ]}
        />

        <section className={SUBSECTION_CLASS}>
          <p className="mb-3 text-sm font-medium text-white/85">Form Content</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Form Badge"
              value={data.formBadge}
              onChange={(value) => setContent({ ...data, formBadge: value })}
            />
            <TextInput
              label="Form Heading"
              value={data.formHeading}
              onChange={(value) => setContent({ ...data, formHeading: value })}
            />
            <TextInput
              label="Name Label"
              value={data.formNameLabel}
              onChange={(value) =>
                setContent({ ...data, formNameLabel: value })
              }
            />
            <TextInput
              label="Name Placeholder"
              value={data.formNamePlaceholder}
              onChange={(value) =>
                setContent({ ...data, formNamePlaceholder: value })
              }
            />
            <TextInput
              label="Email Label"
              value={data.formEmailLabel}
              onChange={(value) =>
                setContent({ ...data, formEmailLabel: value })
              }
            />
            <TextInput
              label="Email Placeholder"
              value={data.formEmailPlaceholder}
              onChange={(value) =>
                setContent({ ...data, formEmailPlaceholder: value })
              }
            />
            <TextInput
              label="Message Label"
              value={data.formMessageLabel}
              onChange={(value) =>
                setContent({ ...data, formMessageLabel: value })
              }
            />
            <TextInput
              label="Message Placeholder"
              value={data.formMessagePlaceholder}
              onChange={(value) =>
                setContent({ ...data, formMessagePlaceholder: value })
              }
            />
            <TextInput
              label="Submit Button Text"
              value={data.submitButtonText}
              onChange={(value) =>
                setContent({ ...data, submitButtonText: value })
              }
            />
          </div>
          <TextAreaInput
            label="Form Description"
            value={data.formDescription}
            onChange={(value) =>
              setContent({ ...data, formDescription: value })
            }
          />
        </section>
      </div>
    );
  }

  if (sectionKey === "global.navbar") {
    const topBar = data.topBar || {};
    const cta = data.cta || {};
    const mobile = data.mobile || {};

    return (
      <div className="space-y-5">
        <section className={SUBSECTION_CLASS}>
          <p className="text-sm font-medium text-white/80">Top Bar</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              label="Live Label"
              value={topBar.liveLabel}
              onChange={(value) =>
                setContent({ ...data, topBar: { ...topBar, liveLabel: value } })
              }
            />
            <TextInput
              label="Badge Text"
              value={topBar.badgeText}
              onChange={(value) =>
                setContent({ ...data, topBar: { ...topBar, badgeText: value } })
              }
            />
          </div>
          <TextAreaInput
            label="Marquee Message"
            value={topBar.message}
            onChange={(value) =>
              setContent({ ...data, topBar: { ...topBar, message: value } })
            }
          />
          <div className="mt-3">
            <ImageUpload
              value={resolveUploadedAssetUrl(data.logoUrl)}
              onFileSelect={async (file) => {
                if (typeof onUploadNavbarLogo !== "function") return;

                const uploadedPath = await onUploadNavbarLogo(file);
                if (!uploadedPath) return;

                setContent({ ...data, logoUrl: uploadedPath });
              }}
              label={
                isUploadingNavbarLogo
                  ? "Uploading Navbar Logo..."
                  : "Upload Navbar Logo"
              }
              helperText="Auto-uploads to /uploads/... (fallback: inline image if endpoint unavailable)"
            />
            <div className="mt-3">
              <TextInput
                label="Logo URL / Path"
                value={data.logoUrl}
                placeholder="https://... or /uploads/logo.png"
                onChange={(value) => setContent({ ...data, logoUrl: value })}
              />
            </div>
            {navbarLogoUploadError ? (
              <p className="mt-2 text-sm text-red-300">
                {navbarLogoUploadError}
              </p>
            ) : null}
          </div>
        </section>

        <ObjectListEditor
          title="Nav Links"
          items={data.navLinks}
          onChange={(navLinks) => setContent({ ...data, navLinks })}
          createItem={() => ({
            name: "",
            href: "",
            order:
              (Array.isArray(data.navLinks) ? data.navLinks.length : 0) + 1,
          })}
          fields={[
            { key: "name", label: "Name" },
            { key: "href", label: "Href" },
            { key: "order", label: "Order", type: "number" },
          ]}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label="CTA Text"
            value={cta.text}
            onChange={(value) =>
              setContent({ ...data, cta: { ...cta, text: value } })
            }
          />
          <TextInput
            label="CTA Link"
            value={cta.to}
            onChange={(value) =>
              setContent({ ...data, cta: { ...cta, to: value } })
            }
          />
        </div>

        <TextInput
          label="WhatsApp URL"
          value={data.whatsappHref}
          onChange={(value) => setContent({ ...data, whatsappHref: value })}
        />

        <section className={SUBSECTION_CLASS}>
          <p className="text-sm font-medium text-white/80">Mobile Contact</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              label="Location Text"
              value={mobile.locationText}
              onChange={(value) =>
                setContent({
                  ...data,
                  mobile: { ...mobile, locationText: value },
                })
              }
            />
            <TextInput
              label="Location Link"
              value={mobile.locationHref}
              onChange={(value) =>
                setContent({
                  ...data,
                  mobile: { ...mobile, locationHref: value },
                })
              }
            />
            <TextInput
              label="Phone"
              value={mobile.phone}
              onChange={(value) =>
                setContent({ ...data, mobile: { ...mobile, phone: value } })
              }
            />
            <TextInput
              label="Phone Link"
              value={mobile.phoneHref}
              onChange={(value) =>
                setContent({ ...data, mobile: { ...mobile, phoneHref: value } })
              }
            />
            <TextInput
              label="Email"
              value={mobile.email}
              onChange={(value) =>
                setContent({ ...data, mobile: { ...mobile, email: value } })
              }
            />
            <TextInput
              label="Email Link"
              value={mobile.emailHref}
              onChange={(value) =>
                setContent({ ...data, mobile: { ...mobile, emailHref: value } })
              }
            />
          </div>
          <ObjectListEditor
            title="Socials"
            items={mobile.socials}
            onChange={(socials) =>
              setContent({ ...data, mobile: { ...mobile, socials } })
            }
            createItem={() => ({ name: "", href: "" })}
            fields={[
              { key: "name", label: "Name" },
              { key: "href", label: "Href" },
            ]}
          />
        </section>
      </div>
    );
  }

  if (sectionKey === "global.footer") {
    const normalizedItSolutions = Array.isArray(data.itSolutions)
      ? data.itSolutions
          .map((item) => {
            if (typeof item === "string") {
              return { name: item, href: "/services" };
            }

            if (item && typeof item === "object") {
              return {
                name: getTextValue(item.name),
                href: getTextValue(item.href || "/services"),
              };
            }

            return null;
          })
          .filter(Boolean)
      : [];
    const normalizedItSolutionsSecond = Array.isArray(data.itSolutionsSecond)
      ? data.itSolutionsSecond
          .map((item) => {
            if (typeof item === "string") {
              return { name: item, href: "/services" };
            }

            if (item && typeof item === "object") {
              return {
                name: getTextValue(item.name),
                href: getTextValue(item.href || "/services"),
              };
            }

            return null;
          })
          .filter(Boolean)
      : [];

    return (
      <div className="space-y-4">
        
        <section className={SUBSECTION_CLASS}>
          <TextAreaInput
            label="Brand Description"
            rows={5}
            value={data.brandDescription}
            onChange={(value) =>
              setContent({ ...data, brandDescription: value })
            }
          />
        </section>
        <section className={SUBSECTION_CLASS}>
          <TextInput
            label="First Column Title"
            value={data.itSolutionsTitle}
            onChange={(value) =>
              setContent({ ...data, itSolutionsTitle: value })
            }
          />
        </section>

        <ObjectListEditor
          title="IT Solutions"
          items={normalizedItSolutions}
          onChange={(itSolutions) => setContent({ ...data, itSolutions })}
          createItem={() => ({ name: "", href: "/services" })}
          fields={[
            { key: "name", label: "Service Name" },
            {
              key: "href",
              label: "Link (e.g. /services or https://example.com)",
            },
          ]}
        />
        

        

        <section className={SUBSECTION_CLASS}>
          <TextInput
            label="Second Column Title"
            value={data.itSolutionsSecondTitle}
            onChange={(value) =>
              setContent({ ...data, itSolutionsSecondTitle: value })
            }
          />
        </section>

        <ObjectListEditor
          title="IT Solutions (Second Column)"
          items={normalizedItSolutionsSecond}
          onChange={(itSolutionsSecond) =>
            setContent({ ...data, itSolutionsSecond })
          }
          createItem={() => ({ name: "", href: "/services" })}
          fields={[
            { key: "name", label: "Service Name" },
            {
              key: "href",
              label: "Link (e.g. /services or https://example.com)",
            },
          ]}
        />

        <ObjectListEditor
          title="Quick Links"
          items={data.quickLinks}
          onChange={(quickLinks) => setContent({ ...data, quickLinks })}
          createItem={() => ({ name: "", href: "" })}
          fields={[
            { key: "name", label: "Name" },
            { key: "href", label: "Href" },
          ]}
        />

        <ObjectListEditor
          title="Socials"
          items={data.socials}
          onChange={(socials) => setContent({ ...data, socials })}
          createItem={() => ({ name: "", href: "" })}
          fields={[
            { key: "name", label: "Name" },
            { key: "href", label: "Href" },
          ]}
        />

        <ObjectListEditor
          title="Locations"
          items={data.locations}
          onChange={(locations) => setContent({ ...data, locations })}
          createItem={() => ({ text: "", href: "" })}
          fields={[
            { key: "text", label: "Text" },
            { key: "href", label: "Href" },
          ]}
        />

        <section className={SUBSECTION_CLASS}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label="Opening Hours"
              value={data.openingHours}
              onChange={(value) => setContent({ ...data, openingHours: value })}
            />
            <TextInput
              label="Phone"
              value={data.phone}
              onChange={(value) => setContent({ ...data, phone: value })}
            />
            <TextInput
              label="Phone Link"
              value={data.phoneHref}
              onChange={(value) => setContent({ ...data, phoneHref: value })}
            />
          </div>
        </section>

        <ObjectListEditor
          title="Policies"
          items={data.policies}
          onChange={(policies) => setContent({ ...data, policies })}
          createItem={() => ({ name: "", href: "" })}
          fields={[
            { key: "name", label: "Name" },
            { key: "href", label: "Href" },
          ]}
        />
      </div>
    );
  }

  return null;
};

export default function SectionForm({
  fixedKey = "",
  fixedTitle = "",
  cancelPath = "",
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const normalizedFixedKey = String(fixedKey || "").trim();

  const [resolvedId, setResolvedId] = useState("");
  const [loading, setLoading] = useState(Boolean(id || normalizedFixedKey));
  const [saving, setSaving] = useState(false);
  const [isUploadingNavbarLogo, setIsUploadingNavbarLogo] = useState(false);
  const [navbarLogoUploadError, setNavbarLogoUploadError] = useState("");
  const [error, setError] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef(null);

  const activeId = id || resolvedId;
  const isEditMode = Boolean(activeId);

  const initialKey = normalizedFixedKey || "";
  const initialPage = normalizedFixedKey
    ? getPageFromKey(normalizedFixedKey)
    : "home";
  const initialContent = createDefaultContentByKey(
    normalizedFixedKey || "home.about",
  );

  const [form, setForm] = useState({
    page: initialPage,
    key: initialKey,
    isActive: true,
    content: initialContent,
    contentRaw: toPrettyJson(initialContent),
  });

  useEffect(() => {
    setSuccess("");
    setError("");
    setJsonError("");
    setNavbarLogoUploadError("");
  }, [normalizedFixedKey, id]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getSectionById(id);
        setResolvedId(data?._id || "");
        setForm({
          page: data?.page || "home",
          key: data?.key || "",
          isActive: Boolean(data?.isActive ?? true),
          content: data?.content || {},
          contentRaw: toPrettyJson(data?.content || {}),
        });
      } catch (requestError) {
        console.error(requestError);
        setError("Failed to load section content.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!normalizedFixedKey || id) {
      if (!id) setLoading(false);
      return;
    }

    let isMounted = true;

    const loadByKey = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await getSectionByKey(normalizedFixedKey);
        if (!isMounted) return;

        if (!data?._id) {
          const defaultContent = createDefaultContentByKey(normalizedFixedKey);
          setResolvedId("");
          setForm({
            page: getPageFromKey(normalizedFixedKey),
            key: normalizedFixedKey,
            isActive: true,
            content: defaultContent,
            contentRaw: toPrettyJson(defaultContent),
          });
          return;
        }

        setResolvedId(data?._id || "");
        setForm({
          page: data?.page || getPageFromKey(normalizedFixedKey),
          key: data?.key || normalizedFixedKey,
          isActive: Boolean(data?.isActive ?? true),
          content:
            data?.content || createDefaultContentByKey(normalizedFixedKey),
          contentRaw: toPrettyJson(
            data?.content || createDefaultContentByKey(normalizedFixedKey),
          ),
        });
      } catch (requestError) {
        if (!isMounted) return;
        const statusCode = Number(requestError?.response?.status || 0);

        if (statusCode === 404) {
          const defaultContent = createDefaultContentByKey(normalizedFixedKey);
          setResolvedId("");
          setForm({
            page: getPageFromKey(normalizedFixedKey),
            key: normalizedFixedKey,
            isActive: true,
            content: defaultContent,
            contentRaw: toPrettyJson(defaultContent),
          });
        } else {
          console.error(requestError);
          setError("Failed to load section content.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadByKey();

    return () => {
      isMounted = false;
    };
  }, [normalizedFixedKey, id]);

  const keySuggestions = useMemo(
    () => PRESET_KEYS.filter((item) => item.startsWith(`${form.page}.`)),
    [form.page],
  );

  const setField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const setContent = (nextContent) => {
    setForm((previous) => ({
      ...previous,
      content: nextContent,
      contentRaw: toPrettyJson(nextContent),
    }));
  };

  const handleApplyPreset = (value) => {
    const pagePrefix = value.split(".")[0] || "home";
    const defaultContent = createDefaultContentByKey(value);

    setForm((previous) => ({
      ...previous,
      page: pagePrefix,
      key: value,
      content: isEditMode ? previous.content : defaultContent,
      contentRaw: toPrettyJson(isEditMode ? previous.content : defaultContent),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setJsonError("");
    setSuccess("");

    if (isUploadingNavbarLogo) {
      setError("Wait for logo upload to finish before saving.");
      return;
    }

    const normalizedPage = String(form.page || "")
      .trim()
      .toLowerCase();
    const normalizedKey = normalizedFixedKey || String(form.key || "").trim();
    const isStructuredKey = STRUCTURED_KEYS.has(normalizedKey);

    let parsedContent = form.content;
    if (!isStructuredKey) {
      try {
        parsedContent = JSON.parse(form.contentRaw);
      } catch {
        setJsonError("Invalid JSON. Fix the content JSON before saving.");
        return;
      }
    }

    if (!normalizedPage) {
      setError("Page is required.");
      return;
    }

    if (!normalizedKey) {
      setError("Key is required.");
      return;
    }

    if (!normalizedKey.includes(".")) {
      setError("Key should include page prefix, e.g. home.about.");
      return;
    }

    const payload = {
      page: normalizedPage,
      key: normalizedKey,
      isActive: Boolean(form.isActive),
      content: parsedContent,
    };

    try {
      setSaving(true);
      if (isEditMode) {
        await updateSection(activeId, payload);
      } else {
        const { data } = await createSection(payload);
        if (normalizedFixedKey) {
          setResolvedId(data?._id || "");
        }
      }

      if (normalizedFixedKey) {
        setSuccess("Section saved successfully.");
      } else {
        navigate("/sections");
      }
    } catch (requestError) {
      console.error(requestError);
      const message =
        requestError?.response?.data?.message ||
        "Save failed. Please try again.";
      setError(String(message));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleSaveShortcut = (event) => {
      const isSaveKey =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveKey) return;

      event.preventDefault();
      if (loading || saving) return;

      formRef.current?.requestSubmit();
    };

    window.addEventListener("keydown", handleSaveShortcut);

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
    };
  }, [loading, saving]);

  const handleNavbarLogoUpload = async (file) => {
    if (!file) return "";

    setNavbarLogoUploadError("");

    try {
      setIsUploadingNavbarLogo(true);
      const { data } = await uploadSectionImage(file);
      const uploadedPath = String(data?.url || data?.path || "").trim();

      if (!uploadedPath) {
        throw new Error("Upload response missing file path.");
      }

      return uploadedPath;
    } catch (requestError) {
      const statusCode = Number(requestError?.response?.status || 0);

      if (statusCode === 404) {
        try {
          const inlineDataUrl = await fileToDataUrl(file);
          if (!inlineDataUrl) {
            throw new Error("Failed to create inline image data.");
          }

          setNavbarLogoUploadError("");
          setSuccess(
            "Upload route not found. Logo stored as inline image data.",
          );
          return inlineDataUrl;
        } catch (inlineError) {
          console.error(inlineError);
          setNavbarLogoUploadError(
            "Upload endpoint missing and inline fallback failed.",
          );
          return "";
        }
      }

      console.error(requestError);
      const message =
        requestError?.response?.data?.message ||
        "Logo upload failed. Please try again.";
      setNavbarLogoUploadError(String(message));
      return "";
    } finally {
      setIsUploadingNavbarLogo(false);
    }
  };

  if (loading) return <div className="text-white/70">Loading section...</div>;

  return (
    <section className="admin-modern-page mx-auto max-w-5xl">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h2 className="admin-modern-hero-title">
              {fixedTitle || (isEditMode ? "Edit Section" : "Add Section")}
            </h2>
            <p className="admin-modern-hero-subtitle">
              Control dynamic frontend content directly from admin dashboard.
            </p>
          </div>
        </div>
      </header>

      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="admin-modern-form admin-modern-panel"
      >
        {normalizedFixedKey ? (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/80">
                Section Key
              </label>
              <input value={form.key} readOnly className={INPUT_CLASS} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/80">Page</label>
              <select
                value={form.page}
                onChange={(event) => setField("page", event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white"
                required
              >
                <option value="global">global</option>
                <option value="home">home</option>
                <option value="contact">contact</option>
                <option value="about">about</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Key</label>
              <input
                value={form.key}
                onChange={(event) => {
                  const nextKey = event.target.value;
                  setField("key", nextKey);

                  if (!isEditMode && STRUCTURED_KEYS.has(nextKey.trim())) {
                    const defaultContent = createDefaultContentByKey(
                      nextKey.trim(),
                    );
                    setContent(defaultContent);
                  }
                }}
                placeholder="home.about"
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>
        )}

        {!normalizedFixedKey && keySuggestions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/55">
              Common keys for {form.page}
            </p>
            <div className="flex flex-wrap gap-2">
              {keySuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleApplyPreset(item)}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-white/85">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setField("isActive", event.target.checked)}
            className="h-4 w-4"
          />
          Active on frontend
        </label>

        {STRUCTURED_KEYS.has(form.key.trim()) ? (
          <div className="rounded-lg border border-white/12 p-4">
            <h3 className="mb-3 text-base font-semibold text-white">
              Section Content Inputs
            </h3>
            <SectionContentEditor
              sectionKey={form.key.trim()}
              content={form.content}
              setContent={setContent}
              onUploadNavbarLogo={handleNavbarLogoUpload}
              isUploadingNavbarLogo={isUploadingNavbarLogo}
              navbarLogoUploadError={navbarLogoUploadError}
            />
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-sm text-white/80">
                Content JSON (Fallback)
              </label>
            </div>
            <textarea
              rows={18}
              value={form.contentRaw}
              onChange={(event) => setField("contentRaw", event.target.value)}
              className={`${INPUT_CLASS} font-mono text-sm`}
              spellCheck={false}
            />
          </div>
        )}

        {jsonError ? <p className="text-sm text-red-300">{jsonError}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || isUploadingNavbarLogo}
            className="admin-modern-btn-primary px-5 py-2 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEditMode ? "Update" : "Create"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(cancelPath || (normalizedFixedKey ? "/" : "/sections"))
            }
            className="admin-modern-btn-secondary px-5 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
