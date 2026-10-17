import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";
import { HERO } from "@/data/homeConfig";

// Render every motion.* element as its plain tag; the animation props are irrelevant here.
vi.mock("framer-motion", () => {
  const strip = ({ initial, animate, transition, ...rest }: Record<string, unknown>) => rest;
  const motion = new Proxy({}, {
    get: (_t, tag: string) => ({ children, ...props }: { children?: React.ReactNode }) => {
      const Tag = tag as React.ElementType;
      return <Tag {...strip(props)}>{children}</Tag>;
    },
  });
  return { motion };
});

describe("Hero", () => {
  it("shows the role line and every visible stat", () => {
    render(<Hero />);
    expect(screen.getByText(HERO.role)).toBeTruthy();
    HERO.stats.filter((s) => s.visible).forEach((s) => expect(screen.getByText(s.value)).toBeTruthy());
  });

  it("hides stats flagged invisible", () => {
    render(<Hero />);
    expect(screen.queryAllByRole("listitem").length).toBe(HERO.stats.filter((s) => s.visible).length);
  });
});
