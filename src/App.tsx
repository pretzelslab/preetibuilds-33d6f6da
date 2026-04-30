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
import MelodicFramework from "./pages/MelodicFramework";
import AIReadinessAssessment from "./pages/AIReadinessAssessment";
import AlgorithmicFairnessAuditor from "./pages/AlgorithmicFairnessAuditor";
import CarbonFairnessFrontier from "./pages/CarbonFairnessFrontier";
import CarbonDepth from "./pages/CarbonDepth";
import ComplianceAgent from "./pages/ComplianceAgent";
import SustainabilityStandards from "./pages/SustainabilityStandards";
import SustainabilityFramework from "./pages/SustainabilityFramework";
import Admin from "./pages/Admin";
import AIWebinar from "./pages/AIWebinar";
import PrivacyAuditor from "./pages/PrivacyAuditor";
import LLMSafetyEval from "./pages/LLMSafetyEval";
import CarbonTimeTravel from "./pages/CarbonTimeTravel";
import AgentHijacking from "./pages/AgentHijacking";
import AgentDrift from "./pages/AgentDrift";
import CarbonRouter from "./pages/CarbonRouter";

const queryClient = new QueryClient();

const ROUTE_TITLES: Record<string, string> = {
  "/":                    "Preeti Builds",
  "/medlog":              "MedLog | Preeti Builds",
  "/ai-governance":       "AI Governance Tracker | Preeti Builds",
  "/client-discovery":    "Client Discovery Workbook | Preeti Builds",
  "/gtm-techstack":       "GTM Tech Stack | Preeti Builds",
  "/product-intelligence":"Product Intelligence | Preeti Builds",
  "/research":            "Research | Preeti Builds",
  "/melodic-framework":        "Melodic Framework (Raaga) | Preeti Builds",
  "/ai-readiness":             "AI Readiness Assessment | Preeti Builds",
  "/algorithmic-fairness":      "Algorithmic Fairness Auditor | Preeti Builds",
  "/carbon-fairness":           "Carbon-Fairness Efficiency Frontier | Preeti Builds",
  "/carbon-depth":              "AI Carbon Footprint Calculator | Preeti Builds",
  "/compliance-agent":          "AI Compliance Monitoring Agent | Preeti Builds",
  "/sustainability-standards":  "AI Sustainability Standards Tracker | Preeti Builds",
  "/sustainability-framework":  "AI Sustainability Disclosure Framework | Preeti Builds",
  "/admin":                     "Admin | Preeti Builds",
  "/ai-sustainability-webinar": "AI Sustainability Webinar | Preeti Builds",
  "/privacy-auditor":           "Privacy Impact Auditor | Preeti Builds",
  "/safety-eval":               "LLM Safety Eval Framework | Preeti Builds",
  "/carbon-time-travel":        "Carbon Time Travel | Preeti Builds",
  "/agent-hijacking":           "Agent Goal Hijacking Demo | Preeti Builds",
  "/agent-drift":               "Rogue Agent & Goal Drift Detector | Preeti Builds",
  "/carbon-router":             "Carbon-Aware LLM Inference Router | Preeti Builds",
};

const RouteTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] ?? "Preeti Builds";
    // Scroll to top on every route change (unless returning to / which has hash anchors)
    if (pathname !== "/") window.scrollTo({ top: 0, behavior: "instant" });
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
            <Route path="/melodic-framework" element={<MelodicFramework />} />
            <Route path="/ai-readiness" element={<AIReadinessAssessment />} />
            <Route path="/algorithmic-fairness" element={<AlgorithmicFairnessAuditor />} />
            <Route path="/carbon-fairness" element={<CarbonFairnessFrontier />} />
            <Route path="/carbon-depth" element={<CarbonDepth />} />
            <Route path="/compliance-agent" element={<ComplianceAgent />} />
            <Route path="/sustainability-standards" element={<SustainabilityStandards />} />
            <Route path="/sustainability-framework" element={<SustainabilityFramework />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ai-sustainability-webinar" element={<AIWebinar />} />
            <Route path="/privacy-auditor" element={<PrivacyAuditor />} />
            <Route path="/safety-eval" element={<LLMSafetyEval />} />
            <Route path="/carbon-time-travel" element={<CarbonTimeTravel />} />
            <Route path="/agent-hijacking" element={<AgentHijacking />} />
            <Route path="/agent-drift" element={<AgentDrift />} />
            <Route path="/carbon-router" element={<CarbonRouter />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
