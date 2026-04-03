import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AIGovernanceTracker from "@/components/ai-governance/Tracker";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";

const AIGovernance = () => (
  <div className="min-h-screen bg-white relative">
    <DiagonalWatermark />
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portfolio
        </Link>
      </div>
    </nav>
    <AIGovernanceTracker />
  </div>
);

export default AIGovernance;
