import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCareerProgramById,
  createCareerProgram,
  updateCareerProgram,
  addCareerProgramModule,
  updateCareerProgramModule,
  deleteCareerProgramModule,
} from "../../api/careerApi";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/20 bg-[#151327] px-3 py-2 text-white outline-none focus:border-[#3c72fc]";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wider text-white/55 block mb-1.5";
const SECTION_CLASS = "rounded-2xl border border-white/10 bg-[#0f0d1d] p-5 space-y-4";

export default function CareerProgramForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    statusBadge: "",
    joinBadge: "",
    title: "",
    description: "",
    duration: "",
    prerequisite: "",
    isActive: true,
    order: 0,
  });
  const [whoCanApply, setWhoCanApply] = useState([]);
  const [whyChoose, setWhyChoose] = useState([]);
  const [modules, setModules] = useState([]);
  const [initialModules, setInitialModules] = useState([]);
  const [deletedModuleIds, setDeletedModuleIds] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moduleError, setModuleError] = useState("");
  const [newModule, setNewModule] = useState({ title: "", description: "" });

  const loadProgram = async () => {
    try {
      const { data } = await getCareerProgramById(id);
      const program = data?.data || data;
      if (program) {
        setFormData({
          statusBadge: program.status_badge || "",
          joinBadge: program.join_badge || "",
          title: program.title || "",
          description: program.description || "",
          duration: program.duration || "",
          prerequisite: program.prerequisite || "",
          isActive: !!program.isActive,
          order: program.order || 0,
        });
        setWhoCanApply(Array.isArray(program.who_can_apply) ? program.who_can_apply : []);
        setWhyChoose(Array.isArray(program.why_choose) ? program.why_choose : []);
        const mods = Array.isArray(program.modules) ? program.modules : [];
        setModules(mods);
        setInitialModules(JSON.parse(JSON.stringify(mods)));
        setDeletedModuleIds([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load program details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) loadProgram();
  }, [id]);

  const handleArrayChange = (setter, list, index, value) => {
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  };
  const addArrayItem = (setter, list) => setter([...list, ""]);
  const removeArrayItem = (setter, list, index) => setter(list.filter((_, idx) => idx !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formData,
        whoCanApply: whoCanApply.filter((item) => item.trim() !== ""),
        whyChoose: whyChoose.filter((item) => item.trim() !== ""),
      };

      let programId = id;
      if (isEdit) {
        await updateCareerProgram(programId, payload);
      } else {
        const { data } = await createCareerProgram(payload);
        const created = data?.data || data;
        programId = created.id;
      }

      if (isEdit) {
        await batchSaveModules(programId);
      }

      navigate("/career-programs");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to save program.");
    } finally {
      setSaving(false);
    }
  };

  const batchSaveModules = async (programId) => {
    await Promise.all([
      ...deletedModuleIds.map((modId) => deleteCareerProgramModule(programId, modId)),
      ...modules.map((mod) => {
        if (!mod.id) return addCareerProgramModule(programId, { title: mod.title, description: mod.description });
        const initial = initialModules.find((m) => m.id === mod.id);
        if (initial?.title !== mod.title || initial?.description !== mod.description) {
          return updateCareerProgramModule(programId, mod.id, { title: mod.title, description: mod.description });
        }
        return Promise.resolve();
      }),
    ]);
  };

  const handleModuleFieldChange = (moduleId, field, value) => {
    setModules((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, [field]: value } : mod))
    );
  };

  const handleModuleDelete = (moduleId) => {
    if (!window.confirm("Delete this module?")) return;
    if (moduleId) setDeletedModuleIds((prev) => [...prev, moduleId]);
    setModules((prev) => prev.filter((mod) => mod.id !== moduleId));
  };

  if (loading) return <p className="text-white/70">Loading program...</p>;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? "Manage Career Program" : "Add Career Program"}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={SECTION_CLASS}>
          <h2 className="text-lg font-bold text-white">Program Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={LABEL_CLASS}>Status Badge</span>
              <input
                className={INPUT_CLASS}
                value={formData.statusBadge}
                onChange={(e) => setFormData({ ...formData, statusBadge: e.target.value })}
                placeholder="Applications Open"
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Join Badge</span>
              <input
                className={INPUT_CLASS}
                value={formData.joinBadge}
                onChange={(e) => setFormData({ ...formData, joinBadge: e.target.value })}
                placeholder="Join Swift Sign IT"
              />
            </label>
            <label className="md:col-span-2">
              <span className={LABEL_CLASS}>Title</span>
              <input
                required
                className={INPUT_CLASS}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </label>
            <label className="md:col-span-2">
              <span className={LABEL_CLASS}>Description</span>
              <textarea
                rows={3}
                className={INPUT_CLASS}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Duration</span>
              <input
                className={INPUT_CLASS}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="3-Month Program"
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Prerequisite</span>
              <input
                className={INPUT_CLASS}
                value={formData.prerequisite}
                onChange={(e) => setFormData({ ...formData, prerequisite: e.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>Sort Order</span>
              <input
                type="number"
                className={INPUT_CLASS}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="accent-[#3c72fc] w-4 h-4"
              />
              <span className="text-sm text-white/80">Active (visible on public site)</span>
            </label>
          </div>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className="text-lg font-bold text-white">Who Can Apply</h2>
          {whoCanApply.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={INPUT_CLASS}
                value={item}
                onChange={(e) => handleArrayChange(setWhoCanApply, whoCanApply, index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeArrayItem(setWhoCanApply, whoCanApply, index)}
                className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 hover:bg-red-500/25"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem(setWhoCanApply, whoCanApply)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            + Add Item
          </button>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className="text-lg font-bold text-white">Why Choose This Level</h2>
          {whyChoose.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={INPUT_CLASS}
                value={item}
                onChange={(e) => handleArrayChange(setWhyChoose, whyChoose, index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeArrayItem(setWhyChoose, whyChoose, index)}
                className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 hover:bg-red-500/25"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem(setWhyChoose, whyChoose)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            + Add Item
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#3c72fc] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fe1] disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Save All Changes" : "Create Program"}
        </button>
      </form>

      {isEdit && (
        <div className={SECTION_CLASS}>
          <h2 className="text-lg font-bold text-white">Program Modules ({modules.length})</h2>
          <p className="text-xs text-white/50">
            Modules render on the public page in this order, numbered automatically.
          </p>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.id || `new-${Math.random()}`} className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3c72fc] uppercase">
                    {mod.id ? `Module ${mod.module_number}` : "NEW MODULE"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModuleDelete(mod.id)}
                    className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
                <input
                  className={INPUT_CLASS}
                  value={mod.title}
                  onChange={(e) => handleModuleFieldChange(mod.id, "title", e.target.value)}
                  placeholder="Module title"
                />
                <textarea
                  rows={2}
                  className={INPUT_CLASS}
                  value={mod.description || ""}
                  onChange={(e) => handleModuleFieldChange(mod.id, "description", e.target.value)}
                  placeholder="Module description"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-white/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-white/80">Add New Module</p>
            <input
              className={INPUT_CLASS}
              value={newModule.title}
              onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
              placeholder="Module title"
            />
            <textarea
              rows={2}
              className={INPUT_CLASS}
              value={newModule.description}
              onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
              placeholder="Module description"
            />
            <button
              type="button"
              disabled={!newModule.title.trim()}
              onClick={() => {
                setModules([...modules, { ...newModule }]);
                setNewModule({ title: "", description: "" });
              }}
              className="rounded-lg bg-[#3c72fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d5fe1] disabled:opacity-60"
            >
              + Add Module
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
