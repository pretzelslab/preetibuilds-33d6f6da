import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AIGovernanceTracker from "@/components/ai-governance/Tracker";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const AIGovernance = () => {
  useVisitLogger("/ai-governance");
  return (
    <div className="min-h-screen bg-background relative">
      <DiagonalWatermark />
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link
            to="/#projects"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Portfolio
          </Link>
        </div>
      </nav>
      <AIGovernanceTracker />
    </div>
  );
};

export default AIGovernance;
