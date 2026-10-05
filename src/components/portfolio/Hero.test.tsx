import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";
import {
  PRODUCT_INTELLIGENCE_SYSTEMS,
  ENTERPRISE_ASSESSMENT,
  GOVERNANCE_COMPLIANCE,
  SAFETY_EVALUATION,
} from "@/data/projects";

// Render every motion.* element as its plain tag; the animation props are irrelevant here.
vi.mock("framer-motion", () => {
  const strip = ({ initial, animate, whileHover, variants, transition, ...rest }: Record<string, unknown>) => rest;
  const motion = new Proxy({}, {
    get: (_t, tag: string) => ({ children, ...props }: { children?: React.ReactNode }) => {
      const Tag = tag as React.ElementType;
      return <Tag {...strip(props)}>{children}</Tag>;
    },
  });
  return { motion };
});

const CATEGORIES = [
  { label: "Product & Intelligence Systems", projects: PRODUCT_INTELLIGENCE_SYSTEMS },
  { label: "Enterprise Assessment & Decision Systems", projects: ENTERPRISE_ASSESSMENT },
  { label: "Governance & Compliance", projects: GOVERNANCE_COMPLIANCE },
  { label: "Safety & Evaluation", projects: SAFETY_EVALUATION },
];

describe("Hero Portfolio Focus counts", () => {
  it.each(CATEGORIES)("$label shows the number of projects in that category", ({ label, projects }) => {
    render(<Hero />);
    const row = screen.getByText(label).parentElement as HTMLElement;
    expect(row.textContent).toContain(`${projects.length} →`);
  });
});
