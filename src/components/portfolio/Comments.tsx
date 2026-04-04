import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { govDb } from "@/lib/supabase-governance";

const ADMIN_PIN = "PRL2026";

interface Comment {
  id: string;
  name: string;
  message: string;
  reply: string | null;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Comments({ hideAdminPin = false }: { hideAdminPin?: boolean }) {
  const [comments, setComments]     = useState<Comment[]>([]);
  const [pending, setPending]       = useState<Comment[]>([]);
  const [name, setName]             = useState("");
  const [message, setMessage]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  // Admin mode
  const [adminMode, setAdminMode] = useState(false);
  const [pinInput, setPinInput]   = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await govDb
      .from("portfolio_comments")
      .select("id, name, message, reply, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setComments(data as Comment[]);
  }

  async function loadPending() {
    const { data } = await govDb
      .from("portfolio_comments")
      .select("id, name, message, reply, created_at")
      .eq("approved", false)
      .order("created_at", { ascending: false });
    if (data) setPending(data as Comment[]);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (adminMode) loadPending();
    else setPending([]);
  }, [adminMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    const { error: err } = await govDb
      .from("portfolio_comments")
      .insert({ name: name.trim(), message: message.trim() });
    setSubmitting(false);
    if (err) { console.error("Comments insert error:", err); setError("Couldn't post — try again."); return; }
    setSubmitted(true);
    setName(""); setMessage("");
    setTimeout(() => setSubmitted(false), 4000);
  }

  async function handleApprove(id: string) {
    await govDb.from("portfolio_comments").update({ approved: true }).eq("id", id);
    await loadPending();
    await load();
  }

  async function handleDelete(id: string) {
    await govDb.from("portfolio_comments").delete().eq("id", id);
    await loadPending();
    await load();
  }

  async function handleReply(id: string) {
    const text = replyText[id]?.trim();
    if (!text) return;
    await govDb.from("portfolio_comments").update({ reply: text }).eq("id", id);
    setReplyText(prev => ({ ...prev, [id]: "" }));
    await load();
  }

  function tryAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) { setAdminMode(true); setPinInput(""); }
    else { setPinInput(""); setError("Wrong PIN"); }
  }

  return (
    <div className="space-y-6">
      {/* Leave a comment form */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Leave a note</h3>
        {submitted ? (
          <p className="text-xs text-emerald-600 font-medium py-2">Thanks! Your note is pending review.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs outline-none focus:border-primary transition-colors"
              maxLength={60}
            />
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Say something…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs outline-none focus:border-primary transition-colors resize-none"
              maxLength={400}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !message.trim()}
              className="w-full py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </form>
        )}
      </div>

      {/* Admin: pending queue */}
      {adminMode && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-amber-600 uppercase tracking-wide">
            Pending review {pending.length > 0 ? `(${pending.length})` : "— none"}
          </p>
          {pending.map(c => (
            <div key={c.id} className="rounded-lg border border-amber-400/40 bg-amber-500/5 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{c.message}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleApprove(c.id)}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-2 py-1 rounded border border-rose-300 text-rose-600 text-[10px] font-semibold hover:bg-rose-50 transition-colors"
                >
                  ✗ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved comments list */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  {adminMode && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >✗</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.message}</p>

              {/* Reply */}
              {c.reply && (
                <div className="mt-2 pl-3 border-l-2 border-primary/30">
                  <p className="text-[10px] font-semibold text-primary mb-0.5">Preethi replied</p>
                  <p className="text-xs text-muted-foreground">{c.reply}</p>
                </div>
              )}

              {/* Admin reply input */}
              {adminMode && !c.reply && (
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={replyText[c.id] || ""}
                    onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="Reply…"
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleReply(c.id)}
                    className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-80 transition-opacity"
                  >
                    Reply
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Admin unlock */}
      {!hideAdminPin && !adminMode && (
        <form onSubmit={tryAdmin} className="flex gap-1.5 items-center pt-1">
          <input
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); tryAdmin(e as any); } }}
            type="password"
            placeholder="Admin PIN"
            className="w-24 px-2 py-1 rounded border border-border/40 bg-transparent text-[10px] outline-none focus:border-primary/40 text-muted-foreground/50 placeholder:text-muted-foreground/30"
          />
          <button type="submit" className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">→</button>
        </form>
      )}
      {adminMode && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-primary/50 font-mono">Admin mode active</p>
          <button onClick={() => setAdminMode(false)} className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">exit</button>
        </div>
      )}
    </div>
  );
}
