import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";
import { HERO, CORE_STRENGTHS, OPEN_TO } from "@/data/homeConfig";

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
  it("shows the role line, stat card and core strengths", () => {
    render(<Hero />);
    expect(screen.getByText(HERO.role)).toBeTruthy();
    expect(screen.getByText(HERO.statCard.value)).toBeTruthy();
    CORE_STRENGTHS.forEach((t) => expect(screen.getByText(t)).toBeTruthy());
  });

  it("does not render the Open to card while OPEN_TO_VISIBLE is false", () => {
    render(<Hero />);
    expect(screen.queryByText(OPEN_TO.availability)).toBeNull();
  });
});
