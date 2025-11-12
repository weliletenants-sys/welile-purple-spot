import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, DollarSign, PieChart, Users, Download } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { BackToHome } from "@/components/BackToHome";

const EARNING_COLORS = {
  commission: "hsl(var(--chart-1))",
  signup_bonus: "hsl(var(--chart-2))",
  recording_bonus: "hsl(var(--chart-3))",
  pipeline_bonus: "hsl(var(--chart-4))",
  withdrawal: "hsl(var(--chart-5))",
};

export default function AgentEarningsAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  // Fetch earnings data
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["agentEarningsAnalytics", dateRange, selectedAgent],
    queryFn: async () => {
      let query = supabase
        .from("agent_earnings")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (selectedAgent !== "all") {
        query = query.eq("agent_name", selectedAgent);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch unique agents
  const { data: agents } = useQuery({
    queryKey: ["agentsForAnalytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_earnings")
        .select("agent_name")
        .order("agent_name");
      
      if (error) throw error;
      
      const uniqueAgents = Array.from(new Set(data.map((a) => a.agent_name)));
      return uniqueAgents;
    },
  });

  // Calculate summary stats
  const summaryStats = earningsData
    ? {
        total: earningsData.reduce((sum, e) => sum + Number(e.amount), 0),
        commission: earningsData
          .filter((e) => e.earning_type === "commission")
          .reduce((sum, e) => sum + Number(e.amount), 0),
        bonuses: earningsData
          .filter((e) => e.earning_type !== "commission" && e.earning_type !== "withdrawal")
          .reduce((sum, e) => sum + Number(e.amount), 0),
        withdrawals: earningsData
          .filter((e) => e.earning_type === "withdrawal")
          .reduce((sum, e) => sum + Number(e.amount), 0),
      }
    : null;

  // Prepare earnings by type for pie chart
  const earningsByType = earningsData
    ? Object.entries(
        earningsData.reduce((acc: Record<string, number>, e) => {
          acc[e.earning_type] = (acc[e.earning_type] || 0) + Number(e.amount);
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Prepare daily trend data
  const dailyTrend = earningsData
    ? Object.entries(
        earningsData.reduce((acc: Record<string, Record<string, number>>, e) => {
          const date = format(new Date(e.created_at), "MMM dd");
          if (!acc[date]) acc[date] = {};
          acc[date][e.earning_type] = (acc[date][e.earning_type] || 0) + Number(e.amount);
          return acc;
        }, {})
      ).map(([date, types]) => ({ date, ...types }))
    : [];

  // Prepare agent comparison data
  const agentComparison = earningsData
    ? Object.entries(
        earningsData.reduce((acc: Record<string, Record<string, number>>, e) => {
          if (!acc[e.agent_name]) acc[e.agent_name] = {};
          acc[e.agent_name][e.earning_type] = (acc[e.agent_name][e.earning_type] || 0) + Number(e.amount);
          return acc;
        }, {})
      )
        .map(([agent, types]) => ({
          agent: agent.split(" ")[0], // First name only for chart
          ...types,
        }))
        .sort((a, b) => {
          const aTotal = Object.entries(a)
            .filter(([key]) => key !== "agent")
            .reduce((sum, [, val]) => sum + Number(val), 0);
          const bTotal = Object.entries(b)
            .filter(([key]) => key !== "agent")
            .reduce((sum, [, val]) => sum + Number(val), 0);
          return bTotal - aTotal;
        })
        .slice(0, 10)
    : [];

  const handleExport = () => {
    if (!earningsData) return;
    
    const csv = [
      ["Date", "Agent", "Type", "Amount"].join(","),
      ...earningsData.map((e) =>
        [
          format(new Date(e.created_at), "yyyy-MM-dd"),
          e.agent_name,
          e.earning_type,
          e.amount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToHome />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agent Earnings Analytics</h1>
              <p className="text-muted-foreground">Comprehensive earnings insights and trends</p>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), 7),
                      to: new Date(),
                    })
                  }
                >
                  Last 7 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    })
                  }
                >
                  Last 30 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDateRange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date()),
                    })
                  }
                >
                  This month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDateRange({
                      from: startOfYear(new Date()),
                      to: new Date(),
                    })
                  }
                >
                  This year
                </Button>
              </div>
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-2 block">Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    UGX {summaryStats.total.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    UGX {summaryStats.commission.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-1/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-chart-1" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bonuses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    UGX {summaryStats.bonuses.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-chart-2" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawals</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    UGX {summaryStats.withdrawals.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-5/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-chart-5" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {isLoading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </Card>
        ) : !earningsData || earningsData.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No earnings data found for the selected period</p>
          </Card>
        ) : (
          <>
            {/* Daily Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Earnings Trend Over Time
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    className="text-xs"
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    className="text-xs"
                    label={{
                      value: "Amount (UGX)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                  />
                  <Legend />
                  {Object.keys(EARNING_COLORS).map((type) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stroke={EARNING_COLORS[type as keyof typeof EARNING_COLORS]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={type.replace("_", " ").toUpperCase()}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings by Type Pie Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Earnings Breakdown by Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={earningsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name.replace("_", " ")}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {earningsByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={EARNING_COLORS[entry.name as keyof typeof EARNING_COLORS]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>

              {/* Agent Comparison Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Top 10 Agents by Earnings
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="agent"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      className="text-xs"
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      className="text-xs"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                    />
                    <Legend />
                    {Object.keys(EARNING_COLORS).map((type) => (
                      <Bar
                        key={type}
                        dataKey={type}
                        stackId="a"
                        fill={EARNING_COLORS[type as keyof typeof EARNING_COLORS]}
                        name={type.replace("_", " ").toUpperCase()}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
