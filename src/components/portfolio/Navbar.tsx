import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b">
    <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
      <a href="/" className="font-mono text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
        preethi<span className="text-primary">.</span>builds
      </a>
      <div className="flex items-center gap-4">
        <Link to="/research" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
          Research
        </Link>
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
