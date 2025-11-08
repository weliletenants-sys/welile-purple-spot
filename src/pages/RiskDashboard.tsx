import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Shield, Users, DollarSign, Calendar, Download, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Risk scoring function
const calculateRiskScore = (tenant: any) => {
  const { collectionRate, paidCount, totalCount, payments } = tenant;
  
  let riskScore = 0;
  const indicators: string[] = [];
  
  // Factor 1: Collection rate (0-40 points)
  if (collectionRate < 30) {
    riskScore += 40;
    indicators.push("Very low collection rate");
  } else if (collectionRate < 50) {
    riskScore += 25;
    indicators.push("Low collection rate");
  } else if (collectionRate < 70) {
    riskScore += 10;
  }
  
  // Factor 2: Payment consistency (0-30 points)
  const missedPayments = totalCount - paidCount;
  const missedRate = totalCount > 0 ? missedPayments / totalCount : 0;
  if (missedRate > 0.6) {
    riskScore += 30;
    indicators.push("High missed payments");
  } else if (missedRate > 0.4) {
    riskScore += 20;
    indicators.push("Inconsistent payments");
  } else if (missedRate > 0.2) {
    riskScore += 10;
  }
  
  // Factor 3: Payment trend (0-30 points)
  if (payments && payments.length >= 3) {
    const recentPayments = payments.slice(-3);
    const paidRecent = recentPayments.filter((p: any) => p.paid).length;
    if (paidRecent === 0) {
      riskScore += 30;
      indicators.push("No recent payments");
    } else if (paidRecent === 1) {
      riskScore += 15;
      indicators.push("Declining payment trend");
    }
  }
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (riskScore >= 60) {
    riskLevel = "high";
  } else if (riskScore >= 30) {
    riskLevel = "medium";
  }
  
  return {
    score: riskScore,
    level: riskLevel,
    indicators,
    prediction: riskLevel === "high" 
      ? "High risk of payment default" 
      : riskLevel === "medium"
      ? "Moderate risk - needs monitoring"
      : "Low risk - stable payments",
  };
};

// Recommended actions based on risk level and indicators
const getRecommendedActions = (tenant: any) => {
  const actions: string[] = [];
  
  if (tenant.riskAnalysis.score >= 60) {
    actions.push("🚨 Immediate agent follow-up required");
    actions.push("📞 Schedule face-to-face meeting with tenant");
    actions.push("💰 Discuss payment plan restructuring");
  } else if (tenant.riskAnalysis.score >= 30) {
    actions.push("📱 Weekly reminder calls needed");
    actions.push("📊 Monitor payment patterns closely");
  }
  
  if (tenant.riskAnalysis.indicators.includes("Very low collection rate")) {
    actions.push("🔍 Investigate tenant's financial situation");
  }
  
  if (tenant.riskAnalysis.indicators.includes("No recent payments")) {
    actions.push("⚠️ Consider legal notice if no response");
  }
  
  if (tenant.riskAnalysis.indicators.includes("High missed payments")) {
    actions.push("📝 Document all communication attempts");
  }
  
  return actions;
};

export default function RiskDashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");

  const { data: allTenants, isLoading } = useQuery({
    queryKey: ["risk-dashboard-tenants"],
    queryFn: async () => {
      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch payment data for each tenant
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          const { data: payments } = await supabase
            .from("daily_payments")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("date", { ascending: true });

          const totalDue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          const totalPaid = payments?.filter(p => p.paid).reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;
          const paidCount = payments?.filter(p => p.paid).length || 0;
          const totalCount = payments?.length || 0;

          return {
            ...tenant,
            totalDue,
            totalPaid,
            paidCount,
            totalCount,
            collectionRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
            payments: payments || [],
          };
        })
      );

      return tenantsWithStats;
    },
  });

  // Calculate risk scores for all tenants
  const tenantsWithRisk = useMemo(() => {
    return allTenants?.map(tenant => ({
      ...tenant,
      riskAnalysis: calculateRiskScore(tenant),
    })) || [];
  }, [allTenants]);

  // Filter by risk level
  const highRiskTenants = useMemo(() => {
    return tenantsWithRisk.filter(t => t.riskAnalysis.level === "high");
  }, [tenantsWithRisk]);

  const mediumRiskTenants = useMemo(() => {
    return tenantsWithRisk.filter(t => t.riskAnalysis.level === "medium");
  }, [tenantsWithRisk]);

  const lowRiskTenants = useMemo(() => {
    return tenantsWithRisk.filter(t => t.riskAnalysis.level === "low");
  }, [tenantsWithRisk]);

  // Risk distribution data for pie chart
  const riskDistributionData = useMemo(() => [
    { name: "High Risk", value: highRiskTenants.length, color: "hsl(var(--destructive))" },
    { name: "Medium Risk", value: mediumRiskTenants.length, color: "hsl(var(--chart-3))" },
    { name: "Low Risk", value: lowRiskTenants.length, color: "hsl(var(--primary))" },
  ], [highRiskTenants, mediumRiskTenants, lowRiskTenants]);

  // Weekly trend analysis - last 4 weeks
  const weeklyTrendData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = endOfWeek(weekStart);
      
      const weekTenants = tenantsWithRisk.filter(t => {
        const createdAt = parseISO(t.created_at);
        return createdAt <= weekEnd;
      });
      
      const highRisk = weekTenants.filter(t => t.riskAnalysis.level === "high").length;
      const mediumRisk = weekTenants.filter(t => t.riskAnalysis.level === "medium").length;
      const lowRisk = weekTenants.filter(t => t.riskAnalysis.level === "low").length;
      
      weeks.push({
        week: format(weekStart, "MMM dd"),
        highRisk,
        mediumRisk,
        lowRisk,
      });
    }
    return weeks;
  }, [tenantsWithRisk]);

  // Agent risk breakdown
  const agentRiskData = useMemo(() => {
    const agentMap = new Map();
    
    tenantsWithRisk.forEach(tenant => {
      const agent = tenant.agent_name || "Unknown";
      if (!agentMap.has(agent)) {
        agentMap.set(agent, { agent, high: 0, medium: 0, low: 0, total: 0 });
      }
      
      const stats = agentMap.get(agent);
      stats.total += 1;
      if (tenant.riskAnalysis.level === "high") stats.high += 1;
      else if (tenant.riskAnalysis.level === "medium") stats.medium += 1;
      else stats.low += 1;
    });
    
    return Array.from(agentMap.values())
      .sort((a, b) => b.high - a.high)
      .slice(0, 10);
  }, [tenantsWithRisk]);

  // Export high-risk report
  const handleExportRiskReport = () => {
    if (highRiskTenants.length === 0) {
      toast.error("No high-risk tenants to export");
      return;
    }

    const exportData = highRiskTenants.map(tenant => {
      const actions = getRecommendedActions(tenant);
      return {
        "Tenant Name": tenant.name,
        "Contact": tenant.contact,
        "Agent": tenant.agent_name || "N/A",
        "Service Center": tenant.service_center || "N/A",
        "Risk Score": tenant.riskAnalysis.score,
        "Risk Level": tenant.riskAnalysis.level.toUpperCase(),
        "Collection Rate (%)": tenant.collectionRate.toFixed(2),
        "Total Due": tenant.totalDue,
        "Total Paid": tenant.totalPaid,
        "Risk Indicators": tenant.riskAnalysis.indicators.join("; "),
        "Recommended Actions": actions.join("; "),
        "Last Updated": format(new Date(), "MMM dd, yyyy HH:mm"),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "High Risk Tenants");

    const maxWidth = exportData.reduce((acc, row) => {
      Object.keys(row).forEach((key, i) => {
        const value = String(row[key as keyof typeof row]);
        acc[i] = Math.max(acc[i] || 10, value.length, key.length);
      });
      return acc;
    }, [] as number[]);
    
    ws['!cols'] = maxWidth.map(w => ({ wch: Math.min(w + 2, 50) }));

    XLSX.writeFile(wb, `High-Risk-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("High-risk report exported successfully!");
  };

  // Export weekly performance report
  const handleExportWeeklyReport = () => {
    if (!tenantsWithRisk || tenantsWithRisk.length === 0) {
      toast.error("No data to export");
      return;
    }

    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    const weeklyData = {
      summary: {
        "Report Period": `${format(weekStart, "MMM dd, yyyy")} - ${format(weekEnd, "MMM dd, yyyy")}`,
        "Total Tenants": tenantsWithRisk.length,
        "High Risk": highRiskTenants.length,
        "Medium Risk": mediumRiskTenants.length,
        "Low Risk": lowRiskTenants.length,
        "Average Collection Rate": (tenantsWithRisk.reduce((sum, t) => sum + t.collectionRate, 0) / tenantsWithRisk.length).toFixed(2) + "%",
      },
      highRiskDetails: highRiskTenants.map(t => ({
        "Tenant": t.name,
        "Agent": t.agent_name || "N/A",
        "Risk Score": t.riskAnalysis.score,
        "Collection Rate": t.collectionRate.toFixed(2) + "%",
        "Actions Needed": getRecommendedActions(t).join("; "),
      })),
      agentPerformance: agentRiskData.map(a => ({
        "Agent": a.agent,
        "Total Tenants": a.total,
        "High Risk": a.high,
        "Medium Risk": a.medium,
        "Low Risk": a.low,
        "High Risk %": ((a.high / a.total) * 100).toFixed(1) + "%",
      })),
    };

    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryWs = XLSX.utils.json_to_sheet([weeklyData.summary]);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    // High risk details sheet
    if (weeklyData.highRiskDetails.length > 0) {
      const highRiskWs = XLSX.utils.json_to_sheet(weeklyData.highRiskDetails);
      XLSX.utils.book_append_sheet(wb, highRiskWs, "High Risk Details");
    }
    
    // Agent performance sheet
    const agentWs = XLSX.utils.json_to_sheet(weeklyData.agentPerformance);
    XLSX.utils.book_append_sheet(wb, agentWs, "Agent Performance");

    XLSX.writeFile(wb, `Weekly-Performance-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Weekly performance report exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-destructive/5 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Risk Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage payment risk across all tenants</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportWeeklyReport} variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Report
            </Button>
            <Button onClick={handleExportRiskReport} className="gap-2">
              <Download className="h-4 w-4" />
              Export High Risk
            </Button>
          </div>
        </div>

        {/* Critical Alert */}
        {highRiskTenants.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🚨 {highRiskTenants.length} tenant(s)</strong> are at high risk of payment default. 
              Immediate action required. Export report for detailed action items.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-destructive/50 border rounded-lg">
            <StatsCard
              title="High Risk"
              value={highRiskTenants.length}
              icon={AlertTriangle}
              description="Require immediate attention"
            />
          </div>
          <StatsCard
            title="Medium Risk"
            value={mediumRiskTenants.length}
            icon={Shield}
            description="Need close monitoring"
          />
          <StatsCard
            title="Low Risk"
            value={lowRiskTenants.length}
            icon={CheckCircle}
            description="Stable payment patterns"
          />
          <StatsCard
            title="Total Tenants"
            value={tenantsWithRisk.length}
            icon={Users}
            description="All active tenants"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Risk Distribution</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Weekly Trend */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">4-Week Risk Trend</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="week" 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="highRisk" stroke="hsl(var(--destructive))" strokeWidth={2} name="High Risk" />
                  <Line type="monotone" dataKey="mediumRisk" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Medium Risk" />
                  <Line type="monotone" dataKey="lowRisk" stroke="hsl(var(--primary))" strokeWidth={2} name="Low Risk" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Agent Risk Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Agent Risk Breakdown (Top 10)</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="agent" 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="high" stackId="a" fill="hsl(var(--destructive))" name="High Risk" />
                <Bar dataKey="medium" stackId="a" fill="hsl(var(--chart-3))" name="Medium Risk" />
                <Bar dataKey="low" stackId="a" fill="hsl(var(--primary))" name="Low Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* High Risk Tenants Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            High Risk Tenants - Action Required
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading risk analysis...</p>
            </div>
          ) : highRiskTenants.length > 0 ? (
            <div className="space-y-4">
              {highRiskTenants.map((tenant) => {
                const actions = getRecommendedActions(tenant);
                return (
                  <Card key={tenant.id} className="p-6 border-destructive/50 bg-destructive/5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{tenant.name}</h3>
                            <Badge variant="destructive">
                              Risk Score: {tenant.riskAnalysis.score}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tenant.contact} • {tenant.address}</p>
                        </div>
                        <Link to={`/tenant/${tenant.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Agent</p>
                          <p className="text-sm font-medium text-foreground">{tenant.agent_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Service Center</p>
                          <p className="text-sm font-medium text-foreground">{tenant.service_center || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Collection Rate</p>
                          <p className="text-sm font-semibold text-destructive">{tenant.collectionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          <p className="text-sm font-semibold text-destructive">
                            UGX {(tenant.totalDue - tenant.totalPaid).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Risk Indicators */}
                      {tenant.riskAnalysis.indicators.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-2">Risk Indicators:</p>
                          <div className="flex flex-wrap gap-2">
                            {tenant.riskAnalysis.indicators.map((indicator, i) => (
                              <Badge key={i} variant="outline" className="text-destructive border-destructive/50">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {actions.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-2">Recommended Actions:</p>
                          <ul className="space-y-1">
                            {actions.map((action, i) => (
                              <li key={i} className="text-sm text-muted-foreground">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-lg text-foreground font-medium">No high-risk tenants detected</p>
              <p className="text-muted-foreground">All tenants are maintaining healthy payment patterns</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
