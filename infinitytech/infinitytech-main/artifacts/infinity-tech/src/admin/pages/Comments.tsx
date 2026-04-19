import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Eye, EyeOff, Trash2, RefreshCw, Search } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Comment {
  id: number;
  projectId: string;
  parentId: number | null;
  name: string;
  message: string;
  isHidden: boolean;
  isDeleted: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.get<Comment[]>("/comments");
      setComments(data);
    } catch {
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleHide(c: Comment) {
    setActionId(c.id);
    try {
      await adminApi.patch(`/comments/${c.id}/hide`, { hidden: !c.isHidden });
      setComments(prev => prev.map(x => x.id === c.id ? { ...x, isHidden: !c.isHidden } : x));
    } finally {
      setActionId(null);
    }
  }

  async function deleteComment(c: Comment) {
    if (!confirm(`Delete comment from "${c.name}"? This cannot be undone.`)) return;
    setActionId(c.id);
    try {
      await adminApi.delete(`/comments/${c.id}`);
      setComments(prev => prev.filter(x => x.id !== c.id));
    } finally {
      setActionId(null);
    }
  }

  const filtered = comments.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q) || c.projectId.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Comments</h1>
            <p className="text-xs text-white/40">{comments.length} total</p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search comments…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{search ? "No matching comments." : "No comments yet."}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(c => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 transition-colors ${
              c.isHidden
                ? "border-yellow-500/20 bg-yellow-500/4 opacity-60"
                : "border-white/6 bg-white/3"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-white">{c.name}</span>
                  {c.parentId ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary/60 font-mono">reply</span>
                  ) : null}
                  {c.isHidden && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-mono">hidden</span>
                  )}
                  <span className="text-xs text-white/30 font-mono ml-auto">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-xs text-primary/50 font-mono mb-2">Project: {c.projectId}</p>
                <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
                  {c.message}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => void toggleHide(c)}
                  disabled={actionId === c.id}
                  title={c.isHidden ? "Show comment" : "Hide comment"}
                  className="p-2 rounded-lg text-white/30 hover:text-yellow-400 hover:bg-yellow-400/8 transition-colors disabled:opacity-50"
                >
                  {c.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => void deleteComment(c)}
                  disabled={actionId === c.id}
                  title="Delete comment"
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/8 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
