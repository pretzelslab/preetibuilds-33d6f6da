import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Pipeline from "@/components/product-intelligence/Pipeline";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const ProductIntelligence = () => {
  useVisitLogger("/product-intelligence");
  return (
    <div className="min-h-screen bg-white relative">
      <DiagonalWatermark />
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md border-gray-200">
        <div className="max-w-[1100px] mx-auto px-6 py-4">
          <Link
            to="/#projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>
      <Pipeline />
    </div>
  );
};

export default ProductIntelligence;
