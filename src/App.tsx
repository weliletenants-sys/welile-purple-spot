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
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SyncIndicator } from "@/components/SyncIndicator";
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHint } from "@/components/KeyboardShortcutsHint";
import { OfflineQueueProvider } from "@/contexts/OfflineQueueContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useWhatsNew } from "@/hooks/useWhatsNew";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy load all other pages for faster initial load
const RepaymentSchedule = lazy(() => import("./pages/RepaymentSchedule"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const TopPerformers = lazy(() => import("./pages/TopPerformers"));
const RecordingActivity = lazy(() => import("./pages/RecordingActivity"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BulkAddAdekeAnnet = lazy(() => import("./pages/BulkAddAdekeAnnet"));
const AutoImportTenants = lazy(() => import("./pages/AutoImportTenants"));
const MissedPayments = lazy(() => import("./pages/MissedPayments"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WithdrawalHistory = lazy(() => import("./pages/WithdrawalHistory"));
const MonthlySummary = lazy(() => import("./pages/MonthlySummary"));
const AgentPortalLogin = lazy(() => import("./pages/AgentPortalLogin"));
const AgentPortal = lazy(() => import("./pages/AgentPortal"));
const ServiceCenterAnalytics = lazy(() => import("./pages/ServiceCenterAnalytics"));
const ServiceCenterManagement = lazy(() => import("./pages/ServiceCenterManagement"));
const ServiceCenterTransferAnalytics = lazy(() => import("./pages/ServiceCenterTransferAnalytics"));
const RecentlyAddedTenants = lazy(() => import("./pages/RecentlyAddedTenants"));
const RiskDashboard = lazy(() => import("./pages/RiskDashboard"));
const PipelineTenants = lazy(() => import("./pages/PipelineTenants"));
const PipelineAnalytics = lazy(() => import("./pages/PipelineAnalytics"));
const AgentManagement = lazy(() => import("./pages/AgentManagement"));
const AgentActivityLog = lazy(() => import("./pages/AgentActivityLog"));
const AgentPerformanceDashboard = lazy(() => import("./pages/AgentPerformanceDashboard"));
const AgentDetailPage = lazy(() => import("./pages/AgentDetailPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LandlordManagement = lazy(() => import("./pages/LandlordManagement"));
const LandlordProfile = lazy(() => import("./pages/LandlordProfile"));
const AddPipelineTenant = lazy(() => import("./pages/AddPipelineTenant"));
const ReferralDashboard = lazy(() => import("./pages/ReferralDashboard"));
const PendingTenants = lazy(() => import("./pages/PendingTenants"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
      gcTime: 10 * 60 * 1000, // 10 minutes cache time
      refetchOnWindowFocus: false, // Don't refetch on every focus
      retry: 1, // Only retry once on failure
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const { showWhatsNew, markAsSeen, currentVersion } = useWhatsNew();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineQueueProvider>
          <OfflineIndicator />
          <SyncIndicator />
          <KeyboardShortcutsHint />
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
            <CommandPalette />
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                  <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center px-4 gap-4">
                      <SidebarTrigger />
                      <div className="flex-1">
                        <HelpChatbot />
                      </div>
                    </div>
                  </header>
                  <InstallBanner />
                  <DynamicBreadcrumb />
                  <main className="flex-1">
                    <Suspense fallback={<PageLoader />}>
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
              <Route path="/agent-activity-log" element={<AgentActivityLog />} />
              <Route path="/agent-performance" element={<AgentPerformanceDashboard />} />
              <Route path="/agent/:agentPhone" element={<AgentDetailPage />} />
              <Route path="/landlord-management" element={<LandlordManagement />} />
              <Route path="/landlord/:landlordContact" element={<LandlordProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/add-pipeline" element={<AddPipelineTenant />} />
              <Route path="/referral-dashboard" element={<ReferralDashboard />} />
              <Route path="/pending-tenants" element={<PendingTenants />} />
              <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </OfflineQueueProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
