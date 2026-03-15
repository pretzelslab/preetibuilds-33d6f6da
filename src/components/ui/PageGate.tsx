import { useState, useEffect, ReactNode } from "react";

// ─── Access configuration ─────────────────────────────────────────────────────
// Change ACCESS_CODE to any value you want. Case-insensitive.
const ACCESS_CODE = "PRL2026";
const STORAGE_KEY = "pl_session_access";

// ─── Safe storage helpers (sessionStorage throws in sandboxed iframes) ────────
function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* sandboxed */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* sandboxed */ }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useGateUnlocked(): boolean {
  return safeGet(STORAGE_KEY) === "1";
}

// ─── Gate component ───────────────────────────────────────────────────────────
export function PageGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() =>
    safeGet(STORAGE_KEY) === "1"
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Auto-unlock from URL hash — owner can bookmark the URL with #PRL2026
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
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Content — blurred when locked */}
      <div style={{
        filter: unlocked ? "none" : "blur(10px) brightness(0.7)",
        pointerEvents: unlocked ? "auto" : "none",
        userSelect: unlocked ? "auto" : "none",
        transition: "filter 0.4s ease",
      }}>
        {children}
      </div>

      {/* Lock overlay — shown when locked */}
      {!unlocked && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "44px 48px",
            maxWidth: 420, width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            animation: shaking ? "shake 0.4s ease" : "fadeIn 0.3s ease",
          }}>
            <style>{`
              @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
              @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
            `}</style>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Restricted Access
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              This content is available for authorised viewing only.<br />
              Enter your access code to continue.
            </p>
            <input
              type="password"
              placeholder="Access code"
              value={code}
              autoFocus
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryUnlock()}
              style={{
                width: "100%",
                padding: "13px 16px",
                border: `2px solid ${error ? "#dc2626" : "#e2e8f0"}`,
                borderRadius: 10,
                fontSize: 16,
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
                fontFamily: "monospace",
                letterSpacing: "0.15em",
                textAlign: "center",
                transition: "border-color 0.2s",
                background: error ? "#fef2f2" : "#fff",
              }}
            />
            <button
              onClick={tryUnlock}
              style={{
                width: "100%",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "13px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Unlock →
            </button>
            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12, fontWeight: 500 }}>
                Incorrect code — please try again.
              </p>
            )}
            <p style={{ marginTop: 24, fontSize: 11, color: "#94a3b8" }}>
              pretzelslab · authorised access only
            </p>
          </div>
        </div>
      )}

      {/* Lock button — visible when unlocked */}
      {unlocked && (
        <button
          onClick={lock}
          title="Lock this page"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 50,
            width: 44,
            height: 44,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            opacity: 0.7,
          }}
        >
          🔓
        </button>
      )}
    </div>
  );
}
