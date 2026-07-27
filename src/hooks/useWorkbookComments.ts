import { useCallback, useEffect, useState } from "react";
import { govDb } from "@/lib/supabase-governance";

export interface WorkbookComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

type Row = { id: string; body: string; created_at: string; updated_at: string };

function fromRow(r: Row): WorkbookComment {
  return { id: r.id, text: r.body, createdAt: r.created_at, updatedAt: r.updated_at };
}

// Per-page comment thread backed by Supabase (workbook_comments table), scoped by
// client_id + page_id so every phase/workbook page gets its own independent thread
// that syncs across whatever browser/device the workbook is opened from.
export function useWorkbookComments(clientId: string, pageId: string) {
  const [comments, setComments] = useState<WorkbookComment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await govDb
      .from("workbook_comments")
      .select("id, body, created_at, updated_at")
      .eq("client_id", clientId)
      .eq("page_id", pageId)
      .order("created_at", { ascending: true });
    if (error) console.error("workbook_comments load error:", error);
    setComments((data as Row[] | null)?.map(fromRow) ?? []);
    setLoading(false);
  }, [clientId, pageId]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { data, error } = await govDb
      .from("workbook_comments")
      .insert({ client_id: clientId, page_id: pageId, body: trimmed })
      .select("id, body, created_at, updated_at")
      .single();
    if (error) { console.error("workbook_comments insert error:", error); return; }
    setComments(prev => [...prev, fromRow(data as Row)]);
  }, [clientId, pageId]);

  const editComment = useCallback(async (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { data, error } = await govDb
      .from("workbook_comments")
      .update({ body: trimmed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, body, created_at, updated_at")
      .single();
    if (error) { console.error("workbook_comments update error:", error); return; }
    setComments(prev => prev.map(c => c.id === id ? fromRow(data as Row) : c));
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    const { error } = await govDb.from("workbook_comments").delete().eq("id", id);
    if (error) console.error("workbook_comments delete error:", error);
  }, []);

  return { comments, loading, addComment, editComment, deleteComment };
}
