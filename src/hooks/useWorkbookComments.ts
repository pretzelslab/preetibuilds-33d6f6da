import { useCallback, useEffect, useState } from "react";

export interface WorkbookComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  // Whether this browser may edit/delete it: it holds the comment's edit
  // token, or the owner session is active. The server re-checks every write.
  canModify: boolean;
}

type ServerComment = Omit<WorkbookComment, "canModify">;

// Edit tokens for comments created in this browser, keyed by comment id. The
// server stores only a hash, so losing this (cleared storage, other device)
// means only the owner can still edit/delete those comments.
const TOKENS_KEY = "pl_wbc_tokens";

function readTokens(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTokens(tokens: Record<string, string>): void {
  try { localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens)); } catch { /* storage unavailable: owner can still moderate */ }
}

function setToken(id: string, token: string): void {
  writeTokens({ ...readTokens(), [id]: token });
}

function removeToken(id: string): void {
  const tokens = readTokens();
  delete tokens[id];
  writeTokens(tokens);
}

async function call<T>(body: Record<string, unknown>): Promise<(T & { ok: true }) | null> {
  try {
    const res = await fetch("/api/workbook-comments", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok === true ? json : null;
  } catch {
    return null;
  }
}

// Per-page comment thread (workbook_comments table), scoped by client_id +
// page_id so every phase/workbook page gets its own independent thread. All
// access goes through api/workbook-comments.ts — anon has no direct grants.
export function useWorkbookComments(clientId: string, pageId: string) {
  const [comments, setComments] = useState<WorkbookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const withAccess = useCallback(
    (c: ServerComment, owner: boolean): WorkbookComment => ({ ...c, canModify: owner || !!readTokens()[c.id] }),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    const result = await call<{ comments: ServerComment[]; isOwner: boolean }>({ action: "list", clientId, pageId });
    if (!result) console.error("workbook_comments load error");
    const owner = result?.isOwner === true;
    setIsOwner(owner);
    setComments((result?.comments ?? []).map(c => withAccess(c, owner)));
    setLoading(false);
  }, [clientId, pageId, withAccess]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = await call<{ comment: ServerComment; editToken: string }>({ action: "add", clientId, pageId, body: trimmed });
    if (!result) { console.error("workbook_comments insert error"); return; }
    setToken(result.comment.id, result.editToken);
    setComments(prev => [...prev, { ...result.comment, canModify: true }]);
  }, [clientId, pageId]);

  const editComment = useCallback(async (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = await call<{ comment: ServerComment }>({
      action: "edit", clientId, pageId, id, body: trimmed, editToken: readTokens()[id],
    });
    if (!result) { console.error("workbook_comments update error"); return; }
    setComments(prev => prev.map(c => c.id === id ? withAccess(result.comment, isOwner) : c));
  }, [clientId, pageId, isOwner, withAccess]);

  const deleteComment = useCallback(async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    const result = await call({ action: "delete", clientId, pageId, id, editToken: readTokens()[id] });
    if (!result) {
      console.error("workbook_comments delete error");
      await load(); // restore the optimistic removal
      return;
    }
    removeToken(id);
  }, [clientId, pageId, load]);

  return { comments, loading, addComment, editComment, deleteComment };
}
