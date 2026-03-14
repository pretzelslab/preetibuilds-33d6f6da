import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import MedLog from "./pages/MedLog";
import GTMTechStack from "./pages/GTMTechStack";
import NotFound from "./pages/NotFound";
import Research from "./pages/Research";
import AIGovernance from "./pages/AIGovernance";
import ProductIntelligence from "./pages/ProductIntelligence";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/medlog" element={<MedLog />} />
            <Route path="/gtm-techstack" element={<GTMTechStack />} />
            <Route path="/research" element={<Research />} />
            <Route path="/ai-governance" element={<AIGovernance />} />
            <Route path="/product-intelligence" element={<ProductIntelligence />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
