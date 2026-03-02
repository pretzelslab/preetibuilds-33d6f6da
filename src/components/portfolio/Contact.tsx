import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
          <p className="text-muted-foreground mb-12">
            Have a project in mind or just want to chat? Drop me a message.
          </p>
        </motion.div>

        <motion.form
          className="space-y-5 text-left"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <Input placeholder="Name" className="rounded-xl h-12" />
            <Input placeholder="Email" type="email" className="rounded-xl h-12" />
          </div>
          <Input placeholder="Subject" className="rounded-xl h-12" />
          <Textarea placeholder="Your message..." className="rounded-xl min-h-[150px] resize-none" />
          <Button size="lg" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-full">
            Send Message
          </Button>
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;
