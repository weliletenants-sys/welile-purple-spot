import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePipelineStats } from "@/hooks/usePipelineStats";
import { StatsCard } from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineForecast } from "@/components/PipelineForecast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function PipelineAnalytics() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [serviceCenter, setServiceCenter] = useState("all");
  const [agentName, setAgentName] = useState("all");

  const { statsByCenter, agentStats, weeklyTrends, summary, isLoading } = usePipelineStats({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    serviceCenter: serviceCenter !== "all" ? serviceCenter : undefined,
    agentName: agentName !== "all" ? agentName : undefined,
  });

  // Fetch service centers for filter
  const { data: serviceCenters = [] } = useQuery({
    queryKey: ["service-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_centers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch agents for filter
  const { data: agents = [] } = useQuery({
    queryKey: ["agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("agent_name")
        .not("agent_name", "is", null)
        .order("agent_name");
      
      if (error) throw error;
      
      // Get unique agent names
      const uniqueAgents = [...new Set(data?.map(t => t.agent_name))];
      return uniqueAgents.filter(name => name && name.trim() !== "");
    },
  });

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setServiceCenter("all");
    setAgentName("all");
  };

  const hasActiveFilters = dateFrom || dateTo || serviceCenter !== "all" || agentName !== "all";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Pipeline Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track pipeline tenant performance and conversion metrics
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                Active
              </span>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-6 bg-muted/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Filter Analytics
                </h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date From */}
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {/* Service Center */}
                <div className="space-y-2">
                  <Label htmlFor="serviceCenter">Service Center</Label>
                  <Select value={serviceCenter} onValueChange={setServiceCenter}>
                    <SelectTrigger id="serviceCenter">
                      <SelectValue placeholder="All Centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Centers</SelectItem>
                      {serviceCenters.map((center) => (
                        <SelectItem key={center.id} value={center.name}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Agent */}
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select value={agentName} onValueChange={setAgentName}>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">All Agents</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex gap-2 flex-wrap pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
                    setDateTo(format(new Date(), "yyyy-MM-dd"));
                  }}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
                    setDateTo(format(new Date(), "yyyy-MM-dd"));
                  }}
                >
                  Last 3 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom(format(subMonths(new Date(), 6), "yyyy-MM-dd"));
                    setDateTo(format(new Date(), "yyyy-MM-dd"));
                  }}
                >
                  Last 6 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  All Time
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Pipeline Tenants"
            value={summary?.total_pipeline || 0}
            icon={Users}
            description="Current in pipeline"
          />
          <StatsCard
            title="This Week"
            value={summary?.this_week || 0}
            icon={Calendar}
            description="New pipeline additions"
          />
          <StatsCard
            title="Total Pipeline Earnings"
            value={`UGX ${(summary?.total_earnings || 0).toLocaleString()}`}
            icon={DollarSign}
            description="From pipeline bonuses"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
            <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Pipeline Trends
              </CardTitle>
              <CardDescription>
                Pipeline additions and conversions over the last 8 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week_start"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tenants_added"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Added"
                  />
                  <Line
                    type="monotone"
                    dataKey="tenants_converted"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Converted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pipeline by Service Center - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Distribution by Service Center</CardTitle>
              <CardDescription>
                Total pipeline tenants across service centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsByCenter}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ service_center, total_tenants }) =>
                      `${service_center}: ${total_tenants}`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total_tenants"
                  >
                    {statsByCenter.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Service Center Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Center Performance</CardTitle>
            <CardDescription>
              Detailed breakdown of pipeline activity by service center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold">Service Center</th>
                    <th className="text-right p-3 font-semibold">Total Pipeline</th>
                    <th className="text-right p-3 font-semibold">Converted</th>
                    <th className="text-right p-3 font-semibold">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statsByCenter.map((center, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-3 font-medium">{center.service_center}</td>
                      <td className="text-right p-3">{center.total_tenants}</td>
                      <td className="text-right p-3">{center.converted_tenants}</td>
                      <td className="text-right p-3">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                          {center.conversion_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
            <CardDescription>
              Agent rankings by pipeline additions and conversions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={agentStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="agent_name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="pipeline_added" fill="#8b5cf6" name="Pipeline Added" />
                <Bar dataKey="pipeline_converted" fill="#10b981" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Pipeline Details</CardTitle>
            <CardDescription>
              Complete agent performance metrics and earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold">Agent Name</th>
                    <th className="text-right p-3 font-semibold">Pipeline Added</th>
                    <th className="text-right p-3 font-semibold">Converted</th>
                    <th className="text-right p-3 font-semibold">Conversion Rate</th>
                    <th className="text-right p-3 font-semibold">Total Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((agent, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{agent.agent_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.agent_phone}
                          </div>
                        </div>
                      </td>
                      <td className="text-right p-3 font-semibold">
                        {agent.pipeline_added}
                      </td>
                      <td className="text-right p-3">{agent.pipeline_converted}</td>
                      <td className="text-right p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            agent.conversion_rate > 50
                              ? "bg-green-500/10 text-green-600"
                              : agent.conversion_rate > 25
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {agent.conversion_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-3 font-medium text-green-600">
                        UGX {agent.total_earnings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <PipelineForecast
              filters={{
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                serviceCenter: serviceCenter !== "all" ? serviceCenter : undefined,
                agentName: agentName !== "all" ? agentName : undefined,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
