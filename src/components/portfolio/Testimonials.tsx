import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "One of the most strategic product leaders I've worked with — she bridges the gap between engineering and business like no one else.",
    author: "Jane Smith",
    role: "VP of Engineering",
    company: "TechCorp",
  },
  {
    quote: "Preethi's ability to take a product from 0→1 and then scale it is truly exceptional. She brings clarity to complex problems.",
    author: "Michael Chen",
    role: "CEO",
    company: "AI Ventures",
  },
  {
    quote: "A rare combination of deep technical understanding and sharp business acumen. She transformed our GTM approach entirely.",
    author: "Sarah Johnson",
    role: "CMO",
    company: "SaaS Global",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-gradient">Kind Words</span>
          </h2>
          <p className="text-muted-foreground">
            What colleagues and collaborators have to say.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border p-6 shadow-card flex flex-col"
            >
              <Quote className="w-5 h-5 text-primary/40 mb-3" />
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 flex-1 italic">
                "{t.quote}"
              </p>
              <div className="border-t pt-3">
                <p className="text-sm font-semibold text-foreground">{t.author}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
