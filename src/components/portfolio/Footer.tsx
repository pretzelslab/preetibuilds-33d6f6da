import VisitorCounter from "./VisitorCounter";

const Footer = () => (
  <footer className="border-t py-8 px-6">
    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()} Preethi Raghuveeran. All rights reserved.
      </p>
      <VisitorCounter />
    </div>
  </footer>
);

export default Footer;
