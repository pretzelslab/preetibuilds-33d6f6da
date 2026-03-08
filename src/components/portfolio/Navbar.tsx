import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Desktop */}
        <div className="hidden md:flex gap-2 items-center">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground px-4 py-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="mailto:chinmayipriti@gmail.com"
          className="hidden md:inline-flex text-sm font-mono px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get in Touch
        </a>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          className="md:hidden border-b bg-background px-6 pb-6 space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm text-muted-foreground hover:text-primary font-mono"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="mailto:chinmayipriti@gmail.com"
            className="block text-sm font-mono text-primary hover:opacity-80"
            onClick={() => setOpen(false)}
          >
            Get in Touch
          </a>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
