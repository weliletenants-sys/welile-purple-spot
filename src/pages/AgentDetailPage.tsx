import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTenants } from "@/hooks/useTenants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar, ArrowUpDown, Plus, Zap, List, Grid, Search, UserCog, Wallet, ChevronDown, Eye, EyeOff, Info } from "lucide-react";

import { AssignTenantToAgentDialog } from "@/components/AssignTenantToAgentDialog";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentAddTenantDialog } from "@/components/AgentAddTenantDialog";
import { AgentQuickAddDialog } from "@/components/AgentQuickAddDialog";
import { AgentPipelineDialog } from "@/components/AgentPipelineDialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Tooltip as InfoTooltip, 
  TooltipContent as InfoTooltipContent, 
  TooltipProvider as InfoTooltipProvider, 
  TooltipTrigger as InfoTooltipTrigger 
} from "@/components/ui/tooltip";

const AgentDetailPage = () => {
  const navigate = useNavigate();
  const { agentPhone } = useParams<{ agentPhone: string }>();
  const { tenants } = useTenants();
  const [sortBy, setSortBy] = useState<"name" | "balance-high" | "balance-low" | "status">("balance-high");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [assigningTenant, setAssigningTenant] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const itemsPerPage = 20;
  const { toast } = useToast();
  
  // Fetch agent earnings
  const { data: agentEarningsData } = useAgentEarnings("all");

  // Get agent by phone and filter tenants for this agent
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, phone")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const currentAgent = useMemo(() => {
    if (!agents || !agentPhone) return null;
    const normalizedAgentPhone = agentPhone.replace(/\s/g, '');
    return agents.find(a => a.phone?.replace(/\s/g, '') === normalizedAgentPhone);
  }, [agents, agentPhone]);

  // Filter tenants for this agent using agent_id
  const agentTenants = useMemo(() => {
    if (!currentAgent?.id) return [];
    return tenants?.filter((t) => (t as any).agent_id === currentAgent.id) || [];
  }, [tenants, currentAgent]);

  const agentName = currentAgent?.name || agentTenants[0]?.agentName || "Unknown Agent";

  // Get agent earnings for this specific agent
  const agentEarnings = useMemo(() => {
    if (!agentEarningsData || !agentName) return null;
    return agentEarningsData.find(e => 
      e.agentName.toUpperCase() === agentName.toUpperCase()
    );
  }, [agentEarningsData, agentName]);

  const availableBalance = useMemo(() => {
    if (!agentEarnings) return 0;
    const withdrawableEarned = (agentEarnings.commissions || 0) + (agentEarnings.recordingBonuses || 0);
    return Math.max(0, withdrawableEarned - (agentEarnings.withdrawnCommission || 0));
  }, [agentEarnings]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `Available balance: UGX ${availableBalance.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          agent_name: agentName,
          agent_phone: agentPhone || "",
          amount: amount,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: `Request for UGX ${amount.toLocaleString()} has been submitted for approval`,
      });
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Fetch all payments for this agent's tenants
  const { data: payments } = useQuery({
    queryKey: ["agent-payments", agentPhone],
    queryFn: async () => {
      const tenantIds = agentTenants.map((t) => t.id);
      if (tenantIds.length === 0) return [];

      const { data, error } = await supabase
        .from("daily_payments")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: agentTenants.length > 0,
  });

  // Calculate agent statistics
  const stats = useMemo(() => {
    const totalTenants = agentTenants.length;
    const activeTenants = agentTenants.filter(
      (t) => t.status === "active" || t.status === "pending"
    ).length;
    const totalMonthlyRent = agentTenants.reduce(
      (sum, t) => sum + (Number(t.rentAmount) || 0),
      0
    );

    const totalCollected = payments?.reduce((sum, p) => {
      return p.paid ? sum + (Number(p.paid_amount) || Number(p.amount) || 0) : sum;
    }, 0) || 0;

    const expectedRent = agentTenants.reduce((sum, tenant) => {
      const totalDays = tenant.dailyPayments?.length || 0;
      const expectedDays = Math.min(totalDays, tenant.repaymentDays);
      return sum + (Number(tenant.rentAmount) / tenant.repaymentDays) * expectedDays;
    }, 0);

    const successRate = expectedRent > 0 ? (totalCollected / expectedRent) * 100 : 0;

    return {
      totalTenants,
      activeTenants,
      totalMonthlyRent,
      totalCollected,
      expectedRent,
      successRate,
    };
  }, [agentTenants, payments]);

  // Performance trends over last 6 months
  const performanceTrends = useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const collected = monthPayments.reduce((sum, p) => {
        return p.paid ? sum + (Number(p.paid_amount) || Number(p.amount) || 0) : sum;
      }, 0);

      const expected = monthPayments.reduce((sum, p) => {
        return sum + (Number(p.amount) || 0);
      }, 0);

      return {
        month: format(month, "MMM yyyy"),
        collected,
        expected,
        rate: expected > 0 ? (collected / expected) * 100 : 0,
      };
    });
  }, [payments]);

  // Recent payment history (last 50)
  const recentPayments = useMemo(() => {
    if (!payments) return [];
    return payments.slice(0, 50).map((payment) => {
      const tenant = agentTenants.find((t) => t.id === payment.tenant_id);
      return {
        ...payment,
        tenantName: tenant?.name || "Unknown",
      };
    });
  }, [payments, agentTenants]);

  // Tenant status breakdown
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    agentTenants.forEach((t) => {
      breakdown[t.status] = (breakdown[t.status] || 0) + 1;
    });
    return Object.entries(breakdown).map(([status, count]) => ({
      status,
      count,
    }));
  }, [agentTenants]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agentName}</h1>
            <p className="text-muted-foreground">{agentPhone}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <AgentAddTenantDialog agentName={agentName} agentPhone={agentPhone || ""} />
          <AgentQuickAddDialog agentName={agentName} agentPhone={agentPhone || ""} />
          <AgentPipelineDialog agentName={agentName} agentPhone={agentPhone || ""} />
        </div>
      </div>
      {/* Earnings Toggle */}
      <Button variant="outline" className="w-full justify-between" onClick={() => setShowEarnings((v) => !v)}>
        <span>{showEarnings ? "Hide Earnings" : "Show Earnings"}</span>
        {showEarnings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {/* Commission Card */}
      {showEarnings && (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Total Commission</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              UGX {availableBalance.toLocaleString()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" className="w-full justify-between" onClick={() => setIsEarningsOpen((v) => !v)}>
              <span>{isEarningsOpen ? "Hide" : "View"} Earnings Breakdown</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isEarningsOpen ? "rotate-180" : ""}`} />
            </Button>
            {isEarningsOpen && (
              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    UGX {(agentEarnings?.earnedCommission || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Withdrawn</span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    UGX {(agentEarnings?.withdrawnCommission || 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Available Balance</span>
                    <InfoTooltipProvider>
                      <InfoTooltip>
                        <InfoTooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </InfoTooltipTrigger>
                        <InfoTooltipContent className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">Withdrawal Rules</p>
                          <p className="text-xs"><strong>Withdrawable:</strong> Commissions + Recording Bonuses</p>
                          <p className="text-xs text-muted-foreground mt-1"><strong>Non-withdrawable:</strong> Pipeline bonuses (UGX 50), Data Entry, and Signup bonuses</p>
                        </InfoTooltipContent>
                      </InfoTooltip>
                    </InfoTooltipProvider>
                  </div>
                  <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                    UGX {availableBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-muted/50 rounded-md border border-border mb-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Withdrawal includes:</span> Commissions & Recording Bonuses only. 
                <span className="block mt-0.5 italic">Pipeline (UGX 50), Data Entry & Signup bonuses are non-withdrawable.</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isWithdrawing || availableBalance <= 0}
              className="flex-1"
            />
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount || availableBalance <= 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isWithdrawing ? (
                <>
                  <Wallet className="mr-2 h-4 w-4 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Withdraw
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}


      {/* Tenant List - Primary View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">All Tenants ({agentTenants.length})</CardTitle>
              <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="balance-high">Balance: Highest First</SelectItem>
                  <SelectItem value="balance-low">Balance: Lowest First</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {agentTenants.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No tenants found
            </p>
          ) : (
            <>
              {viewMode === "table" ? (
                <>
                {/* Simple Table View */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant Name</TableHead>
                        <TableHead className="text-right">Amount Owed</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Filter tenants based on search query
                        const filteredTenants = agentTenants.filter((tenant) =>
                          tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        // Calculate balances for filtered tenants
                        const tenantsWithBalances = filteredTenants.map((tenant) => {
                          const tenantPayments = payments?.filter(p => p.tenant_id === tenant.id) || [];
                          const totalPaid = tenantPayments.reduce((sum, p) => {
                            return p.paid ? sum + (Number(p.paid_amount) || Number(p.amount) || 0) : sum;
                          }, 0);
                          const totalExpected = tenantPayments.reduce((sum, p) => {
                            return sum + (Number(p.amount) || 0);
                          }, 0);
                          const balance = totalExpected - totalPaid;
                          return { tenant, balance, totalPaid, totalExpected };
                        });

                        // Sort based on selected option
                        const sortedTenants = [...tenantsWithBalances].sort((a, b) => {
                          if (sortBy === "balance-high") {
                            return b.balance - a.balance; // Highest first
                          } else if (sortBy === "balance-low") {
                            return a.balance - b.balance; // Lowest first
                          } else if (sortBy === "name") {
                            return a.tenant.name.localeCompare(b.tenant.name);
                          } else if (sortBy === "status") {
                            const statusOrder = { active: 0, pending: 1, cleared: 2, rejected: 3 };
                            const aStatus = a.tenant.status as keyof typeof statusOrder;
                            const bStatus = b.tenant.status as keyof typeof statusOrder;
                            return (statusOrder[aStatus] || 99) - (statusOrder[bStatus] || 99);
                          }
                        return 0;
                        });

                        // Pagination
                        const totalPages = Math.ceil(sortedTenants.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedTenants = sortedTenants.slice(startIndex, endIndex);

                        if (sortedTenants.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                {searchQuery ? "No tenants found matching your search" : "No tenants found"}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return paginatedTenants.map(({ tenant, balance }) => (
                          <TableRow 
                            key={tenant.id} 
                            className="hover:bg-muted/50"
                          >
                            <TableCell 
                              className="font-medium cursor-pointer"
                              onClick={() => navigate(`/tenant/${tenant.id}`)}
                            >
                              {tenant.name}
                            </TableCell>
                            <TableCell 
                              className="text-right cursor-pointer"
                              onClick={() => navigate(`/tenant/${tenant.id}`)}
                            >
                              <span className={`font-semibold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                UGX {Math.abs(balance).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell 
                              className="text-center cursor-pointer"
                              onClick={() => navigate(`/tenant/${tenant.id}`)}
                            >
                              <Badge
                                variant={
                                  tenant.status === "active"
                                    ? "default"
                                    : tenant.status === "cleared"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {tenant.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssigningTenant(tenant);
                                }}
                                className="gap-1"
                              >
                                <UserCog className="h-3 w-3" />
                                Reassign
                              </Button>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Table Pagination */}
                {(() => {
                  const filteredTenants = agentTenants.filter((tenant) =>
                    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
                  
                  if (totalPages <= 1) return null;
                  
                  return (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
                      </p>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  );
                })()}
                </>
              ) : (
                <>
                {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(() => {
                      // Filter tenants based on search query
                      const filteredTenants = agentTenants.filter((tenant) =>
                        tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      // Calculate balances for filtered tenants
                      const tenantsWithBalances = filteredTenants.map((tenant) => {
                        const tenantPayments = payments?.filter(p => p.tenant_id === tenant.id) || [];
                        const totalPaid = tenantPayments.reduce((sum, p) => {
                          return p.paid ? sum + (Number(p.paid_amount) || Number(p.amount) || 0) : sum;
                        }, 0);
                        const totalExpected = tenantPayments.reduce((sum, p) => {
                          return sum + (Number(p.amount) || 0);
                        }, 0);
                        const balance = totalExpected - totalPaid;
                        return { tenant, balance, totalPaid, totalExpected };
                      });

                      // Sort based on selected option
                      const sortedTenants = [...tenantsWithBalances].sort((a, b) => {
                        if (sortBy === "balance-high") {
                          return b.balance - a.balance; // Highest first
                        } else if (sortBy === "balance-low") {
                          return a.balance - b.balance; // Lowest first
                        } else if (sortBy === "name") {
                          return a.tenant.name.localeCompare(b.tenant.name);
                        } else if (sortBy === "status") {
                          const statusOrder = { active: 0, pending: 1, cleared: 2, rejected: 3 };
                          const aStatus = a.tenant.status as keyof typeof statusOrder;
                          const bStatus = b.tenant.status as keyof typeof statusOrder;
                          return (statusOrder[aStatus] || 99) - (statusOrder[bStatus] || 99);
                        }
                        return 0;
                      });

                      // Pagination
                      const totalPages = Math.ceil(sortedTenants.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedTenants = sortedTenants.slice(startIndex, endIndex);

              if (sortedTenants.length === 0) {
                return (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {searchQuery ? "No tenants found matching your search" : "No tenants found"}
                  </div>
                );
              }
              
              return paginatedTenants.map(({ tenant, balance, totalPaid, totalExpected }) => {
                return (
                  <Card 
                    key={tenant.id} 
                    className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                    onClick={() => navigate(`/tenant/${tenant.id}`)}
                  >
                    <CardContent className="p-5 space-y-3">
                      {/* Tenant Name & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="font-bold text-base truncate">{tenant.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{tenant.contact}</p>
                        </div>
                        <Badge
                          variant={
                            tenant.status === "active"
                              ? "default"
                              : tenant.status === "cleared"
                              ? "secondary"
                              : "outline"
                          }
                          className="shrink-0"
                        >
                          {tenant.status}
                        </Badge>
                      </div>
                      
                      {/* Balance Display */}
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Expected:</span>
                          <span className="font-medium">UGX {totalExpected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Paid:</span>
                          <span className="font-medium text-green-600">UGX {totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-semibold">Balance:</span>
                          <span className={`font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            UGX {Math.abs(balance).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Rent Amount */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Monthly Rent:</span>
                          <span className="font-semibold">UGX {Number(tenant.rentAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
            </div>
            
            {/* Grid Pagination */}
            {(() => {
              const filteredTenants = agentTenants.filter((tenant) =>
                tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
              );
              const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              );
            })()}
            </>
              )
            }
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign Tenant Dialog */}
      {assigningTenant && (
        <AssignTenantToAgentDialog
          tenant={assigningTenant}
          open={!!assigningTenant}
          onOpenChange={(open) => !open && setAssigningTenant(null)}
          onSuccess={() => {
            setAssigningTenant(null);
            window.location.reload(); // Refresh to show updated assignment
          }}
        />
      )}
    </div>
  );
};

export default AgentDetailPage;
