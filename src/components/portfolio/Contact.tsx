import { motion } from "framer-motion";

const Contact = () => (
  <section id="contact" className="py-16 px-6 border-t border-border/40">
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-bold mb-4">
          <span className="text-gradient">Get in Touch</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Open to conversations around product, GTM, AI governance, and building things.
        </p>
        <a
          href="mailto:chinmayipriti@gmail.com"
          className="text-sm font-medium text-primary hover:opacity-75 transition-opacity"
        >
          chinmayipriti@gmail.com →
        </a>
        <p className="mt-6 text-xs text-muted-foreground/50">
          Worked together?{" "}
          <a
            href="https://forms.gle/ei18MZAb1Aqnwe5cA"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            Leave a recommendation
          </a>
        </p>
      </motion.div>
    </div>
  </section>
);

export default Contact;
