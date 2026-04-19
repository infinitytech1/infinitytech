import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { apiPost, apiGet } from "@/lib/api";

interface Comment {
  id: number;
  projectId: string;
  parentId: number | null;
  name: string;
  message: string;
  isHidden: boolean;
  isDeleted: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentFormProps {
  projectId: string;
  parentId?: number;
  parentName?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

function CommentForm({ projectId, parentId, parentName, onSubmit, onCancel, compact }: CommentFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/comments", { name: name.trim(), message: message.trim(), projectId, parentId });
      setName(""); setMessage("");
      onSubmit();
    } catch {
      setError("Failed to submit comment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-3" : "mt-6"}>
      {parentName && (
        <p className="text-xs text-primary/70 mb-2 font-mono">
          Replying to <span className="text-primary font-semibold">{parentName}</span>
        </p>
      )}
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={128}
          className="
            rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white
            placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1
            focus:ring-primary/30 transition-colors
          "
        />
        {!compact && (
          <div />
        )}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Share your thoughts…"
          maxLength={2000}
          rows={compact ? 2 : 3}
          className="
            sm:col-span-2 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white
            placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1
            focus:ring-primary/30 transition-colors resize-none
          "
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20
            disabled:opacity-50 transition-all
          "
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {loading ? "Sending…" : "Post comment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  onRefresh: () => void;
  depth?: number;
}

function CommentItem({ comment, projectId, onRefresh, depth = 0 }: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth > 0 ? "ml-6 mt-4 pl-4 border-l border-primary/15" : ""}
    >
      <div className="rounded-xl border border-white/6 bg-white/3 p-4 hover:border-white/10 transition-colors">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-semibold font-mono">
                {comment.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{comment.name}</p>
              <p className="text-xs text-white/30 font-mono">{formatDate(comment.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasReplies && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1 transition-colors"
              >
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {comment.replies!.length}
              </button>
            )}
            {depth === 0 && (
              <button
                onClick={() => setReplying(v => !v)}
                className="text-xs text-white/30 hover:text-primary/60 flex items-center gap-1 transition-colors"
              >
                <Reply className="w-3 h-3" /> Reply
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
          {comment.message}
        </p>

        <AnimatePresence>
          {replying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <CommentForm
                projectId={projectId}
                parentId={comment.id}
                parentName={comment.name}
                onSubmit={() => { setReplying(false); onRefresh(); }}
                onCancel={() => setReplying(false)}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReplies && hasReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {comment.replies!.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                projectId={projectId}
                onRefresh={onRefresh}
                depth={1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<Comment[]>(`/comments/${encodeURIComponent(projectId)}`);
      setComments(data);
    } catch {
      setError("Could not load comments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [projectId]);

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display text-white">
          Discussion
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-white/40">({comments.length})</span>
          )}
        </h2>
      </div>

      <CommentForm projectId={projectId} onSubmit={load} />

      <div className="mt-8 space-y-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {!loading && error && (
          <p className="text-red-400 text-sm text-center py-4">{error}</p>
        )}
        {!loading && !error && comments.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">
            Be the first to comment on this project.
          </p>
        )}
        {!loading && !error && comments.map(c => (
          <CommentItem key={c.id} comment={c} projectId={projectId} onRefresh={load} />
        ))}
      </div>
    </section>
  );
}
