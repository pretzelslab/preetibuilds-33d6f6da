import VisitorCounter from "./VisitorCounter";
import { Linkedin } from "lucide-react";

const Footer = () => (
  <footer className="border-t py-8 px-6">
    <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <p className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} Preethi Raghuveeran. All rights reserved.
        </p>
        <a
          href="https://www.linkedin.com/in/preetiraghuveer/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Linkedin className="w-3 h-3" /> LinkedIn
        </a>
      </div>
      <VisitorCounter />
    </div>
  </footer>
);

export default Footer;
