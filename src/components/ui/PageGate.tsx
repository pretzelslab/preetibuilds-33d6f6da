import { useState, useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";

// ── Access code registry ───────────────────────────────────────────────────────
// PRL2026 = master (unlocks everything — Preeti only)
// Page codes = selective access, share one at a time with specific visitors
const MASTER_CODE = "PRL2026";
const MASTER_KEY  = "pl_session_access";

const PAGE_CODES: Record<string, string> = {
  "research":                  "RSC2026",
  "carbon-depth":              "CDX2026",
  "ai-readiness":              "ARD2026",
  "fairness":                  "FAR2026",
  "carbon-fairness":           "CFR2026",
  "client-discovery":          "CLN2026",
  "melodic":                   "MEL2026",
  "admin":                     "ADM2026",
  "sustainability-framework":  "SFW2026",
  "ai-sustainability-webinar": "WBN2026",
  "privacy-auditor":           "PRI2026",
};

function pageKey(key: string): string { return `pl_access_${key}`; }

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

function isUnlocked(page: string): boolean {
  return safeGet(MASTER_KEY) === "1" || safeGet(pageKey(page)) === "1";
}

// ── PreviewShell ───────────────────────────────────────────────────────────────
export function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
      {children}
    </div>
  );
}

// ── useGateUnlocked ────────────────────────────────────────────────────────────
// Pass the same pageId used in <PageGate pageId="..."> to check that specific page.
// No arg = check master key only.
export function useGateUnlocked(pageId = ""): boolean {
  if (pageId) return isUnlocked(pageId);
  return safeGet(MASTER_KEY) === "1";
}

// ── PageGate ───────────────────────────────────────────────────────────────────
export function PageGate({
  children,
  backTo = "/#projects",
  previewContent,
  pageId = "",
}: {
  children: ReactNode;
  backTo?: string;
  previewContent?: ReactNode;
  pageId?: string;
}) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked(pageId));
  const [code, setCode]         = useState("");
  const [error, setError]       = useState(false);
  const [shaking, setShaking]   = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Hash-based unlock: /carbon-depth#PRL2026 or /carbon-depth#CDX2026
  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toUpperCase().trim();
    if (!hash) return;
    if (hash === MASTER_CODE) {
      safeSet(MASTER_KEY, "1");
      setUnlocked(true);
    } else if (pageId && hash === PAGE_CODES[pageId]) {
      safeSet(pageKey(pageId), "1");
      setUnlocked(true);
    }
    if (hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [pageId]);

  const tryUnlock = () => {
    const entered = code.toUpperCase().trim();
    if (entered === MASTER_CODE) {
      safeSet(MASTER_KEY, "1");
      setUnlocked(true);
    } else if (pageId && PAGE_CODES[pageId] && entered === PAGE_CODES[pageId]) {
      safeSet(pageKey(pageId), "1");
      setUnlocked(true);
    } else {
      setError(true); setShaking(true);
      setTimeout(() => { setError(false); setShaking(false); }, 800);
      setCode("");
    }
  };

  const lock = () => {
    safeRemove(MASTER_KEY);
    if (pageId) safeRemove(pageKey(pageId));
    setUnlocked(false);
    setCode(""); setShowInput(false);
  };

  if (unlocked) {
    return (
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {children}
        <button onClick={lock} title="Lock this page" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          background: "#0f172a", color: "#fff", border: "none", borderRadius: 50,
          width: 44, height: 44, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)", opacity: 0.7,
        }}>
          🔓
        </button>
      </div>
    );
  }

  // ── Locked state ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
      `}</style>

      {/* Sticky top banner */}
      <div style={{
        position: "sticky", top: 0, zIndex: 9999,
        background: "#0f172a", borderBottom: "1px solid #1e293b",
        padding: "10px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/#projects" style={{ fontSize: 11, color: "#64748b", textDecoration: "none", fontWeight: 600, letterSpacing: "0.03em" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
          >
            ← Back to Portfolio
          </Link>
          <span style={{ color: "#1e293b" }}>|</span>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
            Preview · Enter code for full access
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showInput ? (
            <>
              <input
                type="password"
                placeholder="Access code"
                value={code}
                autoFocus
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") tryUnlock();
                  if (e.key === "Escape") { setShowInput(false); setCode(""); }
                }}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 13,
                  border: `1.5px solid ${error ? "#dc2626" : "#334155"}`,
                  background: error ? "#2d1212" : "#1e293b",
                  color: "#f1f5f9", outline: "none", width: 160,
                  fontFamily: "monospace", letterSpacing: "0.12em", textAlign: "center",
                  animation: shaking ? "shake 0.4s ease" : "none",
                }}
              />
              <button onClick={tryUnlock} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Unlock
              </button>
              <button onClick={() => { setShowInput(false); setCode(""); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                ✕
              </button>
            </>
          ) : (
            <button onClick={() => setShowInput(true)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Enter code
            </button>
          )}
        </div>
      </div>

      {/* Content: preview (masked) or blurred children */}
      {previewContent ? (
        <div
          onContextMenu={e => e.preventDefault()}
          style={{
            userSelect: "none",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            height: "calc(100vh - 41px)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top zone — sharp */}
          <div style={{
            position: "absolute", inset: 0,
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 74%)",
            maskImage:        "linear-gradient(to bottom, black 0%, black 55%, transparent 74%)",
          }}>
            {previewContent}
          </div>
          {/* Bottom peek — faded in from below */}
          <div style={{
            position: "absolute", inset: 0,
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 38%, transparent 62%)",
            maskImage:        "linear-gradient(to top, black 0%, black 38%, transparent 62%)",
          }}>
            {previewContent}
          </div>
        </div>
      ) : (
        <div
          onContextMenu={e => e.preventDefault()}
          style={{
            filter: "blur(2px) brightness(0.9)",
            pointerEvents: "none",
            userSelect: "none",
            transition: "filter 0.3s ease",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
