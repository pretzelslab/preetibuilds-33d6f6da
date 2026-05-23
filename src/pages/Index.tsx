import { useState, useEffect } from "react";
import Navbar from "@/components/portfolio/Navbar";
import Hero from "@/components/portfolio/Hero";
import CredibilityStrip from "@/components/portfolio/CredibilityStrip";
import FeaturedWork from "@/components/portfolio/FeaturedWork";
import Projects from "@/components/portfolio/Projects";
import Writing from "@/components/portfolio/Writing";
import About from "@/components/portfolio/About";
import Contact from "@/components/portfolio/Contact";
import Footer from "@/components/portfolio/Footer";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  );
};

const Index = () => {
  useVisitLogger("/");
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <CredibilityStrip />
      <FeaturedWork />
      <Projects />
      <Writing />
      <About />
      <Contact />
      <Footer />
      <BackToTop />
    </main>
  );
};

export default Index;
