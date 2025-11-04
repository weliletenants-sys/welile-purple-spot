import { useEffect, useState } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck, DollarSign, TrendingUp, TrendingDown, Pencil, Check, X, Zap, ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";
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

const AgentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { agentName: routeAgentName } = useParams();
  const [period, setPeriod] = useState<string>("all");
  const [withdrawingAgent, setWithdrawingAgent] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const [editedPhone, setEditedPhone] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"earned" | "recording" | "tenants" | "available">("earned");
  const { data: allAgents, isLoading } = useAgentEarnings(period);
  
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
    switch (sortBy) {
      case "earned":
        return b.earnedCommission - a.earnedCommission;
      case "recording":
        return (b.recordingBonuses || 0) - (a.recordingBonuses || 0);
      case "tenants":
        return b.tenantsCount - a.tenantsCount;
      case "available":
        return (b.earnedCommission - b.withdrawnCommission) - (a.earnedCommission - a.withdrawnCommission);
      default:
        return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil((sortedAgents?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = sortedAgents?.slice(startIndex, endIndex);

  // Reset to page 1 when period, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [period, searchTerm, sortBy]);

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

  const handleEdit = (agentPhone: string, agentName: string) => {
    setEditingAgent(agentPhone);
    setEditedName(agentName);
    setEditedPhone(agentPhone);
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setEditedName("");
    setEditedPhone("");
  };

  const handleSaveEdit = async (oldPhone: string) => {
    if (!editedName.trim()) {
      toast.error("Agent name is required");
      return;
    }

    if (!editedPhone.trim()) {
      toast.error("Agent phone is required");
      return;
    }

    if (!/^[0-9+\s-()]+$/.test(editedPhone)) {
      toast.error("Invalid phone format");
      return;
    }

    try {
      // Update tenants table
      const { error: tenantsError } = await supabase
        .from("tenants")
        .update({
          agent_name: editedName,
          agent_phone: editedPhone,
        })
        .eq("agent_phone", oldPhone);

      if (tenantsError) throw tenantsError;

      // Update agent_earnings table
      const { error: earningsError } = await supabase
        .from("agent_earnings")
        .update({
          agent_name: editedName,
          agent_phone: editedPhone,
        })
        .eq("agent_phone", oldPhone);

      if (earningsError) throw earningsError;

      toast.success("Agent information updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent information");
    }
  };

  const handleWithdraw = async (agentPhone: string, agentName: string, amount: number) => {
    if (amount <= 0) {
      toast.error("No commission available to withdraw");
      return;
    }

    setWithdrawingAgent(agentPhone);
    
    try {
      const { error } = await supabase
        .from("agent_earnings")
        .insert({
          agent_phone: agentPhone,
          agent_name: agentName,
          amount: amount,
          earning_type: "withdrawal",
        });

      if (error) throw error;

      toast.success(`Withdrawal of UGX ${amount.toLocaleString()} recorded for ${agentName}`);
      queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
    } catch (error) {
      console.error("Error recording withdrawal:", error);
      toast.error("Failed to record withdrawal");
    } finally {
      setWithdrawingAgent(null);
    }
  };

  const totalEarnedCommissions = agents?.reduce((sum, agent) => sum + agent.earnedCommission, 0) || 0;
  const totalExpectedCommissions = agents?.reduce((sum, agent) => sum + agent.expectedCommission, 0) || 0;
  const totalWithdrawnCommissions = agents?.reduce((sum, agent) => sum + agent.withdrawnCommission, 0) || 0;
  const totalAvailableCommissions = totalEarnedCommissions - totalWithdrawnCommissions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
                className="pl-9"
              />
            </div>
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
          </div>
        </div>

        {/* Summary Cards */}
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
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-foreground">UGX {totalAvailableCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
                <UserCheck className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </Card>
        </div>

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
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
                      {editingAgent === agent.agentPhone ? (
                        <div className="space-y-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Agent name"
                            className="h-8"
                          />
                          <Input
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            placeholder="Phone number"
                            className="h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveEdit(agent.agentPhone)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground truncate">{agent.agentName}</h3>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(agent.agentPhone, agent.agentName)}
                              className="h-8 w-8"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">{agent.agentPhone}</p>
                            <ContactButtons phoneNumber={agent.agentPhone} iconOnly />
                          </div>
                        </>
                      )}
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

                  {/* Recording Bonuses - Highlighted */}
                  {agent.recordingBonuses > 0 && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-accent/20">
                            <Zap className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-accent">Recording Bonuses</span>
                            {agent.hasRecentRecordingActivity && (
                              <Badge className="ml-2 bg-gradient-to-r from-accent to-primary text-primary-foreground text-xs animate-pulse">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-accent">
                          UGX {agent.recordingBonuses.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Earned from recording payments</p>
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
                      <span className="text-sm font-medium text-muted-foreground">Available</span>
                      <span className="text-xl font-bold text-accent">
                        UGX {(agent.earnedCommission - agent.withdrawnCommission).toLocaleString()}
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
                  </div>

                  {/* Withdraw Button */}
                  <div className="pt-3 border-t border-border">
                    <Button
                      className="w-full"
                      onClick={() => handleWithdraw(agent.agentPhone, agent.agentName, agent.earnedCommission - agent.withdrawnCommission)}
                      disabled={withdrawingAgent === agent.agentPhone || (agent.earnedCommission - agent.withdrawnCommission) <= 0}
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
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Tenants ({agentTenants.length})
            </h2>
            {tenantsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-[300px]" />
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
    </div>
  );
};

export default AgentDashboard;
