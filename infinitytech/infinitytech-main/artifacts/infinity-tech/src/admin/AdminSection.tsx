import { useState } from "react";
import { Switch, Route } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import AdminSidebar from "@/admin/components/Sidebar";
import Dashboard from "@/admin/pages/Dashboard";
import AdminProjects from "@/admin/pages/Projects";
import ProjectEditor from "@/admin/pages/ProjectEditor";
import Analytics from "@/admin/pages/Analytics";
import AdminComments from "@/admin/pages/Comments";
import AdminNotifications from "@/admin/pages/Notifications";
import SettingsPage from "@/admin/pages/Settings";

const AUTH_KEY = "it-admin-auth";
const DEFAULT_PIN = "admin2024";

function PinGate({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const storedPin = localStorage.getItem("it-admin-pin") || DEFAULT_PIN;
    if (pin === storedPin) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onAuth();
    } else {
      setError("Incorrect PIN. Please try again.");
      setShaking(true);
      setPin("");
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm px-4"
      >
        <motion.div
          animate={shaking ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">INFINITY.TECH</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
          </div>

          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-6">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">Restricted Access — Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden username field for password manager / a11y compliance */}
            <input type="text" name="username" value="admin" autoComplete="username" readOnly className="sr-only" aria-hidden="true" tabIndex={-1} />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Admin PIN
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  maxLength={20}
                  autoComplete="current-password"
                  className="w-full bg-input/20 border border-border rounded-lg px-4 py-3 pr-10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg text-sm transition-all duration-150 hover:shadow-md hover:shadow-primary/20"
            >
              Access Dashboard
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Default PIN: <span className="font-mono text-muted-foreground">admin2024</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AdminShell({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/projects" component={AdminProjects} />
          <Route path="/admin/projects/new" component={() => <ProjectEditor mode="create" />} />
          <Route path="/admin/projects/:id" component={({ params }) => <ProjectEditor mode="edit" projectId={params.id} />} />
          <Route path="/admin/analytics" component={Analytics} />
          <Route path="/admin/comments" component={AdminComments} />
          <Route path="/admin/notifications" component={AdminNotifications} />
          <Route path="/admin/settings" component={SettingsPage} />
          <Route>
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Page not found</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default function AdminSection() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");

  if (!authed) {
    return <PinGate onAuth={() => setAuthed(true)} />;
  }

  return (
    <AdminShell
      onLogout={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}
