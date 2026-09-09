import "@testing-library/jest-dom";

// jsdom's AbortSignal doesn't implement the static .timeout() helper that
// real browsers/Vercel edge runtime have — polyfill so code using it (e.g.
// useVisitLogger's geo fetch) exercises its real fetch path under test
// instead of always hitting the catch block.
if (typeof AbortSignal.timeout !== "function") {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
