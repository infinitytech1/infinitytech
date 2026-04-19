import { useState } from "react";
import { useStore } from "@/admin/data/store";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, Eye, Download, FolderOpen,
  CheckCircle2, Circle, Archive, GitCommit, Filter,
  LayoutGrid, List, ExternalLink, Github, Globe,
} from "lucide-react";
import type { ProjectStatus } from "@/admin/data/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_ICON: Record<ProjectStatus, any> = {
  active:    Circle,
  completed: CheckCircle2,
  archived:  Archive,
};
const STATUS_BG: Record<ProjectStatus, string> = {
  active:    "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  archived:  "bg-muted text-muted-foreground border-border",
};

type ViewMode = "grid" | "table";

export default function Projects() {
  const { projects, deleteProject, loading, error } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = projects.filter(p => {
    const q = query.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Loading from database…</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 bg-muted rounded w-16" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          <span className="font-medium">Database error:</span> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} total · {projects.filter(p => p.status === "active").length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted/30 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Link href="/admin/projects/new">
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md hover:shadow-primary/20">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search projects or tags..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "active", "completed", "archived"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Tags</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stats</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Updated</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {filtered.map(p => {
                      const StatusIcon = STATUS_ICON[p.status];
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="bg-card hover:bg-muted/10 transition-colors group"
                        >
                          {/* Project name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {p.thumbnailUrl ? (
                                <img src={p.thumbnailUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" loading="lazy" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                  <FolderOpen className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate max-w-[180px]">{p.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{p.description}</p>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_BG[p.status]}`}>
                              <StatusIcon className="w-3 h-3" />
                              {p.status}
                            </span>
                          </td>

                          {/* Tags */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                              {p.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/5 border border-primary/15 text-primary/80">{t}</span>
                              ))}
                              {p.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{p.tags.length - 3}</span>}
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                              <span className="flex items-center gap-1"><Download className="w-3 h-3" />{p.downloads}</span>
                            </div>
                          </td>

                          {/* Updated */}
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {p.githubUrl && (
                                <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all" title="GitHub">
                                  <Globe className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <Link href={`/admin/projects/${p.id}`}>
                                <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Edit project">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <button
                                onClick={() => setDeleteId(p.id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground/60">
                  <Filter className="w-8 h-8" />
                  <p className="text-sm">No projects match your filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── GRID VIEW ─────────────────────────────────────────────────── */
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((p, i) => {
                  const StatusIcon = STATUS_ICON[p.status];
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 group"
                    >
                      {/* Thumbnail strip — 16:9 */}
                      {p.thumbnailUrl && (
                        <div className="relative w-full overflow-hidden bg-muted/20" style={{ aspectRatio: "16/9" }}>
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                            style={{ objectFit: "cover" }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                        </div>
                      )}

                      {/* Card header */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!p.thumbnailUrl && (
                              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <FolderOpen className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${STATUS_BG[p.status]}`}>
                              <StatusIcon className="w-3 h-3" />
                              {p.status}
                            </span>
                          </div>
                          {/* Action buttons — visible on hover */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.githubUrl && (
                              <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="GitHub">
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {p.liveUrl && (
                              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Live URL">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link href={`/admin/projects/${p.id}`}>
                              <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Edit project">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/5 border border-primary/15 text-primary/80">{tag}</span>
                          ))}
                          {p.tags.length > 4 && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">+{p.tags.length - 4}</span>
                          )}
                        </div>
                      </div>

                      {/* Card footer */}
                      <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-muted/10">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{p.downloads.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" />{p.commits.length}</span>
                        </div>
                        <Link href={`/admin/projects/${p.id}`}>
                          <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/10">
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* New project card */}
              <Link href="/admin/projects/new">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer group min-h-[200px] transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/5 border border-dashed border-primary/30 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                    <Plus className="w-5 h-5 text-primary/50 group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Create New Project</p>
                </motion.div>
              </Link>
            </div>

            {filtered.length === 0 && projects.length > 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No projects match your filters.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the project and all its data including files, media, and version history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                const id = deleteId;
                setDeleteId(null);
                if (id) deleteProject(id).catch(err => console.error("Delete failed:", err));
              }}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
