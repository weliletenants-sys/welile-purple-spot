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
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar, ArrowUpDown, Plus, Zap } from "lucide-react";
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

const AgentDetailPage = () => {
  const navigate = useNavigate();
  const { agentPhone } = useParams<{ agentPhone: string }>();
  const { tenants } = useTenants();
  const [sortBy, setSortBy] = useState<"name" | "balance" | "status">("balance");

  // Filter tenants for this agent (normalize phone numbers by removing spaces)
  const agentTenants = useMemo(() => {
    const normalizedAgentPhone = agentPhone?.replace(/\s/g, '');
    return tenants?.filter((t) => {
      const normalizedTenantPhone = t.agentPhone?.replace(/\s/g, '');
      return normalizedTenantPhone === normalizedAgentPhone;
    }) || [];
  }, [tenants, agentPhone]);

  const agentName = agentTenants[0]?.agentName || "Unknown Agent";

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTenants} active
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

      {/* Tabs */}
      <Tabs defaultValue="portfolio" className="space-y-4">
          <TabsList>
            <TabsTrigger value="portfolio">Tenant Portfolio</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          {/* Tenant Portfolio */}
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Balance Summary Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Balance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(() => {
                    // Calculate summary metrics
                    const tenantsWithBalances = agentTenants.map((tenant) => {
                      const tenantPayments = payments?.filter(p => p.tenant_id === tenant.id) || [];
                      const totalPaid = tenantPayments.reduce((sum, p) => {
                        return p.paid ? sum + (Number(p.paid_amount) || Number(p.amount) || 0) : sum;
                      }, 0);
                      const totalExpected = tenantPayments.reduce((sum, p) => {
                        return sum + (Number(p.amount) || 0);
                      }, 0);
                      return totalExpected - totalPaid;
                    });

                    const totalOutstanding = tenantsWithBalances.reduce((sum, balance) => sum + Math.max(0, balance), 0);
                    const totalTenants = agentTenants.length;
                    const averageBalance = totalTenants > 0 ? tenantsWithBalances.reduce((sum, balance) => sum + balance, 0) / totalTenants : 0;

                    return (
                      <>
                        {/* Total Outstanding */}
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground font-medium">Total Outstanding</p>
                          <p className="text-3xl font-bold text-red-600">
                            UGX {totalOutstanding.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Amount owed by tenants
                          </p>
                        </div>

                        {/* Total Tenants */}
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground font-medium">Total Tenants</p>
                          <p className="text-3xl font-bold text-primary">
                            {totalTenants}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Active and managed tenants
                          </p>
                        </div>

                        {/* Average Balance */}
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground font-medium">Average Balance</p>
                          <p className={`text-3xl font-bold ${averageBalance > 0 ? 'text-orange-600' : averageBalance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            UGX {Math.abs(averageBalance).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {averageBalance > 0 ? 'Average owing per tenant' : averageBalance < 0 ? 'Average credit per tenant' : 'No balance'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tenant Balances</CardTitle>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="balance">Sort by Balance</SelectItem>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="status">Sort by Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agentTenants.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No tenants found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      // Calculate balances for all tenants first
                      const tenantsWithBalances = agentTenants.map((tenant) => {
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
                        if (sortBy === "balance") {
                          return b.balance - a.balance; // Highest balance first
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

                      return sortedTenants.map(({ tenant, balance, totalPaid, totalExpected }) => {
                        return (
                        <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6 space-y-4">
                            {/* Tenant Name */}
                            <div className="space-y-1">
                              <h4 className="font-bold text-lg">{tenant.name}</h4>
                              <p className="text-sm text-muted-foreground">{tenant.contact}</p>
                            </div>
                            
                            {/* Balance Display */}
                            <div className="pt-3 border-t space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Expected:</span>
                                <span className="font-semibold">UGX {totalExpected.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Paid:</span>
                                <span className="font-semibold text-green-600">UGX {totalPaid.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm font-semibold">Balance:</span>
                                <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  UGX {Math.abs(balance).toLocaleString()}
                                  {balance > 0 ? ' (owing)' : balance < 0 ? ' (credit)' : ''}
                                </span>
                              </div>
                            </div>
                            
                            {/* Additional Info */}
                            <div className="pt-3 border-t space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rent:</span>
                                <span className="font-medium">UGX {Number(tenant.rentAmount).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
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
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Trends */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="collected"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Collected"
                    />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Expected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Success Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(payment.date), "MMM dd, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{payment.tenantName}</TableCell>
                          <TableCell className="text-right">
                            UGX{" "}
                            {(
                              Number(payment.paid_amount) ||
                              Number(payment.amount) ||
                              0
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.paid ? "default" : "secondary"}>
                              {payment.paid ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.recorded_by || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDetailPage;
