export const DiagonalWatermark = ({
  text = "© preethi.builds",
  color = "rgba(15,23,42,0.04)",
}: {
  text?: string;
  color?: string;
}) => (
  <div
    style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", overflow: "hidden" }}
    aria-hidden="true"
  >
    <div style={{
      position: "absolute", width: "200%", height: "200%",
      left: "-50%", top: "-50%",
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      gap: "5rem",
      transform: "rotate(-35deg)", transformOrigin: "center center",
    }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "5rem", whiteSpace: "nowrap" }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <span key={j} style={{
              fontSize: 12, fontWeight: 500, textTransform: "uppercase",
              letterSpacing: "0.25em", userSelect: "none", color,
            }}>
              {text}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);
