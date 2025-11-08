import { useEffect, useState, useMemo } from "react";
import { StatsCard } from "@/components/StatsCard";
import { WelileLogo } from "@/components/WelileLogo";
import { HomeSummaryWidget } from "@/components/HomeSummaryWidget";
import { FloatingQuickActionsPanel } from "@/components/FloatingQuickActionsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, TrendingUp, AlertCircle, Target, Percent, Wallet, Home, Calendar, UserCheck, Upload, Edit3, Award, FileText, Activity, Building2, TrendingDown, Shield, UserCog, GitBranch, BarChart3, CheckCircle2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useComprehensiveStats } from "@/hooks/useComprehensiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";
import { TrendChart, DistributionPieChart, MultiLineTrendChart, ComparisonBarChart } from "@/components/DashboardCharts";
import { ExportButtons } from "@/components/DashboardExport";
import { useTrendData, useDistributionData } from "@/hooks/useTrendData";
import { useDashboardWidgets, WidgetCustomizer } from "@/components/DashboardWidgets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_ACCESS_CODE = "Mypart@welile";

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    const accessCode = sessionStorage.getItem("adminAccessCode");
    if (accessCode !== ADMIN_ACCESS_CODE) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return {
          startDate: format(startOfDay(now), "yyyy-MM-dd"),
          endDate: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "week":
        return {
          startDate: format(startOfWeek(now), "yyyy-MM-dd"),
          endDate: format(endOfWeek(now), "yyyy-MM-dd"),
        };
      case "month":
        return {
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      case "year":
        return {
          startDate: format(startOfYear(now), "yyyy-MM-dd"),
          endDate: format(endOfYear(now), "yyyy-MM-dd"),
        };
      default:
        return undefined;
    }
  }, [period]);

  const stats = useComprehensiveStats(dateRange);
  const { data: trendData } = useTrendData(30);
  const { data: distributionData } = useDistributionData();

  // Dashboard widgets
  const { widgets, visibleWidgets, toggleWidget } = useDashboardWidgets([
    { id: "payment-trends", title: "Payment Trends", component: null },
    { id: "tenant-growth", title: "Tenant Growth", component: null },
    { id: "status-distribution", title: "Status Distribution", component: null },
    { id: "source-breakdown", title: "Source Breakdown", component: null },
    { id: "service-centers", title: "Top Service Centers", component: null },
  ]);

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(intervalId);
  }, [queryClient]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
                <p className="text-sm text-muted-foreground">Real-time business insights</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Export Button */}
            <ExportButtons
              data={{
                title: "Executive Dashboard Report",
                timestamp: new Date().toLocaleString(),
                stats: [
                  { label: "Total Tenants", value: stats.numberOfTenants },
                  { label: "Outstanding Balance", value: `UGX ${stats.outstandingBalance.toLocaleString()}` },
                  { label: "Collection Rate", value: `${stats.collectionRate}%` },
                  { label: "Total Rent Paid", value: `UGX ${stats.totalRentPaid.toLocaleString()}` },
                  { label: "Active Tenants", value: stats.activeTenants },
                  { label: "Pipeline Tenants", value: stats.pipelineTenants },
                  { label: "Total Agents", value: stats.totalAgents },
                  { label: "Total Commissions", value: `UGX ${stats.totalCommissions.toLocaleString()}` },
                ],
              }}
            />

            {/* Customize Widgets */}
            <WidgetCustomizer
              widgets={widgets}
              onToggleWidget={toggleWidget}
            />

            {/* Monthly Summary Button */}
            <Button variant="outline" onClick={() => navigate('/monthly-summary')}>
              <FileText className="h-4 w-4 mr-2" />
              Monthly Summary
            </Button>
            
            {/* Period Filter */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className={`w-full sm:w-[200px] bg-card border-border transition-all ${period !== "all" ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                <Calendar className={`w-4 h-4 mr-2 ${period !== "all" ? "text-primary" : ""}`} />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Summary Widget */}
        <HomeSummaryWidget />

        {/* Visual Analytics Section */}
        <Tabs defaultValue="trends" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4 mt-4">
            {trendData && (
              <div className="grid gap-6 md:grid-cols-2">
                {visibleWidgets.find(w => w.id === "payment-trends") && (
                  <MultiLineTrendChart
                    data={trendData.paymentTrend}
                    title="Payment Collection Trends (30 Days)"
                    description="Track daily payment collections vs expected"
                    lines={[
                      { dataKey: "paid", name: "Collected", color: "hsl(var(--primary))" },
                      { dataKey: "expected", name: "Expected", color: "hsl(var(--accent))" },
                    ]}
                  />
                )}
                {visibleWidgets.find(w => w.id === "tenant-growth") && (
                  <MultiLineTrendChart
                    data={trendData.tenantTrend}
                    title="Tenant Growth (30 Days)"
                    description="New tenant registrations by status"
                    lines={[
                      { dataKey: "active", name: "Active", color: "hsl(var(--primary))" },
                      { dataKey: "pipeline", name: "Pipeline", color: "hsl(var(--accent))" },
                    ]}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4 mt-4">
            {distributionData && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleWidgets.find(w => w.id === "status-distribution") && (
                  <DistributionPieChart
                    data={distributionData.statusDistribution}
                    title="Tenant Status Distribution"
                    description="Breakdown by tenant status"
                  />
                )}
                {visibleWidgets.find(w => w.id === "source-breakdown") && (
                  <DistributionPieChart
                    data={distributionData.sourceDistribution}
                    title="Tenant Source Breakdown"
                    description="How tenants were added"
                  />
                )}
                {visibleWidgets.find(w => w.id === "service-centers") && (
                  <ComparisonBarChart
                    data={distributionData.serviceCenterDistribution.map(sc => ({
                      name: sc.name,
                      tenants: sc.value,
                    }))}
                    title="Top Service Centers"
                    description="By tenant count"
                    bars={[
                      { dataKey: "tenants", name: "Tenants", color: "hsl(var(--primary))" },
                    ]}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 mt-4">
            {stats && (
              <div className="grid gap-6 md:grid-cols-2">
                <ComparisonBarChart
                  data={[
                    { name: "Active", count: stats.activeTenants },
                    { name: "Pipeline", count: stats.pipelineTenants },
                    { name: "Inactive", count: stats.inactiveTenants || 0 },
                  ]}
                  title="Tenant Status Comparison"
                  description="Current tenant distribution"
                  bars={[
                    { dataKey: "count", name: "Count", color: "hsl(var(--primary))" },
                  ]}
                />
                <ComparisonBarChart
                  data={[
                    { name: "Manual", count: stats.manualTenants },
                    { name: "Bulk Upload", count: stats.bulkUploadedTenants },
                  ]}
                  title="Tenant Source Comparison"
                  description="How tenants were added"
                  bars={[
                    { dataKey: "count", name: "Count", color: "hsl(var(--accent))" },
                  ]}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Outstanding Balance - Prominent Card */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 shadow-[0_8px_30px_rgb(126,58,242,0.15)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_40px_rgb(126,58,242,0.25)]">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Outstanding Balance</p>
                <p className="text-5xl font-bold text-foreground">UGX {stats.outstandingBalance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Total remaining from {stats.numberOfTenants} tenant{stats.numberOfTenants !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-6 shadow-lg">
                <Wallet className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-6 flex gap-4 border-t border-primary/10 pt-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-lg font-semibold text-foreground">UGX {stats.totalExpectedRevenue.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-semibold text-primary">UGX {stats.totalRentPaid.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="text-lg font-semibold text-accent">{stats.collectionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Tenants"
            value={stats.numberOfTenants}
            icon={Users}
            description="Active tenant accounts"
          />

          <StatsCard
            title="Manually Added"
            value={stats.manualTenants}
            icon={UserCheck}
            description="Added via form"
          />

          <StatsCard
            title="Bulk Uploaded"
            value={stats.bulkUploadedTenants}
            icon={Upload}
            description="Imported from Excel"
          />

          <StatsCard
            title="Total Rent Amounts"
            value={`UGX ${stats.totalRentAmounts.toLocaleString()}`}
            icon={Home}
            description="Sum of all tenant rents"
          />
          
          <StatsCard
            title="Total Access Fees"
            value={`UGX ${stats.totalAccessFees.toLocaleString()}`}
            icon={DollarSign}
            description="33% of rent amounts"
          />

          <StatsCard
            title="Total Registration Fees"
            value={`UGX ${stats.totalRegistrationFees.toLocaleString()}`}
            icon={Target}
            description="One-time per tenant"
            onClick={() => navigate("/?filter=registration")}
          />

          <StatsCard
            title="Total Payments Collected"
            value={`UGX ${stats.totalRentPaid.toLocaleString()}`}
            icon={TrendingUp}
            description="All payments received"
          />

          <StatsCard
            title="Overdue Payments"
            value={`UGX ${stats.overduePayments.toLocaleString()}`}
            icon={AlertCircle}
            description="Payments past due date"
          />

          <StatsCard
            title="Collection Rate"
            value={`${stats.collectionRate}%`}
            icon={Percent}
            description="Payment completion rate"
          />

          <StatsCard
            title="Active Tenants"
            value={stats.activeTenants}
            icon={CheckCircle2}
            description="Currently active"
          />

          <StatsCard
            title="Pipeline Tenants"
            value={stats.pipelineTenants}
            icon={GitBranch}
            description="In pipeline"
          />

          <StatsCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={Target}
            description="Pipeline to active"
          />

          <StatsCard
            title="Total Agents"
            value={stats.totalAgents}
            icon={UserCog}
            description={stats.topAgent ? `Top: ${stats.topAgent.name}` : "Active agents"}
          />

          <StatsCard
            title="Total Commissions"
            value={`UGX ${stats.totalCommissions.toLocaleString()}`}
            icon={Award}
            description="Agent commissions"
          />

          <StatsCard
            title="Signup Bonuses"
            value={`UGX ${stats.totalSignupBonuses.toLocaleString()}`}
            icon={TrendingUp}
            description="New tenant bonuses"
          />

          <StatsCard
            title="Data Entry Rewards"
            value={`UGX ${stats.totalDataEntryRewards.toLocaleString()}`}
            icon={Edit3}
            description="Recording rewards"
          />

          <StatsCard
            title="Recording Bonuses"
            value={`UGX ${stats.totalRecordingBonuses.toLocaleString()}`}
            icon={BarChart3}
            description="Payment recording"
          />

          <StatsCard
            title="Service Centers"
            value={stats.totalServiceCenters}
            icon={Building2}
            description={stats.topServiceCenter ? `Top: ${stats.topServiceCenter.name}` : "Active centers"}
          />

          <StatsCard
            title="Active Recorders"
            value={stats.totalRecorders}
            icon={Activity}
            description={`${stats.recentRecordings} recent recordings`}
          />

          <StatsCard
            title="Tenants At Risk"
            value={stats.tenantsAtRisk}
            icon={AlertCircle}
            description="3+ missed payments"
          />

          <StatsCard
            title="Default Rate"
            value={`${stats.defaultRate}%`}
            icon={TrendingDown}
            description="At-risk percentage"
          />

          <StatsCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            icon={Wallet}
            description="Awaiting approval"
          />

          <StatsCard
            title="Approved Withdrawals"
            value={`UGX ${stats.totalWithdrawalRequests.toLocaleString()}`}
            icon={DollarSign}
            description={`${stats.approvedWithdrawals} approved`}
          />

          <StatsCard
            title="Average Rent"
            value={`UGX ${Math.round(stats.averageRentAmount).toLocaleString()}`}
            icon={Home}
            description="Per tenant"
          />

          <StatsCard
            title="Average Payment"
            value={`UGX ${Math.round(stats.averagePaymentAmount).toLocaleString()}`}
            icon={DollarSign}
            description="Per transaction"
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 Welile Tenants Hub. All rights reserved.</p>
          <p className="mt-1">Data updates in real-time</p>
        </div>
      </div>

      {/* Floating Quick Actions Panel */}
      <FloatingQuickActionsPanel />
    </div>
  );
};

export default ExecutiveDashboard;
