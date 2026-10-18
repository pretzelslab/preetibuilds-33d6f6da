import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const SHOW_AFTER_PX = 300;

// Smooth scroll unless the visitor has asked for reduced motion.
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const btn =
  "flex items-center justify-center w-8 h-8 [@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:h-11 rounded-full border border-border bg-background/90 backdrop-blur-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Site-wide floating control: ↑ top, ↓ footer. 32px on desktop, 44px on touch screens
// (coarse pointer) to meet the touch-target size.
const ScrollControl = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const toTop = () => window.scrollTo({ top: 0, behavior: scrollBehavior() });
  const toFooter = () => {
    const footer = document.querySelector("footer");
    if (footer) footer.scrollIntoView({ behavior: scrollBehavior(), block: "end" });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: scrollBehavior() });
  };

  return (
    <div
      role="group"
      aria-label="Page scroll"
      className="fixed right-3 bottom-[10px] z-40 flex flex-col gap-1 print:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <button type="button" onClick={toTop} aria-label="Scroll to top" title="Top" className={btn}>
        <ChevronUp className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={toFooter} aria-label="Scroll to footer" title="Footer" className={btn}>
        <ChevronDown className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ScrollControl;
