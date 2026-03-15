import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ClientDiscovery from "@/components/ai-governance/ClientDiscovery";
import { PageGate } from "@/components/ui/PageGate";

const ClientDiscoveryPage = () => (
  <PageGate>
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to="/ai-governance"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to AI Governance Tracker
          </Link>
        </div>
      </nav>
      <ClientDiscovery />
    </div>
  </PageGate>
);

export default ClientDiscoveryPage;
