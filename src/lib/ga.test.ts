import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldLoadGA, loadGA, GA_MEASUREMENT_ID } from "./ga";

describe("shouldLoadGA — fails closed on any ambiguity, for the owner's privacy", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns true only on an explicit isOwner:false from the server", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ isOwner: false }) });
    expect(await shouldLoadGA()).toBe(true);
  });

  it("returns false when the server says this is the owner", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ isOwner: true }) });
    expect(await shouldLoadGA()).toBe(false);
  });

  it("returns false (not true) on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ isOwner: false }) });
    expect(await shouldLoadGA()).toBe(false);
  });

  it("returns false on a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    expect(await shouldLoadGA()).toBe(false);
  });

  it("returns false on an unexpected response shape", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    expect(await shouldLoadGA()).toBe(false);
  });
});

describe("loadGA — injects the gtag script exactly once", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    (window as typeof window & { dataLayer?: unknown[] }).dataLayer = undefined;
  });

  it("appends the gtag script tag with the correct measurement id, and never appends it twice", () => {
    loadGA(GA_MEASUREMENT_ID);
    loadGA(GA_MEASUREMENT_ID); // second call must be a no-op

    const scripts = document.head.querySelectorAll(`script[src*="googletagmanager.com/gtag/js"]`);
    expect(scripts.length).toBe(1);
    expect(scripts[0].getAttribute("src")).toContain(GA_MEASUREMENT_ID);

    const dataLayer = (window as typeof window & { dataLayer?: unknown[] }).dataLayer;
    expect(dataLayer).toBeDefined();
    expect(dataLayer!.some((entry) => JSON.stringify(entry).includes("config"))).toBe(true);
  });
});
