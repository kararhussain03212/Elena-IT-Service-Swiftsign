import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../../components/ImageUpload";
import {
  createTeamMember,
  getTeamMember,
  updateTeamMember,
} from "../../api/teamApi";

const DEFAULT_SKILLS = [
  { name: "Skill A", value: 80 },
  { name: "Skill B", value: 70 },
];

const DEFAULT_EDUCATION = [{ degree: "Bachelor Degree", year: "2020" }];

const DEFAULT_SOCIAL_ACCOUNTS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
];

const createInitialSocialLinks = () => ({
  facebook: "",
  instagram: "",
  linkedin: "",
});

const createInitialSocialErrors = () => ({
  facebook: false,
  instagram: false,
  linkedin: false,
});

const parseSkillValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  // Accept legacy formats such as "85%" while keeping numeric bounds checks.
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
};

const isValidEducationYear = (value) => {
  const text = String(value ?? "").trim();
  if (!text) {
    return false;
  }

  if (/^\d{4}$/.test(text)) {
    return true;
  }

  if (/^(present|current|ongoing)$/i.test(text)) {
    return true;
  }

  return /^\d{4}\s*[-/]\s*(\d{4}|present|current|ongoing)$/i.test(text);
};

const normalizeSocialAccounts = (socialLinks) => {
  const output = createInitialSocialLinks();
  if (!socialLinks) {
    return output;
  }

  const mapKey = (value) => {
    const raw = String(value ?? "").trim().toLowerCase();
    if (!raw) return null;
    if (raw.includes("facebook")) return "facebook";
    if (raw.includes("instagram")) return "instagram";
    if (raw.includes("linkedin") || raw.includes("linkdin")) return "linkedin";
    return null;
  };

  if (typeof socialLinks === "object" && !Array.isArray(socialLinks)) {
    Object.entries(socialLinks).forEach(([platform, url]) => {
      const key = mapKey(platform);
      if (!key) return;
      output[key] = url === "#" ? "" : String(url || "");
    });
    return output;
  }

  if (Array.isArray(socialLinks)) {
    socialLinks.forEach((item) => {
      const key = mapKey(item?.name || item?.platform || item?.key || "");
      if (!key) return;
      const rawValue = String(item?.href || item?.url || item?.link || "");
      output[key] = rawValue === "#" ? "" : rawValue;
    });
  }

  return output;
};

const createInitialForm = () => ({
  name: "",
  slug: "",
  role: "",
  bio: "",
  imageAlt: "",
  order: 0,
  imageFile: null,
  imagePreview: "",
  skills: DEFAULT_SKILLS.map((skill) => ({
    name: skill.name || "",
    value: skill.value ?? "",
  })),
  education: DEFAULT_EDUCATION.map((item) => ({
    degree: item.degree || "",
    year: item.year || "",
  })),
  socialLinks: createInitialSocialLinks(),
});

export default function TeamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(createInitialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    skills: [],
    education: [],
    socialLinks: createInitialSocialErrors(),
  });

  // CHANGE: normalize API root once
  // WHY: existing image may be stored as filename or /uploads path
  const apiRoot = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || "";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setName = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      // CHANGE: auto-create slug in create mode
      // WHY: keeps slugs consistent and avoids manual mistakes
      slug: isEditMode ? prev.slug : slugify(value),
    }));
  };

  const updateSkill = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.skills];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, skills: next };
    });
    setFieldErrors((prev) => {
      if (!prev.skills?.[index]) return prev;
      const nextSkills = prev.skills.map((item, i) =>
        i === index ? { ...item, [key]: false } : item,
      );
      return { ...prev, skills: nextSkills };
    });
    setError("");
  };

  const addSkill = () => {
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "", value: "" }],
    }));
  };

  const removeSkill = (index) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
    setError("");
  };

  const updateEducation = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.education];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, education: next };
    });
    setFieldErrors((prev) => {
      if (!prev.education?.[index]) return prev;
      const nextEducation = prev.education.map((item, i) =>
        i === index ? { ...item, [key]: false } : item,
      );
      return { ...prev, education: nextEducation };
    });
    setError("");
  };

  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", year: "" }],
    }));
  };

  const updateSocialLink = (key, value) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
    setFieldErrors((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks ?? {}),
        [key]: false,
      },
    }));
    setError("");
  };

  const validateSocialLinks = (socialLinks) => {
    const nextErrors = createInitialSocialErrors();
    let hasError = false;

    DEFAULT_SOCIAL_ACCOUNTS.forEach(({ key }) => {
      const raw = String(socialLinks?.[key] ?? "").trim();
      if (!raw || raw === "#") {
        return;
      }

      try {
        const parsed = new URL(raw);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          nextErrors[key] = true;
          hasError = true;
        }
      } catch {
        nextErrors[key] = true;
        hasError = true;
      }
    });

    return { socialLinkErrors: nextErrors, hasError };
  };

  const removeEducation = (index) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
    setFieldErrors((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
    setError("");
  };

  const validateSkillsEducation = (skills, education) => {
    const skillErrors = skills.map(() => ({ name: false, value: false }));
    const educationErrors = education.map(() => ({
      degree: false,
      year: false,
    }));
    const cleanedSkills = [];
    const cleanedEducation = [];
    let hasError = false;

    skills.forEach((skill, index) => {
      const name = String(skill?.name ?? "").trim();
      const valueText = String(skill?.value ?? "").trim();
      // Skip completely empty rows (name AND value both empty)
      const isEmpty = !name && !valueText;
      if (isEmpty) return;
      // Skip rows where only value is missing — treat as incomplete, discard silently
      if (name && !valueText) return;

      let rowHasError = false;
      if (!name) {
        skillErrors[index].name = true;
        rowHasError = true;
      }

      const valueNum = parseSkillValue(valueText);
      if (
        valueNum === null ||
        valueNum < 0 ||
        valueNum > 100
      ) {
        skillErrors[index].value = true;
        rowHasError = true;
      }

      if (rowHasError) {
        hasError = true;
        return;
      }

      cleanedSkills.push({ name, value: valueNum });
    });

    education.forEach((item, index) => {
      const degree = String(item?.degree ?? "").trim();
      const yearText = String(item?.year ?? "").trim();
      const isEmpty = !degree && !yearText;
      if (isEmpty) return;

      let rowHasError = false;
      if (!degree) {
        educationErrors[index].degree = true;
        rowHasError = true;
      }

      if (yearText && !isValidEducationYear(yearText)) {
        educationErrors[index].year = true;
        rowHasError = true;
      }

      if (rowHasError) {
        hasError = true;
        return;
      }

      cleanedEducation.push({ degree, year: yearText });
    });

    return {
      cleanedSkills,
      cleanedEducation,
      skillErrors,
      educationErrors,
      hasError,
    };
  };

  useEffect(() => {
    if (!isEditMode) return;

    const loadMember = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getTeamMember(id);
        const member = response.data;

        const existingImage = member.image || "";
        const imagePreview = !existingImage
          ? ""
          : existingImage.startsWith("http")
            ? existingImage
            : existingImage.startsWith("/uploads/")
              ? apiRoot + existingImage
              : apiRoot + "/uploads/" + existingImage;

        const incomingSkills = Array.isArray(member.skills)
          ? member.skills
          : [];
        const incomingEducation = Array.isArray(member.education)
          ? member.education
          : [];

        setForm({
          name: member.name || "",
          slug: member.slug || "",
          role: member.role || "",
          bio: member.bio || "",
          imageAlt: member.imageAlt || "",
          order: Number(member.order || 0),
          imageFile: null,
          imagePreview,
          skills: incomingSkills.length
            ? incomingSkills.map((skill) => ({
                name: skill?.name || "",
                value: parseSkillValue(skill?.value) ?? "",
              }))
            : [{ name: "", value: "" }],
          education: incomingEducation.length
            ? incomingEducation.map((item) => ({
                degree: item?.degree || "",
                year: item?.year || "",
              }))
            : [{ degree: "", year: "" }],
          socialLinks: normalizeSocialAccounts(member.social_links ?? member.socialLinks),
        });
        setFieldErrors({
          skills: [],
          education: [],
          socialLinks: createInitialSocialErrors(),
        });
      } catch (err) {
        console.error("Team member load failed:", err);
        setError("Failed to load team member.");
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [id, isEditMode, apiRoot]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);

      const {
        cleanedSkills,
        cleanedEducation,
        skillErrors,
        educationErrors,
        hasError: hasSkillsEducationError,
      } = validateSkillsEducation(form.skills, form.education);

      const {
        socialLinkErrors,
        hasError: hasSocialLinksError,
      } = validateSocialLinks(form.socialLinks);

      setFieldErrors({
        skills: skillErrors,
        education: educationErrors,
        socialLinks: socialLinkErrors,
      });

      if (hasSkillsEducationError || hasSocialLinksError) {
        setError("Please fix the highlighted fields.");
        return;
      }

      const payload = new FormData();
      const normalizedSocialLinks = {
        facebook: String(form.socialLinks?.facebook ?? "").trim() || "#",
        instagram: String(form.socialLinks?.instagram ?? "").trim() || "#",
        linkedin: String(form.socialLinks?.linkedin ?? "").trim() || "#",
      };

      payload.append("name", form.name.trim());
      payload.append("slug", form.slug.trim());
      payload.append("role", form.role.trim());
      payload.append("bio", form.bio.trim());
      payload.append("imageAlt", form.imageAlt.trim());
      payload.append("order", String(form.order || 0));
      payload.append("skills", JSON.stringify(cleanedSkills));
      payload.append("education", JSON.stringify(cleanedEducation));
      payload.append("socialLinks", JSON.stringify(normalizedSocialLinks));

      if (form.imageFile) {
        payload.append("image", form.imageFile);
      }

      if (isEditMode) {
        await updateTeamMember(id, payload);
      } else {
        await createTeamMember(payload);
      }

      navigate("/team");
    } catch (err) {
      console.error("Team save failed:", err);
      setError(err.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-white/70">Loading member...</div>;
  }

  return (
    <section className="admin-modern-page mx-auto max-w-5xl">
      <header className="admin-modern-hero">
        <div className="admin-modern-hero-content">
          <div>
            <h2 className="admin-modern-hero-title">
              {isEditMode ? "Edit Team Member" : "Add Team Member"}
            </h2>
            <p className="admin-modern-hero-subtitle">
              Keep profile, skills, education, and social links in one clean
              editor.
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="admin-modern-form admin-modern-panel"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/80">Name</label>
            <input
              value={form.name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Role</label>
            <input
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setField("order", Number(e.target.value))}
              className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/80">Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
          />
        </div>

        <ImageUpload
          value={form.imagePreview}
          onFileSelect={(file) => setField("imageFile", file)}
          label="Upload Team Image"
          helperText="PNG, JPG, JPEG - used in frontend Team section"
        />
        <div>
          <label className="mb-2 block text-sm text-white/80">Image Alt Text</label>
          <input
            value={form.imageAlt}
            onChange={(e) => setField("imageAlt", e.target.value)}
            placeholder="Describe the team member image for SEO"
            className="w-full rounded-lg border border-white/15 bg-[#0B1B3A] px-3 py-2 text-white outline-none focus:border-[#0E70C4]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/80">
            Social Media Links
          </label>
          <p className="mb-3 text-xs text-white/50">
            Leave a field empty to save <code>#</code>. Empty links are hidden
            on the frontend.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DEFAULT_SOCIAL_ACCOUNTS.map((account) => (
              <div
                key={`social-${account.key}`}
                className="rounded-lg border border-white/15 bg-[#0B1B3A] p-3"
              >
                <label className="mb-2 block text-xs font-medium text-white/70">
                  {account.label}
                </label>
                <input
                  value={form.socialLinks?.[account.key] ?? ""}
                  onChange={(e) => updateSocialLink(account.key, e.target.value)}
                  className={`w-full rounded-lg border bg-[#111022] px-3 py-2 text-sm text-white outline-none ${
                    fieldErrors.socialLinks?.[account.key]
                      ? "border-red-500/60 focus:border-red-500/60"
                      : "border-white/15 focus:border-[#0E70C4]"
                  }`}
                  placeholder={`https://${account.key}.com/...`}
                />
                {fieldErrors.socialLinks?.[account.key] ? (
                  <p className="mt-1 text-xs text-red-300">
                    Use a valid URL (http/https) or leave it empty.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/80">Skills</label>
          <div className="space-y-3">
            {form.skills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/20 bg-[#0B1B3A] px-4 py-3 text-sm text-white/60">
                No skills added yet.
              </div>
            ) : null}
            {form.skills.map((skill, index) => (
              <div
                key={`skill-${index}`}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_auto] md:items-end"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Skill name
                  </label>
                  <input
                    value={skill.name ?? ""}
                    onChange={(e) => updateSkill(index, "name", e.target.value)}
                    className={`w-full rounded-lg border bg-[#0B1B3A] px-3 py-2 text-white outline-none ${
                      fieldErrors.skills?.[index]?.name
                        ? "border-red-500/60 focus:border-red-500/60"
                        : "border-white/15 focus:border-[#0E70C4]"
                    }`}
                    placeholder="React"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Value (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={skill.value ?? ""}
                    onChange={(e) =>
                      updateSkill(index, "value", e.target.value)
                    }
                    className={`w-full rounded-lg border bg-[#0B1B3A] px-3 py-2 text-white outline-none ${
                      fieldErrors.skills?.[index]?.value
                        ? "border-red-500/60 focus:border-red-500/60"
                        : "border-white/15 focus:border-[#0E70C4]"
                    }`}
                    placeholder="90"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="h-10 rounded-lg border border-white/20 px-4 text-sm font-medium text-white/80 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Add Skill
            </button>
            <p className="text-xs text-white/50">Use values from 0 to 100.</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/80">Education</label>
          <div className="space-y-3">
            {form.education.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/20 bg-[#0B1B3A] px-4 py-3 text-sm text-white/60">
                No education added yet.
              </div>
            ) : null}
            {form.education.map((item, index) => (
              <div
                key={`education-${index}`}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_auto] md:items-end"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Degree
                  </label>
                  <input
                    value={item.degree ?? ""}
                    onChange={(e) =>
                      updateEducation(index, "degree", e.target.value)
                    }
                    className={`w-full rounded-lg border bg-[#0B1B3A] px-3 py-2 text-white outline-none ${
                      fieldErrors.education?.[index]?.degree
                        ? "border-red-500/60 focus:border-red-500/60"
                        : "border-white/15 focus:border-[#0E70C4]"
                    }`}
                    placeholder="BS Computer Science"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Year
                  </label>
                  <input
                    inputMode="numeric"
                    value={item.year ?? ""}
                    onChange={(e) =>
                      updateEducation(index, "year", e.target.value)
                    }
                    className={`w-full rounded-lg border bg-[#0B1B3A] px-3 py-2 text-white outline-none ${
                      fieldErrors.education?.[index]?.year
                        ? "border-red-500/60 focus:border-red-500/60"
                        : "border-white/15 focus:border-[#0E70C4]"
                    }`}
                    placeholder="2024"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="h-10 rounded-lg border border-white/20 px-4 text-sm font-medium text-white/80 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={addEducation}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Add Education
            </button>
            <p className="text-xs text-white/50">
              Year is optional. If filled, accepted: 2024, 2020-2024, or Present.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="admin-modern-btn-primary px-5 py-2 text-sm disabled:opacity-60"
          >
            {submitting
              ? "Saving..."
              : isEditMode
                ? "Update Member"
                : "Create Member"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/team")}
            className="admin-modern-btn-secondary px-5 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
