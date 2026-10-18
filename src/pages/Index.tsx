import Navbar from "@/components/portfolio/Navbar";
import Hero from "@/components/portfolio/Hero";
import HomeSections from "@/components/portfolio/HomeSections";
import Contact from "@/components/portfolio/Contact";
import Footer from "@/components/portfolio/Footer";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const Index = () => {
  // Owner re-activation no longer happens via a URL hash shortcut — the
  // master code must never appear in a URL. To re-establish owner state
  // after localStorage is cleared, enter the code through a visible input
  // (any PageGate-protected page, or the AI Governance Tracker's own unlock
  // modal) — both now verify server-side via src/lib/masterCode.ts.
  useVisitLogger("/");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <HomeSections />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
