import { motion } from "framer-motion";

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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
          {/* Column 1: Leadership & Impact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
              Leadership & Impact
            </h3>
            <div className="space-y-3">
              {["Technical Program Management", "Strategic Program Leadership", "Product & Business Portfolio Strategy", "Product & Operational Strategy", "Engineering Program Delivery", "Executive Stakeholder Collaboration", "Cross-Functional Operating Models", "Commercial Launch Excellence"].map((skill) => (
                <div key={skill} className="px-3 py-2 bg-card rounded-xl border text-[11px] font-medium text-muted-foreground shadow-card hover:shadow-elegant transition-shadow duration-300">
                  {skill}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Column 2: Platforms & Tools */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
              Platforms & Tools
            </h3>
            <div className="space-y-3">
              {["Salesforce CRM / CPQ / CLM", "Zendesk, Dayforce HCM", "Microsoft Dynamics CRM", "Power BI, KPI Dashboards", "SQL Server", "Smartsheet, Jira, Confluence", "Zapier, Notion, Granola, NotebookLM", "GitHub"].map((skill) => (
                <div key={skill} className="px-3 py-2 bg-card rounded-xl border text-[11px] font-medium text-muted-foreground shadow-card hover:shadow-elegant transition-shadow duration-300">
                  {skill}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Column 3: AI & Dev Tools */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
              AI & Dev Tools
            </h3>
            <div className="space-y-3">
              {["Claude Code", "Lovable"].map((skill) => (
                <div key={skill} className="px-3 py-2 bg-card rounded-xl border text-[11px] font-medium text-muted-foreground shadow-card hover:shadow-elegant transition-shadow duration-300">
                  {skill}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Column 4: Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
              Certifications
            </h3>
            <div className="space-y-3">
              {["AI for Everyone — DeepLearning.AI", "ML for Product Managers — Duke", "PMP — PMI", "PSM I — Scrum.org", "Salesforce Certified Admin"].map((skill) => (
                <div key={skill} className="px-3 py-2 bg-card rounded-xl border text-[11px] font-medium text-muted-foreground shadow-card hover:shadow-elegant transition-shadow duration-300">
                  {skill}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
