import { describe, it, expect } from "vitest";
import { OUTCOMES, GOVERNANCE_TILES, ASSURANCE_TILES } from "./homeConfig";
import {
  PRODUCT_INTELLIGENCE_SYSTEMS,
  ENTERPRISE_ASSESSMENT,
  GOVERNANCE_COMPLIANCE,
  SAFETY_EVALUATION,
  RESEARCH_VENTURES_VENTURE,
  RESEARCH_VENTURES_APPLIED,
  RESEARCH_LAB_FORESIGHT,
  RESEARCH_LAB_SUSTAINABLE_AI,
  RESEARCH_LAB_PERSONAL,
} from "./projects";

const linksOf = (items: { link?: string }[]) =>
  items.map(i => i.link).filter((l): l is string => !!l);

// Everything Home renders as a tile or project row.
const homeLinks = new Set([
  ...linksOf(OUTCOMES),
  ...linksOf(GOVERNANCE_TILES),
  ...linksOf(ASSURANCE_TILES),
  ...linksOf(PRODUCT_INTELLIGENCE_SYSTEMS),
  ...linksOf(ENTERPRISE_ASSESSMENT),
  ...linksOf(GOVERNANCE_COMPLIANCE),
  ...linksOf(SAFETY_EVALUATION),
]);

// Research pages that are not also Home projects. /algorithmic-fairness is a Home
// project that research links to, so it is excluded by being in homeLinks.
const researchOnly = [
  ...linksOf(RESEARCH_VENTURES_VENTURE),
  ...linksOf(RESEARCH_VENTURES_APPLIED),
  ...linksOf(RESEARCH_LAB_FORESIGHT),
  ...linksOf(RESEARCH_LAB_SUSTAINABLE_AI),
  ...linksOf(RESEARCH_LAB_PERSONAL),
].filter(l => l !== "/algorithmic-fairness");

describe("Home vs research separation", () => {
  it("no Home tile links to a research-only route", () => {
    const leaked = researchOnly.filter(l => homeLinks.has(l));
    expect(leaked).toEqual([]);
  });

  it("AI Value Lab stays a Home project", () => {
    expect(homeLinks.has("/ai-value-lab")).toBe(true);
  });
});
