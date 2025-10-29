import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import Index from "./pages/Index";
import RepaymentSchedule from "./pages/RepaymentSchedule";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import TopPerformers from "./pages/TopPerformers";
import NotFound from "./pages/NotFound";
import BulkAddAdekeAnnet from "./pages/BulkAddAdekeAnnet";
import AutoImportTenants from "./pages/AutoImportTenants";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UpdatePrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tenant/:tenantId" element={<RepaymentSchedule />} />
            <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/agent/:agentName" element={<AgentDashboard />} />
            <Route path="/top-performers" element={<TopPerformers />} />
            <Route path="/bulk-add" element={<BulkAddAdekeAnnet />} />
            <Route path="/auto-import" element={<AutoImportTenants />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
