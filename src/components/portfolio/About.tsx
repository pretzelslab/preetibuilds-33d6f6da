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
              Product and program leader with 18+ years across B2B SaaS — HR tech, CRM, BI, and AI-driven platforms. I specialize in turning early product ideas into structured programs that product, engineering, and GTM teams can execute on.
            </p>
            <p>
              I've partnered with leadership teams to shape program structures, streamline operations, and move products from launch to scaled global adoption.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6">
            {[
              { value: "18+", label: "Years Exp." },
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
