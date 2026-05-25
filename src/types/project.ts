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
