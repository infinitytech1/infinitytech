import { useState } from "react";
import { useStore } from "@/admin/data/store";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  Lock, Sun, Moon, Trash2, RotateCcw, Save, CheckCircle2,
  Shield, Palette, Database, Info
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { projects, resetToDefaults } = useStore();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetDialog, setResetDialog] = useState(false);
  const [saved, setSaved] = useState(false);

  function handlePinChange(e: React.FormEvent) {
    e.preventDefault();
    const storedPin = localStorage.getItem("it-admin-pin") || "admin2024";
    if (currentPin !== storedPin) {
      setPinMsg({ type: "error", text: "Current PIN is incorrect." });
      return;
    }
    if (newPin.length < 4) {
      setPinMsg({ type: "error", text: "New PIN must be at least 4 characters." });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg({ type: "error", text: "New PINs do not match." });
      return;
    }
    localStorage.setItem("it-admin-pin", newPin);
    setPinMsg({ type: "success", text: "PIN updated successfully." });
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  }

  const totalSize = projects.reduce((s, p) => s + p.files.length * 3 + p.media.length * 2, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Dashboard configuration and preferences</p>
      </div>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-muted border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-all"
          >
            {theme === "dark" ? (
              <><Moon className="w-4 h-4 text-primary" /><span>Dark Mode</span></>
            ) : (
              <><Sun className="w-4 h-4 text-primary" /><span>Light Mode</span></>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Color Accent</p>
            <p className="text-xs text-muted-foreground mt-0.5">Engineering cyan — the identity of Infinity Tech</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary border-2 border-primary/30" />
            <span className="font-mono text-xs text-muted-foreground">#22D3EE</span>
          </div>
        </div>
      </Section>

      {/* Access Control */}
      <Section title="Access Control" icon={Shield}>
        <form onSubmit={handlePinChange} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Current PIN", value: currentPin, set: setCurrentPin, placeholder: "Current PIN" },
              { label: "New PIN", value: newPin, set: setNewPin, placeholder: "New PIN (min 4 chars)" },
              { label: "Confirm New PIN", value: confirmPin, set: setConfirmPin, placeholder: "Confirm PIN" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={e => { f.set(e.target.value); setPinMsg(null); }}
                  placeholder={f.placeholder}
                  autoComplete="new-password"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-mono tracking-widest transition-all"
                />
              </div>
            ))}
          </div>

          {pinMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                pinMsg.type === "success"
                  ? "bg-chart-4/10 text-chart-4 border border-chart-4/20"
                  : "bg-destructive/10 text-red-400 border border-red-500/20"
              }`}
            >
              {pinMsg.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {pinMsg.text}
            </motion.div>
          )}

          <button type="submit" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            <Lock className="w-3.5 h-3.5" />
            Update PIN
          </button>
        </form>
      </Section>

      {/* Data Management */}
      <Section title="Data Management" icon={Database}>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Project Storage</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {projects.length} projects · {projects.reduce((s, p) => s + p.files.length, 0)} files · {projects.reduce((s, p) => s + p.media.length, 0)} media items
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-primary">localStorage</p>
            <p className="text-xs text-muted-foreground">~{totalSize} MB est.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-amber-400 mb-1">Supabase Integration Ready</p>
            <p>This dashboard is pre-structured for Supabase Storage. Add your Supabase credentials to enable cloud file uploads and persistent analytics across sessions.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Reset to Defaults</p>
            <p className="text-xs text-muted-foreground mt-0.5">Restore all 6 original projects and demo data</p>
          </div>
          <button
            onClick={() => setResetDialog(true)}
            className="flex items-center gap-2 bg-muted border border-border hover:border-red-400/40 hover:bg-red-500/5 text-muted-foreground hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="About" icon={Info}>
        <div className="space-y-2 text-sm">
          {[
            { label: "Dashboard Version", value: "v1.0.0" },
            { label: "Build", value: "React + Vite + TypeScript" },
            { label: "Charts", value: "Recharts" },
            { label: "Animations", value: "Framer Motion" },
            { label: "Storage", value: "localStorage (Supabase-ready)" },
            { label: "Designer / Engineer", value: "Fares Salah" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono text-xs text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Reset dialog */}
      <AlertDialog open={resetDialog} onOpenChange={setResetDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will reset all project data to the original 6 demo projects. Any changes you've made — new projects, edits, or uploads — will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => { resetToDefaults(); setResetDialog(false); }}
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
