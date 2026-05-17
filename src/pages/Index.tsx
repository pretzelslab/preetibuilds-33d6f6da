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
    </main>
  );
};

export default Index;
