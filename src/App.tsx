import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { InstallPrompt } from "@/components/InstallPrompt";
import { InstallBanner } from "@/components/InstallBanner";
import { HelpChatbot } from "@/components/HelpChatbot";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { useWhatsNew } from "@/hooks/useWhatsNew";
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
import ServiceCenterAnalytics from "./pages/ServiceCenterAnalytics";
import ServiceCenterManagement from "./pages/ServiceCenterManagement";
import ServiceCenterTransferAnalytics from "./pages/ServiceCenterTransferAnalytics";
import RecentlyAddedTenants from "./pages/RecentlyAddedTenants";
import RiskDashboard from "./pages/RiskDashboard";
import PipelineTenants from "./pages/PipelineTenants";
import PipelineAnalytics from "./pages/PipelineAnalytics";
import AgentManagement from "./pages/AgentManagement";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import LandlordManagement from "./pages/LandlordManagement";

const queryClient = new QueryClient();

const App = () => {
  const { showWhatsNew, markAsSeen, currentVersion } = useWhatsNew();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UpdatePrompt />
        <InstallPrompt />
        <WhatsNewModal 
          open={showWhatsNew} 
          onClose={markAsSeen} 
          version={currentVersion}
        />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <HelpChatbot />
          <InstallBanner />
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
            <Route path="/service-center-analytics" element={<ServiceCenterAnalytics />} />
            <Route path="/service-center-management" element={<ServiceCenterManagement />} />
            <Route path="/service-center-transfer-analytics" element={<ServiceCenterTransferAnalytics />} />
            <Route path="/recently-added" element={<RecentlyAddedTenants />} />
            <Route path="/risk-dashboard" element={<RiskDashboard />} />
            <Route path="/pipeline-tenants" element={<PipelineTenants />} />
            <Route path="/pipeline-analytics" element={<PipelineAnalytics />} />
            <Route path="/agent-management" element={<AgentManagement />} />
            <Route path="/landlord-management" element={<LandlordManagement />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
