import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTenants } from "@/hooks/useTenants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, TrendingUp, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentStats {
  agentName: string;
  agentPhone: string;
  tenantCount: number;
  activeTenants: number;
  totalRentCollected: number;
  expectedRent: number;
  successRate: number;
  totalMonthlyRent: number;
}

const AgentPerformanceDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { tenants } = useTenants();

  // Fetch all payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_payments")
        .select("*")
        .eq("paid", true);
      
      if (error) throw error;
      return data;
    },
  });

  const agentStats = useMemo(() => {
    if (!tenants || !payments) return [];

    const statsMap = new Map<string, AgentStats>();

    tenants.forEach((tenant) => {
      const key = tenant.agentPhone || "unknown";
      
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          agentName: tenant.agentName || "Unknown",
          agentPhone: tenant.agentPhone || "Unknown",
          tenantCount: 0,
          activeTenants: 0,
          totalRentCollected: 0,
          expectedRent: 0,
          successRate: 0,
          totalMonthlyRent: 0,
        });
      }

      const stats = statsMap.get(key)!;
      stats.tenantCount++;
      stats.totalMonthlyRent += Number(tenant.rentAmount) || 0;
      
      if (tenant.status === "active" || tenant.status === "pending") {
        stats.activeTenants++;
      }
    });

    // Calculate rent collected per agent
    payments.forEach((payment) => {
      const tenant = tenants.find((t) => t.id === payment.tenant_id);
      if (tenant) {
        const key = tenant.agentPhone || "unknown";
        const stats = statsMap.get(key);
        if (stats) {
          stats.totalRentCollected += Number(payment.paid_amount) || Number(payment.amount) || 0;
        }
      }
    });

    // Calculate expected rent and success rate
    statsMap.forEach((stats) => {
      const relevantTenants = tenants.filter(
        (t) => (t.agentPhone || "unknown") === stats.agentPhone
      );
      
      stats.expectedRent = relevantTenants.reduce((sum, tenant) => {
        // Calculate expected based on daily payments that should have been made
        const paidDays = tenant.dailyPayments.filter(p => p.paid).length;
        const totalDays = tenant.dailyPayments.length;
        const expectedDays = Math.min(totalDays, tenant.repaymentDays);
        return sum + (Number(tenant.rentAmount) / tenant.repaymentDays) * expectedDays;
      }, 0);

      stats.successRate = stats.expectedRent > 0 
        ? (stats.totalRentCollected / stats.expectedRent) * 100 
        : 0;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalRentCollected - a.totalRentCollected);
  }, [tenants, payments]);

  const isLoading = !tenants || paymentsLoading;

  const filteredStats = useMemo(() => {
    return agentStats.filter((stat) =>
      stat.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.agentPhone.includes(searchQuery)
    );
  }, [agentStats, searchQuery]);

  const totalStats = useMemo(() => {
    return {
      totalAgents: agentStats.length,
      totalTenants: agentStats.reduce((sum, s) => sum + s.tenantCount, 0),
      totalCollected: agentStats.reduce((sum, s) => sum + s.totalRentCollected, 0),
      avgSuccessRate: agentStats.length > 0 
        ? agentStats.reduce((sum, s) => sum + s.successRate, 0) / agentStats.length 
        : 0,
    };
  }, [agentStats]);

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 75) return <Badge className="bg-blue-500">Good</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Agent Performance Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Track agent performance, tenant counts, and collection rates
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton variant="fast" className="h-4 w-24" />
                  <Skeleton variant="fast" className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton variant="default" className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalTenants}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  UGX {totalStats.totalCollected.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalStats.avgSuccessRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by agent name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Agent Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton variant="slow" className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Tenants</TableHead>
                    <TableHead className="text-right">Active Tenants</TableHead>
                    <TableHead className="text-right">Monthly Rent</TableHead>
                    <TableHead className="text-right">Total Collected</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No agents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStats.map((stat) => (
                      <TableRow 
                        key={stat.agentPhone}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/agent/${stat.agentPhone}`)}
                      >
                        <TableCell className="font-medium">{stat.agentName}</TableCell>
                        <TableCell>{stat.agentPhone}</TableCell>
                        <TableCell className="text-right">{stat.tenantCount}</TableCell>
                        <TableCell className="text-right">{stat.activeTenants}</TableCell>
                        <TableCell className="text-right">
                          UGX {stat.totalMonthlyRent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          UGX {stat.totalRentCollected.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          UGX {stat.expectedRent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {stat.successRate.toFixed(1)}%
                        </TableCell>
                        <TableCell>{getSuccessRateBadge(stat.successRate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentPerformanceDashboard;
