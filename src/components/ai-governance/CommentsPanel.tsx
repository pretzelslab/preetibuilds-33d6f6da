import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { timeAgo } from "@/components/portfolio/Comments";
import { useWorkbookComments, type WorkbookComment } from "@/hooks/useWorkbookComments";

const textareaStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8,
  fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box",
  fontFamily: "inherit", color: "#0f172a", background: "#fff",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#0f172a", color: "#fff", border: "none", borderRadius: 7,
  padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700,
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 7,
  padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
};

const iconBtnStyle: React.CSSProperties = {
  background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, padding: 2,
};

function CommentTextarea({ value, onChange, onSave, onCancel, autoFocus, placeholder }: {
  value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
  autoFocus?: boolean; placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSave();
        }}
        placeholder={placeholder}
        rows={3}
        style={textareaStyle}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={onSave} disabled={!value.trim()} style={{ ...primaryBtnStyle, opacity: value.trim() ? 1 : 0.5, cursor: value.trim() ? "pointer" : "not-allowed" }}>
          Save
        </button>
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </>
  );
}

function CommentRow({ comment, onEdit, onDelete }: {
  comment: WorkbookComment; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const edited = comment.updatedAt !== comment.createdAt;

  if (editing) {
    return (
      <div style={{ border: "1px solid #c7d2fe", background: "#f5f3ff", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
        <CommentTextarea
          value={draft}
          onChange={setDraft}
          autoFocus
          onSave={() => { onEdit(comment.id, draft); setEditing(false); }}
          onCancel={() => { setDraft(comment.text); setEditing(false); }}
        />
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{comment.text}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {timeAgo(comment.createdAt)}{edited && " · edited"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setDraft(comment.text); setEditing(true); }} aria-label="Edit comment" title="Edit" style={iconBtnStyle}>✎</button>
          <button onClick={() => onDelete(comment.id)} aria-label="Delete comment" title="Delete" style={iconBtnStyle}>✕</button>
        </div>
      </div>
    </div>
  );
}

// Where to render an anchored popover: computed from the trigger icon's actual screen
// position (not CSS position:absolute) so it can be portaled straight to <body> and
// never gets clipped by an ancestor card's `overflow: hidden` (used all over this file
// for rounded corners) or trapped by a transformed ancestor.
//
// Prefers docking in the white space beside the workbook's content column (the nearest
// ancestor marked `data-comments-container`) so the popover never sits on top of the
// workbook itself — important once a row has several comments and the thread gets tall.
// Vertically it lines up with the row that was clicked. Falls back to anchoring near the
// icon (flipping upward if needed) when the window is too narrow to have side space.
function computeAnchoredRect(btn: HTMLElement) {
  const anchor = btn.getBoundingClientRect();
  const width = 300;
  const gap = 6;
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const container = btn.closest<HTMLElement>("[data-comments-container]");
  const containerRight = container?.getBoundingClientRect().right ?? null;
  const gutter = containerRight !== null ? vw - containerRight : 0;

  if (containerRight !== null && gutter >= width + gap + margin) {
    const left = containerRight + gap;
    const maxHeight = Math.min(380, vh - margin * 2);
    let top = anchor.top;
    if (top + maxHeight > vh - margin) top = Math.max(margin, vh - margin - maxHeight);
    return { left, top, maxHeight };
  }

  // Not enough side space (narrow window) — fall back to anchoring near the icon.
  let left = anchor.right - width;
  left = Math.min(Math.max(left, margin), Math.max(margin, vw - width - margin));

  const spaceBelow = vh - anchor.bottom - gap - margin;
  const spaceAbove = anchor.top - gap - margin;

  if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
    return { left, top: anchor.bottom + gap, maxHeight: Math.max(120, Math.min(380, spaceBelow)) };
  }
  return { left, bottom: vh - anchor.top + gap, maxHeight: Math.max(120, Math.min(380, spaceAbove)) };
}

// Inline comment trigger anchored to one section/row (an area card, a risk row, etc.)
// rather than a single page-wide thread. Renders a small icon next to whatever it's
// placed beside; the thread popover is portaled to <body> and positioned with real
// screen coordinates (see computeAnchoredRect) instead of CSS position:absolute inside
// the row — that's what keeps it from being clipped by the row/card's own
// `overflow: hidden` regardless of how tall that row happens to be. Also keeps it out
// of the way of browser-extension overlays (e.g. Adobe's PDF icon) that dock in page
// corners. Stops click propagation so it can sit inside a clickable row/card header
// without also triggering that row's expand/collapse.
export function SectionComments({ clientId, pageId, label }: {
  clientId: string; pageId: string; label: string;
}) {
  const { comments, loading, addComment, editComment, deleteComment } = useWorkbookComments(clientId, pageId);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [pos, setPos] = useState<ReturnType<typeof computeAnchoredRect> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setAdding(false); setDraft(""); }, [clientId, pageId]);

  const reposition = useCallback(() => {
    if (btnRef.current) setPos(computeAnchoredRect(btnRef.current));
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const hasComments = comments.length > 0;

  return (
    <div onClick={e => e.stopPropagation()} style={{ display: "inline-flex", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? "Close comments" : `Comments on ${label} (${comments.length})`}
        title={`Comments — ${label}`}
        style={{
          background: hasComments ? "#eef2ff" : "#f8fafc",
          border: `1px solid ${hasComments ? "#c7d2fe" : "#e2e8f0"}`, borderRadius: 7,
          padding: "4px 8px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
          color: hasComments ? "#4338ca" : "#94a3b8", lineHeight: 1,
        }}
      >
        💬{hasComments && <span style={{ fontSize: 10, fontWeight: 800 }}>{comments.length}</span>}
      </button>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          role="region"
          aria-label={`Comments — ${label}`}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
          style={{
            position: "fixed", left: pos.left, ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
            zIndex: 1000,
            width: 300, maxWidth: "calc(100vw - 16px)", maxHeight: pos.maxHeight,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
            boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>Comments</div>
              <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close comments" style={{ ...iconBtnStyle, fontSize: 14, flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", minHeight: 50 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "16px 8px", color: "#94a3b8", fontSize: 12 }}>Loading…</div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 8px", color: "#94a3b8", fontSize: 12 }}>No comments yet.</div>
            ) : (
              sorted.map(c => (
                <CommentRow key={c.id} comment={c} onEdit={editComment} onDelete={deleteComment} />
              ))
            )}
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9" }}>
            {adding ? (
              <CommentTextarea
                value={draft}
                onChange={setDraft}
                autoFocus
                placeholder="Add a comment…"
                onSave={() => { addComment(draft); setDraft(""); setAdding(false); }}
                onCancel={() => { setDraft(""); setAdding(false); }}
              />
            ) : (
              <button onClick={() => setAdding(true)} style={{ ...primaryBtnStyle, width: "100%", padding: "7px 0" }}>
                + Add Comment
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
