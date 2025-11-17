import { useEffect, useState } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { BackToHome } from "@/components/BackToHome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck, DollarSign, TrendingUp, TrendingDown, Pencil, X, Zap, ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Filter, Wallet, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactButtons } from "@/components/ContactButtons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AgentPeriodicEarnings } from "@/components/AgentPeriodicEarnings";
import { useTenants } from "@/hooks/useTenants";
import { TenantCard } from "@/components/TenantCard";
import { AgentEarningsBreakdown } from "@/components/AgentEarningsBreakdown";
import { Badge } from "@/components/ui/badge";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { useEarningsNotifications } from "@/hooks/useEarningsNotifications";
import { EarningsNotificationDemo } from "@/components/EarningsNotificationDemo";
import { EditAgentDialog } from "@/components/EditAgentDialog";
import { BulkEditAgentsDialog } from "@/components/BulkEditAgentsDialog";
import { BulkEditUndoHistory } from "@/components/BulkEditUndoHistory";
import { useAgents } from "@/hooks/useAgents";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EarningsBreakdownModal } from "@/components/EarningsBreakdownModal";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { agentName: routeAgentName } = useParams();
  const [period, setPeriod] = useState<string>("all");
  const [withdrawingAgent, setWithdrawingAgent] = useState<string | null>(null);
  const [breakdownModalAgent, setBreakdownModalAgent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"earned" | "recording" | "tenants" | "available">("earned");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const { data: allAgents, isLoading } = useAgentEarnings(period);
  const { createRequest } = useWithdrawalRequests();
  const { data: agentsList } = useAgents();
  
  // Enable real-time earnings notifications for specific agent view
  useEarningsNotifications({
    agentName: routeAgentName ? decodeURIComponent(routeAgentName) : undefined,
    enabled: !!routeAgentName,
  });
  
  // Filter agents if viewing a specific agent
  const agents = routeAgentName 
    ? allAgents?.filter(agent => agent.agentName === decodeURIComponent(routeAgentName))
    : allAgents;

  // Apply search filter
  const filteredAgents = agents?.filter(agent => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    const nameMatch = agent.agentName.toLowerCase().includes(search);
    const phoneMatch = agent.agentPhone.toLowerCase().includes(search);
    return nameMatch || phoneMatch;
  });

  // Apply sorting
  const sortedAgents = filteredAgents?.slice().sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "earned":
        comparison = b.earnedCommission - a.earnedCommission;
        break;
      case "recording":
        comparison = (b.recordingBonuses || 0) - (a.recordingBonuses || 0);
        break;
      case "tenants":
        comparison = b.tenantsCount - a.tenantsCount;
        break;
      case "available":
        comparison = (((b.commissions || 0) + (b.recordingBonuses || 0) - (b.withdrawnCommission || 0)) - (((a.commissions || 0) + (a.recordingBonuses || 0) - (a.withdrawnCommission || 0))));
        break;
      default:
        comparison = 0;
    }
    return sortDirection === "desc" ? comparison : -comparison;
  });

  // Pagination calculations
  const totalPages = Math.ceil((sortedAgents?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = sortedAgents?.slice(startIndex, endIndex);

  // Reset to page 1 when period, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [period, searchTerm, sortBy, sortDirection]);

  // Fetch tenants for the specific agent
  const { tenants: agentTenants, isLoading: tenantsLoading } = useTenants({
    searchTerm: routeAgentName ? decodeURIComponent(routeAgentName) : "",
  });

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + ↑ = Ascending sort
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
        e.preventDefault();
        setSortDirection("asc");
        toast.success("Sort direction: Ascending (Low to High)");
      }
      // Ctrl/Cmd + ↓ = Descending sort
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
        e.preventDefault();
        setSortDirection("desc");
        toast.success("Sort direction: Descending (High to Low)");
      }
      // Ctrl/Cmd + K = Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("agent-search")?.focus();
      }
      // Ctrl/Cmd + R = Reset filters
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleResetFilters();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSortBy("earned");
    setSortDirection("desc");
    setPeriod("all");
    setCurrentPage(1);
    toast.success("All filters reset");
  };

  const hasActiveFilters = searchTerm !== "" || sortBy !== "earned" || sortDirection !== "desc" || period !== "all";

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "earned": return "Earned Commission";
      case "recording": return "Recording Bonuses";
      case "tenants": return "Tenant Count";
      case "available": return "Available Balance";
      default: return sort;
    }
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "all": return "All Time";
      case "daily": return "Today";
      case "weekly": return "Last 7 Days";
      case "monthly": return "Last 30 Days";
      default: return p;
    }
  };

  const handleWithdraw = async (agentPhone: string, agentName: string, amount: number) => {
    if (amount <= 0) {
      toast.error("No commission available to withdraw");
      return;
    }

    setWithdrawingAgent(agentPhone);
    
    try {
      await createRequest({
        agent_name: agentName,
        agent_phone: agentPhone,
        amount: amount,
      });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      toast.error("Failed to create withdrawal request");
    } finally {
      setWithdrawingAgent(null);
    }
  };

  const totalEarnedCommissions = agents?.reduce((sum, agent) => sum + agent.earnedCommission, 0) || 0;
  const totalExpectedCommissions = agents?.reduce((sum, agent) => sum + agent.expectedCommission, 0) || 0;
  const totalWithdrawnCommissions = agents?.reduce((sum, agent) => sum + agent.withdrawnCommission, 0) || 0;
  const totalAvailableCommissions = agents?.reduce((sum, agent) =>
    sum + (((agent.commissions || 0) + (agent.recordingBonuses || 0) - (agent.withdrawnCommission || 0))),
  0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <BackToHome />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <WelileLogo />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {routeAgentName ? decodeURIComponent(routeAgentName) : "Agent Dashboard"}
                </h1>
                <p className="text-sm text-muted-foreground">Commission tracking and earnings</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="agent-search"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
                className="pl-9"
                title="Keyboard shortcut: Ctrl/Cmd + K"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {agentsList && agentsList.length > 0 && !routeAgentName && (
                <BulkEditAgentsDialog
                  agents={agentsList}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
                    queryClient.invalidateQueries({ queryKey: ["agents"] });
                  }}
                />
              )}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[200px] bg-card">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="earned">Earned Commission</SelectItem>
                  <SelectItem value="recording">Recording Bonuses</SelectItem>
                  <SelectItem value="tenants">Tenant Count</SelectItem>
                  <SelectItem value="available">Available Balance</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant={sortDirection === "desc" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setSortDirection("desc")}
                  title="Sort Descending (High to Low) - Ctrl/Cmd + ↓"
                  className="shrink-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant={sortDirection === "asc" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setSortDirection("asc")}
                  title="Sort Ascending (Low to High) - Ctrl/Cmd + ↑"
                  className="shrink-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">Last 7 Days</SelectItem>
                <SelectItem value="monthly">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="default"
                onClick={handleResetFilters}
                title="Reset All Filters - Ctrl/Cmd + R"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <div className="mb-6 flex items-center gap-2 flex-wrap p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Active Filters:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {(sortBy !== "earned" || sortDirection !== "desc") && (
                <Badge variant="secondary" className="gap-1">
                  {getSortLabel(sortBy)} {sortDirection === "desc" ? "↓" : "↑"}
                </Badge>
              )}
              {period !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Period: {getPeriodLabel(period)}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="ml-auto text-xs hover:text-destructive"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        {isLoading ? (
          <div 
            className="grid gap-6 md:grid-cols-4 mb-8"
            role="region"
            aria-busy="true"
            aria-label="Loading agent commission statistics"
          >
            <span className="sr-only">Loading agent earnings and commission data...</span>
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton 
                      variant="fast" 
                      delay={index * 100} 
                      className="h-4 w-32"
                      ariaLabel={`Loading statistic ${index + 1} label`}
                    />
                    <Skeleton 
                      variant="slow" 
                      delay={index * 100 + 50} 
                      className="h-8 w-full"
                      ariaLabel={`Loading statistic ${index + 1} value`}
                    />
                  </div>
                  <Skeleton 
                    variant="default" 
                    delay={index * 100 + 100} 
                    className="h-12 w-12 rounded-lg"
                    ariaLabel="Loading icon"
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Expected Commission</p>
                  <p className="text-3xl font-bold text-foreground">UGX {totalExpectedCommissions.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Earned Commission</p>
                  <p className="text-3xl font-bold text-foreground">UGX {totalEarnedCommissions.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <DollarSign className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Withdrawn</p>
                  <p className="text-3xl font-bold text-foreground">UGX {totalWithdrawnCommissions.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Available</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">Withdrawal Rules</p>
                          <p className="text-xs"><strong>Withdrawable:</strong> Commissions + Recording Bonuses</p>
                          <p className="text-xs text-muted-foreground mt-1"><strong>Non-withdrawable:</strong> Pipeline bonuses (UGX 50), Data Entry, and Signup bonuses</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-3xl font-bold text-foreground">UGX {totalAvailableCommissions.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <UserCheck className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Undo History */}
        {!routeAgentName && <BulkEditUndoHistory />}

        {/* Pagination Controls - Top */}
        {!isLoading && sortedAgents && sortedAgents.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="6">6 agents</SelectItem>
                  <SelectItem value="12">12 agents</SelectItem>
                  <SelectItem value="24">24 agents</SelectItem>
                  <SelectItem value="50">50 agents</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedAgents.length)} of {sortedAgents.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            role="region"
            aria-busy="true"
            aria-label="Loading agent profiles"
          >
            <span className="sr-only">Loading agent profile cards...</span>
            {[...Array(6)].map((_, i) => (
              <Skeleton 
                key={i} 
                variant="slow" 
                delay={i * 80} 
                className="h-[180px]"
                ariaLabel={`Loading agent ${i + 1} profile`}
              />
            ))}
          </div>
        )}

        {/* Agent Cards */}
        {!isLoading && paginatedAgents && paginatedAgents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedAgents.map((agent) => (
              <Card
                key={agent.agentPhone}
                className="p-6 bg-gradient-to-br from-card to-primary/5 border-border hover:shadow-[var(--shadow-card)] transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Agent Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground truncate">{agent.agentName}</h3>
                        <EditAgentDialog
                          agent={{
                            id: agent.agentPhone,
                            name: agent.agentName,
                            phone: agent.agentPhone,
                            is_active: true,
                          }}
                          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["agentEarnings"] })}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </EditAgentDialog>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{agent.agentPhone}</p>
                        <ContactButtons phoneNumber={agent.agentPhone} iconOnly />
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Balance - Highlighted */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-destructive">Total Outstanding Balance</span>
                      <span className="text-2xl font-bold text-destructive">
                        UGX {(agent.totalOutstandingBalance || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Agent's collection obligation</p>
                  </div>

                  {/* Expected Collections */}
                  <div className="pt-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground mb-2">Expected Collections</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-card border border-border">
                        <p className="text-muted-foreground">Daily</p>
                        <p className="font-bold text-foreground">UGX {(agent.expectedCollectionDaily || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded bg-card border border-border">
                        <p className="text-muted-foreground">Weekly</p>
                        <p className="font-bold text-foreground">UGX {(agent.expectedCollectionWeekly || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded bg-card border border-border">
                        <p className="text-muted-foreground">Monthly</p>
                        <p className="font-bold text-foreground">UGX {(agent.expectedCollectionMonthly || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded bg-card border border-border">
                        <p className="text-muted-foreground">2 Months</p>
                        <p className="font-bold text-foreground">UGX {(agent.expectedCollectionTwoMonths || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded bg-card border border-border col-span-2">
                        <p className="text-muted-foreground">3 Months</p>
                        <p className="font-bold text-foreground">UGX {(agent.expectedCollectionThreeMonths || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Bonuses - PROMINENTLY SHOWN */}
                  {agent.pipelineBonuses > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-blue-600/20 border-3 border-blue-500 dark:border-blue-600 shadow-lg shadow-blue-500/20 animate-pulse hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 animate-bounce">
                            <TrendingUp className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-blue-900 dark:text-blue-100 tracking-wide">PIPELINE BONUSES 🎯</span>
                              <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white text-xs animate-pulse shadow-lg shadow-green-500/50">
                                UGX 50 per tenant
                              </Badge>
                            </div>
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mt-1">✓ WITHDRAWABLE</p>
                          </div>
                        </div>
                        <div className="text-center py-2 px-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-600/30">
                          <span className="text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight drop-shadow-lg">
                            UGX {agent.pipelineBonuses.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-center font-semibold text-blue-800 dark:text-blue-300 italic">🎉 Earned from adding pipeline tenants</p>
                      </div>
                    </div>
                  )}

                  {/* Recording Bonuses - MOST PROMINENT */}
                  {agent.recordingBonuses > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-400/15 to-amber-600/20 border-3 border-amber-500 dark:border-amber-600 shadow-lg shadow-amber-500/20 animate-pulse hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/50 animate-bounce">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-amber-900 dark:text-amber-100 tracking-wide">RECORDING BONUSES ⭐</span>
                              {agent.hasRecentRecordingActivity && (
                                <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white text-xs animate-pulse shadow-lg shadow-green-500/50">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mt-1">✓ WITHDRAWABLE</p>
                          </div>
                        </div>
                        <div className="text-center py-2 px-4 rounded-lg bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-600/30">
                          <span className="text-4xl font-black text-amber-900 dark:text-amber-100 tracking-tight drop-shadow-lg">
                            UGX {agent.recordingBonuses.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-center font-semibold text-amber-800 dark:text-amber-300 italic">💰 Earned from recording payments</p>
                      </div>
                    </div>
                  )}

                  {/* Commission Stats */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expected</span>
                      <span className="text-lg font-bold text-muted-foreground">
                        UGX {agent.expectedCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Earned</span>
                      <span className="text-xl font-bold text-primary">
                        UGX {agent.earnedCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Withdrawn</span>
                      <span className="text-lg font-semibold text-destructive">
                        UGX {agent.withdrawnCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-muted-foreground">Available</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm font-semibold mb-1">Withdrawal Rules</p>
                              <p className="text-xs"><strong>Withdrawable:</strong> Commissions + Recording Bonuses + Pipeline Bonuses</p>
                              <p className="text-xs text-muted-foreground mt-1"><strong>Non-withdrawable:</strong> Data Entry and Signup bonuses</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-xl font-bold text-accent">
                        UGX {(((agent.commissions || 0) + (agent.recordingBonuses || 0) + (agent.pipelineBonuses || 0) - (agent.withdrawnCommission || 0))).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tenants</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/?agent=${encodeURIComponent(agent.agentName)}`)}
                        className="h-auto p-1 hover:bg-primary/10"
                      >
                        <span className="text-sm font-semibold text-primary hover:underline">
                          {agent.tenantsCount}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Periodic Earnings */}
                  <AgentPeriodicEarnings agentName={agent.agentName} />

                  {/* Earnings Breakdown with Withdrawn Status */}
                  <div className="pt-4 border-t border-border">
                    <AgentEarningsBreakdown agentName={agent.agentName} period={period} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setBreakdownModalAgent(agent.agentName)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Full Breakdown
                    </Button>
                  </div>

                  {/* Withdraw Button */}
                  <div className="pt-3 border-t border-border">
                      <Button
                        className="w-full"
                        onClick={() => handleWithdraw(agent.agentPhone, agent.agentName, ((agent.commissions || 0) + (agent.recordingBonuses || 0) + (agent.pipelineBonuses || 0) - (agent.withdrawnCommission || 0)))}
                        disabled={withdrawingAgent === agent.agentPhone || (((agent.commissions || 0) + (agent.recordingBonuses || 0) + (agent.pipelineBonuses || 0) - (agent.withdrawnCommission || 0)) <= 0)}
                      >
                      {withdrawingAgent === agent.agentPhone ? "Processing..." : "Withdraw Commission"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls - Bottom */}
        {!isLoading && sortedAgents && sortedAgents.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedAgents.length)} of {sortedAgents.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!sortedAgents || sortedAgents.length === 0) && (
          <Card className="p-12 text-center bg-gradient-to-br from-card to-primary/5 border-border">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm ? "No agents found" : "No Agent Earnings Yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No agents match "${searchTerm}". Try a different search term.`
                : "Agent commissions will appear here once tenants make rent payments"
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            )}
          </Card>
        )}

        {/* Tenants List - Only show when viewing a specific agent */}
        {routeAgentName && (
          <div className="mt-12">
            {/* Notification Demo for testing */}
            {paginatedAgents && paginatedAgents.length > 0 && (
              <EarningsNotificationDemo
                agentName={paginatedAgents[0].agentName}
                agentPhone={paginatedAgents[0].agentPhone}
              />
            )}
            
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Tenants ({agentTenants.length})
            </h2>
            {tenantsLoading ? (
              <div 
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                role="region"
                aria-busy="true"
                aria-label="Loading agent tenants"
              >
                <span className="sr-only">Loading tenant information for this agent...</span>
                {[...Array(6)].map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="slow" 
                    delay={i * 80} 
                    className="h-[300px]"
                    ariaLabel={`Loading tenant ${i + 1} card`}
                  />
                ))}
              </div>
            ) : agentTenants.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agentTenants.map((tenant) => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-gradient-to-br from-card to-primary/5 border-border">
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Tenants Yet</h3>
                <p className="text-muted-foreground">
                  Tenants assigned to this agent will appear here
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 Welile Tenants Hub. All rights reserved.</p>
          <p className="mt-1">Commission rate: 5% of rent repayments</p>
        </div>
      </div>

      {/* Earnings Breakdown Modal */}
      {breakdownModalAgent && (
        <EarningsBreakdownModal
          open={!!breakdownModalAgent}
          onOpenChange={(open) => !open && setBreakdownModalAgent(null)}
          agentName={breakdownModalAgent}
          earnings={{
            commissions: agents?.find(a => a.agentName === breakdownModalAgent)?.commissions || 0,
            recordingBonuses: agents?.find(a => a.agentName === breakdownModalAgent)?.recordingBonuses || 0,
            pipelineBonuses: agents?.find(a => a.agentName === breakdownModalAgent)?.pipelineBonuses || 0,
            dataEntryRewards: agents?.find(a => a.agentName === breakdownModalAgent)?.dataEntryRewards || 0,
            signupBonuses: agents?.find(a => a.agentName === breakdownModalAgent)?.signupBonuses || 0,
            withdrawnCommission: agents?.find(a => a.agentName === breakdownModalAgent)?.withdrawnCommission || 0,
          }}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
