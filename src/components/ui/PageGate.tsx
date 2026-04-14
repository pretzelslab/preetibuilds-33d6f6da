import { useState, useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";

// ── Master template for all preview content ───────────────────────────────────
// Wrap your preview JSX in <PreviewShell> to get consistent padding,
// max-width, and spacing. PageGate handles background, foreground, and
// the gradient fade — do not add those in the preview component itself.
export function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
      {children}
    </div>
  );
}

const ACCESS_CODE = "PRL2026";
const STORAGE_KEY = "pl_session_access";

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

export function useGateUnlocked(): boolean {
  return safeGet(STORAGE_KEY) === "1";
}

export function PageGate({
  children,
  backTo = "/#projects",
  previewContent,
}: {
  children: ReactNode;
  backTo?: string;
  previewContent?: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(() => safeGet(STORAGE_KEY) === "1");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toUpperCase().trim();
    if (hash === ACCESS_CODE) {
      safeSet(STORAGE_KEY, "1");
      setUnlocked(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const tryUnlock = () => {
    if (code.toUpperCase().trim() === ACCESS_CODE) {
      safeSet(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => { setError(false); setShaking(false); }, 800);
      setCode("");
    }
  };

  const lock = () => {
    safeRemove(STORAGE_KEY);
    setUnlocked(false);
    setCode("");
    setShowInput(false);
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

  // ── Locked state ──────────────────────────────────────────────────────────
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                onKeyDown={e => { if (e.key === "Enter") tryUnlock(); if (e.key === "Escape") { setShowInput(false); setCode(""); } }}
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

      {/* Content: either static preview (clear) or blurred children */}
      {previewContent ? (
        <div
          onContextMenu={e => e.preventDefault()}
          style={{
            userSelect: "none",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            height: "calc(100vh - 41px)",
            overflow: "hidden",
            WebkitMaskImage: "linear-gradient(to bottom, black 45%, transparent 92%)",
            maskImage: "linear-gradient(to bottom, black 45%, transparent 92%)",
          }}
        >
          {previewContent}
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
