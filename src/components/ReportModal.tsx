import { useCallback, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTheme } from "next-themes";
import { ArrowUpRight, X } from "lucide-react";

export type ReportView = { title: string; href: string };

// Radix Dialog supplies the focus trap, Esc, click-outside and body scroll lock. Focus return is
// done by hand because the triggers are plain anchors outside the dialog (see useReportModal).
const SCHEME_STYLE_ID = "site-theme-scheme";

// The reports style dark mode with @media (prefers-color-scheme: dark), and Chrome does not pass an iframe
// element's CSS color-scheme through to that query, so it would follow the OS instead of the site toggle.
// The frame is same-origin: switch each such media rule to "all" (site dark) or "not all" (site light)
// from here, and pin the root color-scheme so scrollbars match. The report files stay untouched.
function applySiteTheme(doc: Document | null | undefined, dark: boolean) {
  if (!doc?.documentElement) return;
  const wanted = dark ? "dark" : "light";
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      // Not `instanceof CSSMediaRule`: the frame's rules belong to its own window's classes.
      if (rule.constructor.name === "CSSMediaRule") {
        const media = rule as CSSMediaRule;
        const m = /prefers-color-scheme:\s*(dark|light)/.exec(media.conditionText);
        if (m) media.media.mediaText = m[1] === wanted ? "all" : "not all";
        else visit(media.cssRules);
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      /* cross-origin sheet: not ours to touch */
    }
  }
  let style = doc.getElementById(SCHEME_STYLE_ID);
  if (!style) {
    style = doc.createElement("style");
    style.id = SCHEME_STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = `:root { color-scheme: ${wanted}; }`;
}

export function ReportModal({
  view,
  onClose,
  returnFocusTo,
}: {
  view: ReportView | null;
  onClose: () => void;
  returnFocusTo: React.MutableRefObject<HTMLElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const syncFrame = useCallback(() => applySiteTheme(frameRef.current?.contentDocument, dark), [dark]);
  useEffect(syncFrame, [syncFrame, view]);
  return (
    <DialogPrimitive.Root open={view !== null} onOpenChange={open => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={e => {
            e.preventDefault();
            closeRef.current?.focus();
          }}
          onCloseAutoFocus={e => {
            e.preventDefault();
            returnFocusTo.current?.focus();
          }}
          className="fixed z-50 flex flex-col overflow-hidden border bg-background shadow-lg inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[90vw] sm:h-[90vh] sm:rounded-lg max-[720px]:!inset-0 max-[720px]:!w-screen max-[720px]:!h-[100dvh] max-[720px]:!translate-x-0 max-[720px]:!translate-y-0 max-[720px]:!left-0 max-[720px]:!top-0 max-[720px]:!rounded-none"
        >
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 shrink-0">
            <DialogPrimitive.Title className="text-sm font-semibold truncate flex-1 min-w-0">
              {view?.title}
            </DialogPrimitive.Title>
            {view && (
              <a
                href={view.href}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground whitespace-nowrap"
              >
                Open in new tab <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            <DialogPrimitive.Close
              ref={closeRef}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" /> Close
            </DialogPrimitive.Close>
          </div>
          {view && (
            <iframe
              key={view.href}
              ref={frameRef}
              src={view.href}
              title={view.title}
              // Same-origin frame: key events inside it do not reach the dialog, so forward Esc.
              onLoad={e => {
                e.currentTarget.contentDocument?.addEventListener("keydown", k => k.key === "Escape" && onClose());
                syncFrame();
              }}
              style={{ colorScheme: dark ? "dark" : "light" }}
              className="flex-1 w-full border-0"
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
