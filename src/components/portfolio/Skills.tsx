import { motion } from "framer-motion";

const SKILL_GROUPS = [
  {
    label: "Leadership",
    items: ["Technical Program Management", "Product & Business Strategy", "GTM Execution", "Engineering Delivery", "Cross-Functional Operating Models", "Executive Stakeholder Collaboration"],
  },
  {
    label: "Platforms",
    items: ["Salesforce CRM / CPQ / CLM", "Zendesk · Dayforce HCM", "Microsoft Dynamics", "Power BI", "SQL Server", "Smartsheet · Jira · Confluence", "GitHub"],
  },
  {
    label: "AI & Dev",
    items: ["Python & SQL", "PyTorch", "scikit-learn", "pandas", "matplotlib", "Google Colab", "LangGraph", "Agentic AI Safety", "HITL Design", "Claude Code", "Lovable", "Supabase", "React / TypeScript"],
  },
  {
    label: "Certifications",
    items: ["PMP — PMI", "PSM I — Scrum.org", "AI for Everyone — DeepLearning.AI", "ML for PMs — Duke", "Salesforce Certified Admin"],
  },
];

const Skills = () => (
  <section id="skills" className="py-10 px-6 border-t border-border/40">
    <div className="max-w-2xl mx-auto">
      <motion.h2
        className="text-2xl font-bold mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-gradient">Skills</span>
      </motion.h2>

      <div className="space-y-5">
        {SKILL_GROUPS.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: gi * 0.08 }}
            className="flex gap-4"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 w-24 shrink-0 mt-1">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="text-[11px] font-medium text-muted-foreground bg-muted/50 border border-border/60 px-2.5 py-1 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Skills;
