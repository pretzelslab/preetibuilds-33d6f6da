import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Pipeline from "@/components/product-intelligence/Pipeline";
import { PageGate } from "@/components/ui/PageGate";

const ProductIntelligence = () => (
  <PageGate>
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to="/#projects"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>
      <Pipeline />
    </div>
  </PageGate>
);

export default ProductIntelligence;
