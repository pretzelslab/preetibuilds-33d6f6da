import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useWorkbookComments } from "./useWorkbookComments";
import { SectionComments } from "@/components/ai-governance/CommentsPanel";

// The hook must never talk to Supabase directly any more — anon has no grants
// on workbook_comments. Everything goes through /api/workbook-comments.
vi.mock("@/lib/supabase-governance", () => ({
  govDb: { from: vi.fn(() => { throw new Error("direct Supabase access is not allowed"); }) },
}));

const CLIENT = "0d9c8b7a-6f5e-4d3c-2b1a-0f9e8d7c6b5a";
const PAGE = "phase1-govern-system-identity";
const MINE = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const THEIRS = "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d";
const TOKEN = "a".repeat(64);
const comment = (id: string, text: string) => ({ id, text, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" });

type Handler = (body: Record<string, unknown>) => { status?: number; json: unknown };

function stubApi(handler: Handler) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const { status = 200, json } = handler(JSON.parse(init.body as string));
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const sentBodies = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([url, init]) => ({ url, body: JSON.parse((init as RequestInit).body as string) }));

describe("useWorkbookComments", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { vi.unstubAllGlobals(); cleanup(); });

  it("lists via /api/workbook-comments; only comments with a stored token are modifiable", async () => {
    localStorage.setItem("pl_wbc_tokens", JSON.stringify({ [MINE]: TOKEN }));
    const fetchMock = stubApi(() => ({ json: { ok: true, isOwner: false, comments: [comment(MINE, "mine"), comment(THEIRS, "theirs")] } }));
    const { result } = renderHook(() => useWorkbookComments(CLIENT, PAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(sentBodies(fetchMock)[0]).toEqual({ url: "/api/workbook-comments", body: { action: "list", clientId: CLIENT, pageId: PAGE } });
    expect(result.current.comments.map(c => [c.id, c.canModify])).toEqual([[MINE, true], [THEIRS, false]]);
  });

  it("owner session makes every comment modifiable (including legacy ones)", async () => {
    stubApi(() => ({ json: { ok: true, isOwner: true, comments: [comment(THEIRS, "legacy")] } }));
    const { result } = renderHook(() => useWorkbookComments(CLIENT, PAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments[0].canModify).toBe(true);
  });

  it("add stores the returned edit token and marks the new comment modifiable", async () => {
    stubApi(b => b.action === "list"
      ? { json: { ok: true, isOwner: false, comments: [] } }
      : { json: { ok: true, comment: comment(MINE, "hi"), editToken: TOKEN } });
    const { result } = renderHook(() => useWorkbookComments(CLIENT, PAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.addComment("  hi  "));
    expect(JSON.parse(localStorage.getItem("pl_wbc_tokens")!)).toEqual({ [MINE]: TOKEN });
    expect(result.current.comments).toEqual([{ ...comment(MINE, "hi"), canModify: true }]);
  });

  it("edit and delete send this browser's token for that comment", async () => {
    localStorage.setItem("pl_wbc_tokens", JSON.stringify({ [MINE]: TOKEN }));
    const fetchMock = stubApi(b => {
      if (b.action === "list") return { json: { ok: true, isOwner: false, comments: [comment(MINE, "old")] } };
      if (b.action === "edit") return { json: { ok: true, comment: comment(MINE, "new") } };
      return { json: { ok: true } };
    });
    const { result } = renderHook(() => useWorkbookComments(CLIENT, PAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.editComment(MINE, "new"));
    expect(sentBodies(fetchMock).find(c => c.body.action === "edit")!.body)
      .toEqual({ action: "edit", clientId: CLIENT, pageId: PAGE, id: MINE, body: "new", editToken: TOKEN });
    expect(result.current.comments[0]).toMatchObject({ text: "new", canModify: true });

    await act(() => result.current.deleteComment(MINE));
    expect(sentBodies(fetchMock).find(c => c.body.action === "delete")!.body)
      .toEqual({ action: "delete", clientId: CLIENT, pageId: PAGE, id: MINE, editToken: TOKEN });
    expect(result.current.comments).toEqual([]);
    expect(JSON.parse(localStorage.getItem("pl_wbc_tokens")!)).toEqual({});
  });

  it("a refused delete (403) restores the comment by reloading", async () => {
    let listed = 0;
    stubApi(b => {
      if (b.action === "list") { listed++; return { json: { ok: true, isOwner: false, comments: [comment(THEIRS, "keep")] } }; }
      return { status: 403, json: { ok: false, error: "forbidden" } };
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useWorkbookComments(CLIENT, PAGE));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.deleteComment(THEIRS));
    await waitFor(() => expect(result.current.comments.map(c => c.id)).toEqual([THEIRS]));
    expect(listed).toBe(2);
  });
});

describe("SectionComments — edit/delete controls follow canModify", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { vi.unstubAllGlobals(); cleanup(); });

  it("shows edit/delete only on comments this browser created", async () => {
    localStorage.setItem("pl_wbc_tokens", JSON.stringify({ [MINE]: TOKEN }));
    stubApi(() => ({ json: { ok: true, isOwner: false, comments: [comment(MINE, "mine"), comment(THEIRS, "theirs")] } }));
    render(<SectionComments clientId={CLIENT} pageId={PAGE} label="System Identity" />);
    fireEvent.click(screen.getByRole("button", { name: /comment/i }));
    await waitFor(() => expect(screen.getByText("theirs")).toBeInTheDocument());
    expect(screen.getAllByLabelText("Edit comment")).toHaveLength(1);
    expect(screen.getAllByLabelText("Delete comment")).toHaveLength(1);
  });
});
