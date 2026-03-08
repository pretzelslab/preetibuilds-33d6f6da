import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="about" className="py-6 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            About <span className="text-gradient">Me</span>
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Strategic SaaS platform & product operations leader with 22+ years 
              of experience driving 0→1 launches and 1→N scaling across HR technology, 
              CRM, BI, and AI platforms.
            </p>
            <p>
              Proven track record in enterprise product commercialization, cross-functional 
              execution, and translating ambiguity into structured, high-impact programs 
              that accelerate growth, adoption, and revenue.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6">
            {[
              { value: "22+", label: "Years Exp." },
              { value: "3×", label: "Revenue Growth" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-mono">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
