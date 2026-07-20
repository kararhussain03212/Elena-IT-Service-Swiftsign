import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCertification,
  getCertificationById,
  updateCertification,
} from "../../api/certificationApi";
import ImageUpload from "../../components/ImageUpload";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]";
const SUBSECTION_CLASS = "rounded-lg border border-white/12 p-4 bg-white/2 space-y-4";

export default function CertificationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    fullName: "",
    isOpen: false,
    tagline: "",
    duration: "",
    dates: "",
    mode: "",
    prerequisite: "",
    aboutText: "",
    outcome: "",
    feeFootnote: "",
    applicationLink: "",
    qrCodeUrl: "",
    footerCta: "",
    image: "",
  });

  const [audience, setAudience] = useState([]);
  const [modules, setModules] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const apiRoot = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "";

  const resolveImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/uploads/")) return apiRoot + value;
    return apiRoot + "/" + value;
  };

  useEffect(() => {
    if (!isEdit) return;
    const fetchCert = async () => {
      try {
        const { data } = await getCertificationById(id);
        const cert = data?.data || data;
        if (cert) {
          setFormData({
            code: cert.code || "",
            title: cert.title || "",
            fullName: cert.fullName || "",
            isOpen: !!cert.isOpen,
            tagline: cert.tagline || "",
            duration: cert.duration || "",
            dates: cert.dates || "",
            mode: cert.mode || "",
            prerequisite: cert.prerequisite || "",
            aboutText: cert.aboutText || "",
            outcome: cert.outcome || "",
            feeFootnote: cert.feeFootnote || "",
            applicationLink: cert.applicationLink || "",
            qrCodeUrl: cert.qrCodeUrl || "",
            footerCta: cert.footerCta || "",
            image: cert.image || "",
          });
          setAudience(Array.isArray(cert.audience) ? cert.audience : []);
          setModules(Array.isArray(cert.modules) ? cert.modules : []);
          setBenefits(Array.isArray(cert.benefits) ? cert.benefits : []);
          setFees(Array.isArray(cert.fees) ? cert.fees : []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load certification details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id, isEdit]);

  const handleStringArrayChange = (setter, list, index, nextValue) => {
    const updated = [...list];
    updated[index] = nextValue;
    setter(updated);
  };

  const addStringArrayItem = (setter, list) => {
    setter([...list, ""]);
  };

  const removeStringArrayItem = (setter, list, index) => {
    setter(list.filter((_, idx) => idx !== index));
  };

  const handleFeeChange = (index, field, value) => {
    const updated = [...fees];
    updated[index] = { ...updated[index], [field]: value };
    setFees(updated);
  };

  const addFeeItem = () => {
    setFees([...fees, { item: "", amount: "" }]);
  };

  const removeFeeItem = (index) => {
    setFees(fees.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...formData,
      audience,
      modules,
      benefits,
      fees,
    };

    try {
      if (isEdit) {
        await updateCertification(id, payload);
      } else {
        await createCertification(payload);
      }
      navigate("/sections/certifications-list");
    } catch (err) {
      console.error(err);
      setError("Failed to save certification details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/70">Loading certification details...</p>;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEdit ? `Edit Certification: ${formData.title}` : "Add New Certification"}
          </h1>
          <p className="text-sm text-white/65">
            Configure every property of the certification level.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata */}
        <section className={SUBSECTION_CLASS}>
          <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
            1. Core Info & Status
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/80">Code (e.g. SSCC-F)</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Level Title (e.g. Foundation)</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-white/80">Full Name (e.g. Swift Sign Cybersecurity Certification — Foundation (SSCC-F))</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Mode of Training (e.g. Physical Training)</label>
              <input
                type="text"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Duration (e.g. One-Month Program)</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Dates Info (e.g. 15 July to 15 August)</label>
              <input
                type="text"
                value={formData.dates}
                onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Prerequisites text</label>
              <input
                type="text"
                value={formData.prerequisite}
                onChange={(e) => setFormData({ ...formData, prerequisite: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-white/80">Tagline Summary</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  className="w-4 h-4 accent-[#3c72fc]"
                />
                <span className="text-sm font-semibold text-white/90">Admissions Open (🟢)</span>
              </label>
            </div>
          </div>
        </section>

        {/* Cover Image & QR Code */}
        <section className={SUBSECTION_CLASS}>
          <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
            2. Graphics & Links
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <ImageUpload
                value={resolveImageUrl(formData.image)}
                onFileSelect={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setFormData((prev) => ({ ...prev, image: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }}
                label="Cover Image"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/80">Application / Google Form Link</label>
                <input
                  type="text"
                  value={formData.applicationLink}
                  onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80">QR Code URL (optional)</label>
                <input
                  type="text"
                  value={formData.qrCodeUrl}
                  onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        </section>

        {/* About & Outcome textareas */}
        <section className={SUBSECTION_CLASS}>
          <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
            3. Detailed Description
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/80">About Program description</label>
              <textarea
                rows={4}
                value={formData.aboutText}
                onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Program Outcome description</label>
              <textarea
                rows={4}
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/80">Footer Call to Action text (e.g. Register today and begin your journey)</label>
              <input
                type="text"
                value={formData.footerCta}
                onChange={(e) => setFormData({ ...formData, footerCta: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </section>

        {/* Audience strings list */}
        <section className={SUBSECTION_CLASS}>
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
              4. Target Audience
            </h3>
            <button
              type="button"
              onClick={() => addStringArrayItem(setAudience, audience)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              + Add Target
            </button>
          </div>
          <div className="space-y-2">
            {audience.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleStringArrayChange(setAudience, audience, idx, e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Target audience description"
                />
                <button
                  type="button"
                  onClick={() => removeStringArrayItem(setAudience, audience, idx)}
                  className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 text-xs text-red-300 hover:bg-red-500/25"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Modules list */}
        <section className={SUBSECTION_CLASS}>
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
              5. Modules Curriculum
            </h3>
            <button
              type="button"
              onClick={() => addStringArrayItem(setModules, modules)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              + Add Module
            </button>
          </div>
          <div className="space-y-2">
            {modules.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleStringArrayChange(setModules, modules, idx, e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Module topic"
                />
                <button
                  type="button"
                  onClick={() => removeStringArrayItem(setModules, modules, idx)}
                  className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 text-xs text-red-300 hover:bg-red-500/25"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits list */}
        <section className={SUBSECTION_CLASS}>
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
              6. Program Benefits
            </h3>
            <button
              type="button"
              onClick={() => addStringArrayItem(setBenefits, benefits)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              + Add Benefit
            </button>
          </div>
          <div className="space-y-2">
            {benefits.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleStringArrayChange(setBenefits, benefits, idx, e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Benefit description"
                />
                <button
                  type="button"
                  onClick={() => removeStringArrayItem(setBenefits, benefits, idx)}
                  className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 text-xs text-red-300 hover:bg-red-500/25"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Fees list */}
        <section className={SUBSECTION_CLASS}>
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white border-l-2 border-[#3c72fc] pl-2">
              7. Fee Structures
            </h3>
            <button
              type="button"
              onClick={addFeeItem}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              + Add Fee Row
            </button>
          </div>
          <div className="space-y-3">
            {fees.map((fee, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center bg-black/10 p-2.5 rounded-lg border border-white/5">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={fee.item}
                    onChange={(e) => handleFeeChange(idx, "item", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Fee item (e.g. Program Tuition Fee)"
                  />
                </div>
                <div className="w-48">
                  <input
                    type="text"
                    value={fee.amount}
                    onChange={(e) => handleFeeChange(idx, "amount", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Amount (e.g. PKR 40,000)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFeeItem(idx)}
                  className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/25 h-10"
                >
                  Remove
                </button>
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm text-white/80">Fee Footnote details</label>
              <textarea
                rows={2}
                value={formData.feeFootnote}
                onChange={(e) => setFormData({ ...formData, feeFootnote: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/sections/certifications-list")}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#3c72fc] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Certification"}
          </button>
        </div>
      </form>
    </section>
  );
}
