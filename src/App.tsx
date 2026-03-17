import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import Index from "./pages/Index";
import MedLog from "./pages/MedLog";
import GTMTechStack from "./pages/GTMTechStack";
import NotFound from "./pages/NotFound";
import Research from "./pages/Research";
import AIGovernance from "./pages/AIGovernance";
import ProductIntelligence from "./pages/ProductIntelligence";
import ClientDiscovery from "./pages/ClientDiscovery";

const queryClient = new QueryClient();

const ROUTE_TITLES: Record<string, string> = {
  "/":                    "Preeti Builds",
  "/medlog":              "MedLog | Preeti Builds",
  "/ai-governance":       "AI Governance Tracker | Preeti Builds",
  "/client-discovery":    "Client Discovery Workbook | Preeti Builds",
  "/gtm-techstack":       "GTM Tech Stack | Preeti Builds",
  "/product-intelligence":"Product Intelligence | Preeti Builds",
  "/research":            "Research | Preeti Builds",
};

const RouteTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] ?? "Preeti Builds";
  }, [pathname]);
  return null;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteTitle />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/medlog" element={<MedLog />} />
            <Route path="/gtm-techstack" element={<GTMTechStack />} />
            <Route path="/research" element={<Research />} />
            <Route path="/ai-governance" element={<AIGovernance />} />
            <Route path="/product-intelligence" element={<ProductIntelligence />} />
            <Route path="/client-discovery" element={<ClientDiscovery />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
