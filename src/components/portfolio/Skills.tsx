import { motion } from "framer-motion";

const skillGroups: { category: string; skills: string[]; wrap?: boolean }[] = [
  {
    category: "Leadership & Impact",
    skills: ["Technical Program Management", "Strategic Program Leadership", "Product and Business Portfolio Strategy", "Product and Operational Strategy", "Engineering Program Delivery", "Executive Stakeholder Collaboration", "Cross-Functional Operating Models", "Commercial Launch Excellence"],
  },
  {
    category: "Platforms & Tools",
    wrap: true,
    skills: ["Salesforce CRM / CPQ / CLM", "Zendesk", "Microsoft Dynamics CRM", "Dayforce HCM", "Power BI", "SQL Server", "KPI Dashboards", "Smartsheet", "Jira", "Confluence", "GitHub", "Notion", "Zapier", "NotebookLM", "Granola"],
  },
  {
    category: "Certifications",
    skills: ["AI for Everyone — DeepLearning.AI", "ML for Product Managers — Duke", "PMP — PMI", "PSM I — Scrum.org", "Salesforce Certified Admin"],
  },
  {
    category: "AI & Dev Tools",
    skills: ["Claude Code", "Lovable"],
  },
];

const Skills = () => {
  return (
    <section id="skills" className="py-16 px-6 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Skills & <span className="text-gradient">Expertise</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {skillGroups.map((group, gi) => (
            <motion.div
              key={group.category}
              className={group.wrap ? "lg:col-span-2" : ""}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.15 }}
            >
              <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
                {group.category}
              </h3>
              <div className={group.wrap ? "flex flex-wrap gap-2" : "space-y-3"}>
                {group.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-3 py-2 bg-card rounded-xl border text-[11px] font-medium text-muted-foreground shadow-card hover:shadow-elegant transition-shadow duration-300"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
