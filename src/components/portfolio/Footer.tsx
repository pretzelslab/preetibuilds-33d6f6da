import VisitorCounter from "./VisitorCounter";

const Footer = () => (
  <footer className="border-t py-10 px-6">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground font-mono">
        © {new Date().getFullYear()} Preethi Raghuveeran. Built with passion.
      </p>
      <VisitorCounter />
    </div>
  </footer>
);

export default Footer;
