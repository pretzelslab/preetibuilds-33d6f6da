import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Let's <span className="text-gradient">Connect</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Have a project in mind or just want to chat? Drop me a message.
          </p>
          <a
            href="mailto:chinmayipriti@gmail.com"
            className="inline-flex items-center gap-3 text-lg sm:text-xl font-medium text-primary hover:opacity-80 transition-opacity"
          >
            <Mail className="w-5 h-5" />
            chinmayipriti@gmail.com
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
