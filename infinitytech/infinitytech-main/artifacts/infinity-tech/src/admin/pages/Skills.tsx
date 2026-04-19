import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown } from "lucide-react";

interface Skill {
  id: string;
  name_en: string;
  name_ar: string;
  category: string;
  level?: string | null;
  sort_order: number;
}

type SkillDraft = Omit<Skill, "id">;

const DEFAULT_DRAFT: SkillDraft = {
  name_en: "", name_ar: "", category: "General", level: "", sort_order: 0,
};

const LEVELS = ["Expert", "Advanced", "Intermediate", "Beginner"];

function getPin() {
  return localStorage.getItem("it-admin-pin") || "admin2024";
}

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": getPin(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

function SkillRow({
  skill,
  onSave,
  onDelete,
}: {
  skill: Skill;
  onSave: (id: string, patch: Partial<SkillDraft>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>({
    name_en: skill.name_en,
    name_ar: skill.name_ar,
    category: skill.category,
    level: skill.level ?? "",
    sort_order: skill.sort_order,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(skill.id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${skill.name_en}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(skill.id);
    } finally {
      setDeleting(false);
    }
  }

  if (!editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border group hover:border-primary/20 transition-colors"
      >
        <div className="flex-1 grid grid-cols-4 gap-3 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{skill.name_en}</span>
          <span className="text-sm text-muted-foreground truncate" dir="rtl">{skill.name_ar || "—"}</span>
          <span className="text-xs text-primary/80 font-medium">{skill.category}</span>
          <span className="text-xs text-muted-foreground">{skill.level || "—"}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/6 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="p-4 rounded-xl bg-card border border-primary/20 shadow-[0_0_16px_rgba(34,211,238,0.06)]"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <input
          value={draft.name_en}
          onChange={e => setDraft(d => ({ ...d, name_en: e.target.value }))}
          placeholder="Name (EN)"
          className="admin-input"
        />
        <input
          value={draft.name_ar}
          onChange={e => setDraft(d => ({ ...d, name_ar: e.target.value }))}
          placeholder="الاسم (AR)"
          dir="rtl"
          className="admin-input text-right"
        />
        <input
          value={draft.category}
          onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
          placeholder="Category"
          className="admin-input"
        />
        <div className="relative">
          <select
            value={draft.level ?? ""}
            onChange={e => setDraft(d => ({ ...d, level: e.target.value }))}
            className="admin-input appearance-none pr-8 w-full"
          >
            <option value="">No level</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/6 transition-colors"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !draft.name_en.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save
        </button>
      </div>
    </motion.div>
  );
}

// ─── Add skill form ───────────────────────────────────────────────────────────

function AddSkillForm({ onAdd }: { onAdd: (draft: SkillDraft) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name_en.trim()) return;
    setSaving(true);
    try {
      await onAdd(draft);
      setDraft(DEFAULT_DRAFT);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/50 hover:bg-primary/5 text-sm font-medium transition-all w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-4 rounded-xl bg-card border border-primary/20 shadow-[0_0_16px_rgba(34,211,238,0.06)] space-y-3"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.15em]">New Skill</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              value={draft.name_en}
              onChange={e => setDraft(d => ({ ...d, name_en: e.target.value }))}
              placeholder="Name (EN) *"
              required
              className="admin-input"
              autoFocus
            />
            <input
              value={draft.name_ar}
              onChange={e => setDraft(d => ({ ...d, name_ar: e.target.value }))}
              placeholder="الاسم (AR)"
              dir="rtl"
              className="admin-input text-right"
            />
            <input
              value={draft.category}
              onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              placeholder="Category"
              className="admin-input"
            />
            <div className="relative">
              <select
                value={draft.level ?? ""}
                onChange={e => setDraft(d => ({ ...d, level: e.target.value }))}
                className="admin-input appearance-none pr-8 w-full"
              >
                <option value="">No level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setOpen(false); setDraft(DEFAULT_DRAFT); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/6 transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !draft.name_en.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Skill
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await apiFetch<{ skills: Skill[] }>("GET", "/skills");
      setSkills(d.skills);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(draft: SkillDraft) {
    const d = await apiFetch<{ skill: Skill }>("POST", "/skills", draft);
    setSkills(prev => [...prev, d.skill]);
  }

  async function handleSave(id: string, patch: Partial<SkillDraft>) {
    const d = await apiFetch<{ skill: Skill }>("PATCH", `/skills/${id}`, patch);
    setSkills(prev => prev.map(s => s.id === id ? d.skill : s));
  }

  async function handleDelete(id: string) {
    await apiFetch("DELETE", `/skills/${id}`);
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  const byCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category || "General";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-foreground">Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the skills shown on the public About page.
        </p>
      </div>

      {/* Column headers */}
      {skills.length > 0 && (
        <div className="grid grid-cols-4 gap-3 px-4 mb-2">
          {["English", "Arabic", "Category", "Level"].map(h => (
            <p key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">{h}</p>
          ))}
        </div>
      )}

      {/* Skill rows grouped by category */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-bold text-foreground/60 uppercase tracking-[0.2em] mb-2 px-1">
                {category}
              </p>
              <AnimatePresence mode="popLayout">
                <div className="space-y-1.5">
                  {items.map(skill => (
                    <SkillRow
                      key={skill.id}
                      skill={skill}
                      onSave={handleSave}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No skills yet. Add your first one below.
            </p>
          )}
        </div>
      )}

      {/* Add form */}
      <div className="mt-6">
        <AddSkillForm onAdd={handleAdd} />
      </div>
    </div>
  );
}
