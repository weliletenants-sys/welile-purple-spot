import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RepaymentSchedule from "./pages/RepaymentSchedule";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import NotFound from "./pages/NotFound";
import { AccessCode } from "./components/AccessCode";

const queryClient = new QueryClient();

const App = () => {
  const [hasAccess, setHasAccess] = useState(() => {
    return localStorage.getItem("welile_access") === "granted";
  });

  if (!hasAccess) {
    return <AccessCode onAccessGranted={() => setHasAccess(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tenant/:tenantId" element={<RepaymentSchedule />} />
            <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
