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
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar, ArrowUpDown, Plus, Zap, List, Grid, Search } from "lucide-react";
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

const AgentDetailPage = () => {
  const navigate = useNavigate();
  const { agentPhone } = useParams<{ agentPhone: string }>();
  const { tenants } = useTenants();
  const [sortBy, setSortBy] = useState<"name" | "balance-high" | "balance-low" | "status">("balance-high");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeTenants} active • {stats.totalTenants - stats.activeTenants} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                UGX {stats.totalMonthlyRent.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                UGX {stats.totalCollected.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                // Simple Table View
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant Name</TableHead>
                        <TableHead className="text-right">Amount Owed</TableHead>
                        <TableHead className="text-center">Status</TableHead>
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

                        if (sortedTenants.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                {searchQuery ? "No tenants found matching your search" : "No tenants found"}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return sortedTenants.map(({ tenant, balance }) => (
                          <TableRow 
                            key={tenant.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/tenant/${tenant.id}`)}
                          >
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                UGX {Math.abs(balance).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
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
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Grid View
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

              if (sortedTenants.length === 0) {
                return (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {searchQuery ? "No tenants found matching your search" : "No tenants found"}
                  </div>
                );
              }
              
              return sortedTenants.map(({ tenant, balance, totalPaid, totalExpected }) => {
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
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDetailPage;
