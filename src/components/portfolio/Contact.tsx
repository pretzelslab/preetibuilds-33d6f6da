import { motion } from "framer-motion";
import Comments from "./Comments";

const Contact = () => (
  <section id="contact" className="py-16 px-6 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left — contact info */}
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
            className="inline-flex items-center gap-1.5 text-xs font-mono px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            chinmayipriti@gmail.com →
          </a>
          <p className="mt-6 text-xs text-muted-foreground/50">
            Worked together?{" "}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfiQ0ARkaWb5mRUml705lRk2KuuV2AHu0y4SDLhuoIKYGMDAA/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-muted-foreground transition-colors"
            >
              Leave a recommendation
            </a>
          </p>
        </motion.div>

        {/* Right — guestbook comments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Comments />
        </motion.div>
      </div>
    </div>
  </section>
);

export default Contact;
