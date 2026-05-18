import { Link } from "react-router-dom";
import { Github, Linkedin } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b">
    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
      <a href="/" className="font-mono text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
        preethi<span className="text-primary">.</span>builds
      </a>
      <div className="flex items-center gap-4">
        <a href="#about" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block">
          About
        </a>
        <a
          href="https://github.com/pretzelslab"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          aria-label="GitHub"
        >
          <Github className="w-4 h-4" />
        </a>
        <a
          href="https://www.linkedin.com/in/preetiraghuveer/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          aria-label="LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </a>
        <ThemeToggle />
        <a
          href="mailto:chinmayipriti@gmail.com"
          className="text-xs font-mono px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get in Touch
        </a>
      </div>
    </div>
  </nav>
);

export default Navbar;
