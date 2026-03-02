import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="about" className="py-32 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="aspect-[4/5] rounded-2xl bg-gradient-primary opacity-80 relative overflow-hidden">
            <div className="absolute inset-0 bg-card/20 backdrop-blur-sm flex items-end p-8">
              <p className="font-mono text-sm text-primary-foreground/80">// your photo here</p>
            </div>
          </div>
        </motion.div>

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
              I'm a passionate software engineer with a love for building clean, 
              scalable, and user-centric applications. With experience across the 
              full stack, I thrive at the intersection of design and engineering.
            </p>
            <p>
              When I'm not coding, you'll find me exploring new technologies, 
              contributing to open-source, or sharing knowledge through writing 
              and mentoring.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6">
            {[
              { value: "5+", label: "Years Exp." },
              { value: "30+", label: "Projects" },
              { value: "10+", label: "Open Source" },
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
