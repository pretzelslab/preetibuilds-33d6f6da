export type ProjectStatus = "live" | "preview" | "building" | "upcoming" | "discovery";

export type Project = {
  title: string;
  description: string;
  tags: string[];
  industries?: string[];
  status?: ProjectStatus;
  link?: string;
  externalLink?: string;
  locked?: boolean;
  /** Data-only for now — no card/detail UI renders these yet. */
  highlights?: string[];
  /** Data-only for now — no card/detail UI renders this yet. */
  repoLink?: string;
  /** Data-only for now — no card/detail UI renders this yet. */
  expandedContent?: {
    what: string[];
    why: string[];
    how: string[];
    useCase: string[];
    biggerPicture: string[];
  };
  /** Data-only for now — not wired into ProjectRow or any fade/mask preview (that pattern lives in PageGate, used only by locked detail pages). Path is relative to /public. */
  previewImage?: string;
  /** Data-only for now, same as previewImage — the paired detailed/tabular report screenshot. Path is relative to /public. */
  previewImageDetail?: string;
};

export type FeaturedStat = {
  value: string;
  label: string;
};

export type FeaturedCard = {
  domain: string;
  domainCls: string;
  title: string;
  problem: string;
  stats: FeaturedStat[];
  techStack?: string[];
  href: string;
  cta: string;
};
