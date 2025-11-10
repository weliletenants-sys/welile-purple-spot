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
import { ArrowLeft, Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const AgentDetailPage = () => {
  const navigate = useNavigate();
  const { agentPhone } = useParams<{ agentPhone: string }>();
  const { tenants } = useTenants();

  // Filter tenants for this agent
  const agentTenants = useMemo(() => {
    return tenants?.filter((t) => t.agentPhone === agentPhone) || [];
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/agent-performance")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{agentName}</h1>
            <p className="text-muted-foreground text-lg">{agentPhone}</p>
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

            <Card>
              <CardHeader>
                <CardTitle>Complete Tenant List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rent Amount</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead className="text-right">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tenants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentTenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.contact}</TableCell>
                          <TableCell>
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
                          <TableCell className="text-right">
                            UGX {Number(tenant.rentAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{tenant.repaymentDays}</TableCell>
                          <TableCell className="text-right">{tenant.performance}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
    </div>
  );
};

export default AgentDetailPage;
