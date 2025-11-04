import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import RepaymentSchedule from "./pages/RepaymentSchedule";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import TopPerformers from "./pages/TopPerformers";
import RecordingActivity from "./pages/RecordingActivity";
import NotFound from "./pages/NotFound";
import BulkAddAdekeAnnet from "./pages/BulkAddAdekeAnnet";
import AutoImportTenants from "./pages/AutoImportTenants";
import MissedPayments from "./pages/MissedPayments";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import WithdrawalHistory from "./pages/WithdrawalHistory";
import MonthlySummary from "./pages/MonthlySummary";
import AgentPortalLogin from "./pages/AgentPortalLogin";
import AgentPortal from "./pages/AgentPortal";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UpdatePrompt />
        <InstallPrompt />
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
            <Route path="/recording-activity" element={<RecordingActivity />} />
            <Route path="/bulk-add" element={<BulkAddAdekeAnnet />} />
            <Route path="/auto-import" element={<AutoImportTenants />} />
            <Route path="/missed-payments" element={<MissedPayments />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/withdrawal-history" element={<WithdrawalHistory />} />
            <Route path="/monthly-summary" element={<MonthlySummary />} />
            <Route path="/agent-portal-login" element={<AgentPortalLogin />} />
            <Route path="/agent-portal" element={<AgentPortal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
