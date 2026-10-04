import { useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "lucide-react";

export type ReportView = { title: string; href: string };

// Radix Dialog supplies the focus trap, Esc, click-outside and body scroll lock. Focus return is
// done by hand because the triggers are plain anchors outside the dialog (see useReportModal).
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
              src={view.href}
              title={view.title}
              // Same-origin frame: key events inside it do not reach the dialog, so forward Esc.
              onLoad={e => e.currentTarget.contentDocument?.addEventListener("keydown", k => k.key === "Escape" && onClose())}
              className="flex-1 w-full border-0 bg-white"
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
