import { useEffect, useState } from "react";
import { getCareerPage, updateCareerPage } from "../../api/careerApi";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/20 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wider text-white/55 block mb-1.5";
const SECTION_CLASS = "rounded-2xl border border-white/10 bg-[#0F2350] p-5 space-y-4";

const FIELDS = [
  { section: "Hero", items: [
    ["heroTitle", "hero_title", "Hero Title", "text"],
    ["breadcrumbLabel", "breadcrumb_label", "Breadcrumb Label", "text"],
  ]},
  { section: "Apply Online Form", items: [
    ["applyFormHeading", "apply_form_heading", "Form Heading", "text"],
    ["applyFormDescription", "apply_form_description", "Form Description", "textarea"],
    ["applyFormPrereqQuestion", "apply_form_prereq_question", "Prerequisite Question", "text"],
  ]},
  { section: "Join Our Team", items: [
    ["joinTeamHeading", "join_team_heading", "Heading", "text"],
    ["joinTeamParagraph1", "join_team_paragraph1", "Paragraph 1", "textarea"],
    ["joinTeamParagraph2", "join_team_paragraph2", "Paragraph 2", "textarea"],
  ]},
  { section: "General Interest Application", items: [
    ["generalInterestHeading", "general_interest_heading", "Card Heading", "text"],
    ["generalInterestDescription", "general_interest_description", "Card Description", "text"],
    ["cvEmail", "cv_email", "CV / Resume Email Target", "email"],
    ["cvEmailSubject", "cv_email_subject", "CV Email Subject", "text"],
    ["cvButtonText", "cv_button_text", "CV Button Text", "text"],
    ["linkedinUrl", "linkedin_url", "LinkedIn Profile URL", "text"],
    ["linkedinButtonText", "linkedin_button_text", "LinkedIn Button Text", "text"],
  ]},
  { section: "Newsletter Bar", items: [
    ["newsletterHeading", "newsletter_heading", "Heading", "text"],
    ["newsletterDescription", "newsletter_description", "Description", "textarea"],
  ]},
];

export default function CareerPageSettings() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCareerPage();
        const content = data?.data || data || {};
        const next = {};
        FIELDS.forEach((group) => {
          group.items.forEach(([key, column]) => {
            next[key] = content[column] || "";
          });
        });
        setValues(next);
      } catch (err) {
        console.error(err);
        setError("Failed to load career page settings.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateCareerPage(values);
      setMessage("Career page settings saved successfully.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/70">Loading career page settings...</p>;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Career Page Settings</h1>
        <p className="text-sm text-white/65">
          Edit the hero, form copy, and contact targets for the Careers & Internships page.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {FIELDS.map((group) => (
          <div key={group.section} className={SECTION_CLASS}>
            <h2 className="text-lg font-bold text-white">{group.section}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map(([key, , label, type]) => (
                <label key={key} className={type === "textarea" ? "md:col-span-2" : ""}>
                  <span className={LABEL_CLASS}>{label}</span>
                  {type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[key] || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={INPUT_CLASS}
                    />
                  ) : (
                    <input
                      type={type}
                      value={values[key] || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={INPUT_CLASS}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-rose-400 text-sm font-semibold">{error}</p>}
        {message && <p className="text-emerald-400 text-sm font-semibold">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#0E70C4] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </section>
  );
}
