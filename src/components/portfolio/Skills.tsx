import { motion } from "framer-motion";

const skillGroups = [
  {
    category: "Leadership & Strategy",
    skills: ["Enterprise GTM & Commercialization", "AI Product Strategy & Monetization", "Subscription & Revenue Transformation", "Executive Advisory & Governance", "Cross-functional Operating Models"],
  },
  {
    category: "Platforms & Tools",
    skills: ["Salesforce CRM / CPQ / CLM", "Microsoft Dynamics CRM", "Dayforce HCM", "Power BI & SQL Server", "Zendesk · Zapier · Notion"],
  },
  {
    category: "Certifications",
    skills: ["AI for Everyone — DeepLearning.AI", "ML for Product Managers — Duke", "PMP — PMI", "PSM I — Scrum.org", "Salesforce Certified Admin"],
  },
];

const Skills = () => {
  return (
    <section id="skills" className="py-32 px-6 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Skills & <span className="text-gradient">Expertise</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-10">
          {skillGroups.map((group, gi) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.15 }}
            >
              <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6">
                {group.category}
              </h3>
              <div className="space-y-3">
                {group.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-4 py-3 bg-card rounded-xl border text-sm font-medium shadow-card hover:shadow-elegant transition-shadow duration-300"
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
