import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, eachDayOfInterval } from "date-fns";
import { ArrowLeft, UserPlus, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle, Download, Filter, AlertCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecentlyAddedTenants() {
  const oneWeekAgo = subDays(new Date(), 7);
  const [sortBy, setSortBy] = useState<string>("date");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [serviceCenterFilter, setServiceCenterFilter] = useState<string>("all");

  const { data: recentTenants, isLoading } = useQuery({
    queryKey: ["recently-added-tenants"],
    queryFn: async () => {
      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .gte("created_at", oneWeekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch payment data for each tenant
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          const { data: payments } = await supabase
            .from("daily_payments")
            .select("*")
            .eq("tenant_id", tenant.id)
            .gte("date", format(parseISO(tenant.created_at), "yyyy-MM-dd"))
            .lte("date", format(new Date(), "yyyy-MM-dd"))
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

  // Get unique agents and service centers for filters
  const uniqueAgents = useMemo(() => {
    if (!recentTenants) return [];
    const agents = [...new Set(recentTenants.map(t => t.agent_name).filter(Boolean))];
    return agents.sort();
  }, [recentTenants]);

  const uniqueServiceCenters = useMemo(() => {
    if (!recentTenants) return [];
    const centers = [...new Set(recentTenants.map(t => t.service_center).filter(Boolean))];
    return centers.sort();
  }, [recentTenants]);

  // Filter and sort tenants
  const filteredAndSortedTenants = useMemo(() => {
    if (!recentTenants) return [];
    
    let filtered = [...recentTenants];
    
    // Apply filters
    if (agentFilter !== "all") {
      filtered = filtered.filter(t => t.agent_name === agentFilter);
    }
    
    if (serviceCenterFilter !== "all") {
      filtered = filtered.filter(t => t.service_center === serviceCenterFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "collection-high":
        filtered.sort((a, b) => b.collectionRate - a.collectionRate);
        break;
      case "collection-low":
        filtered.sort((a, b) => a.collectionRate - b.collectionRate);
        break;
      case "agent":
        filtered.sort((a, b) => (a.agent_name || "").localeCompare(b.agent_name || ""));
        break;
      case "service-center":
        filtered.sort((a, b) => (a.service_center || "").localeCompare(b.service_center || ""));
        break;
      default: // date
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return filtered;
  }, [recentTenants, agentFilter, serviceCenterFilter, sortBy]);

  // Calculate stats from filtered data
  const totalStats = useMemo(() => ({
    totalTenants: filteredAndSortedTenants?.length || 0,
    totalExpected: filteredAndSortedTenants?.reduce((sum, t) => sum + t.totalDue, 0) || 0,
    totalCollected: filteredAndSortedTenants?.reduce((sum, t) => sum + t.totalPaid, 0) || 0,
    avgCollectionRate: filteredAndSortedTenants?.length 
      ? filteredAndSortedTenants.reduce((sum, t) => sum + t.collectionRate, 0) / filteredAndSortedTenants.length 
      : 0,
  }), [filteredAndSortedTenants]);

  // Agent performance comparison data
  const agentComparisonData = useMemo(() => {
    if (!filteredAndSortedTenants) return [];
    
    const agentStats = new Map();
    
    filteredAndSortedTenants.forEach(tenant => {
      const agent = tenant.agent_name || "Unknown";
      if (!agentStats.has(agent)) {
        agentStats.set(agent, {
          agent,
          totalTenants: 0,
          totalExpected: 0,
          totalCollected: 0,
          avgCollectionRate: 0,
        });
      }
      
      const stats = agentStats.get(agent);
      stats.totalTenants += 1;
      stats.totalExpected += tenant.totalDue;
      stats.totalCollected += tenant.totalPaid;
    });
    
    // Calculate average collection rates
    return Array.from(agentStats.values()).map(stats => ({
      ...stats,
      avgCollectionRate: stats.totalExpected > 0 
        ? ((stats.totalCollected / stats.totalExpected) * 100).toFixed(1)
        : 0,
    })).sort((a, b) => b.avgCollectionRate - a.avgCollectionRate);
  }, [filteredAndSortedTenants]);

  // Service center performance comparison data
  const serviceCenterComparisonData = useMemo(() => {
    if (!filteredAndSortedTenants) return [];
    
    const centerStats = new Map();
    
    filteredAndSortedTenants.forEach(tenant => {
      const center = tenant.service_center || "Unknown";
      if (!centerStats.has(center)) {
        centerStats.set(center, {
          center,
          totalTenants: 0,
          totalExpected: 0,
          totalCollected: 0,
          avgCollectionRate: 0,
        });
      }
      
      const stats = centerStats.get(center);
      stats.totalTenants += 1;
      stats.totalExpected += tenant.totalDue;
      stats.totalCollected += tenant.totalPaid;
    });
    
    // Calculate average collection rates
    return Array.from(centerStats.values()).map(stats => ({
      ...stats,
      avgCollectionRate: stats.totalExpected > 0 
        ? ((stats.totalCollected / stats.totalExpected) * 100).toFixed(1)
        : 0,
    })).sort((a, b) => b.avgCollectionRate - a.avgCollectionRate);
  }, [filteredAndSortedTenants]);

  // Daily progress timeline data
  const dailyProgressData = useMemo(() => {
    if (!filteredAndSortedTenants || filteredAndSortedTenants.length === 0) return [];
    
    // Get all dates in the range
    const allDates = eachDayOfInterval({
      start: oneWeekAgo,
      end: new Date(),
    });
    
    // Build daily stats
    return allDates.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      
      let dailyExpected = 0;
      let dailyCollected = 0;
      let cumulativeExpected = 0;
      let cumulativeCollected = 0;
      
      filteredAndSortedTenants.forEach(tenant => {
        // Only include payments for tenants added on or before this date
        if (parseISO(tenant.created_at) <= date) {
          tenant.payments?.forEach((payment: any) => {
            const paymentDate = format(parseISO(payment.date), "yyyy-MM-dd");
            
            if (paymentDate <= dateStr) {
              cumulativeExpected += Number(payment.amount);
              if (payment.paid) {
                cumulativeCollected += Number(payment.paid_amount || 0);
              }
            }
            
            if (paymentDate === dateStr) {
              dailyExpected += Number(payment.amount);
              if (payment.paid) {
                dailyCollected += Number(payment.paid_amount || 0);
              }
            }
          });
        }
      });
      
      return {
        date: format(date, "MMM dd"),
        fullDate: dateStr,
        dailyExpected: Math.round(dailyExpected),
        dailyCollected: Math.round(dailyCollected),
        cumulativeExpected: Math.round(cumulativeExpected),
        cumulativeCollected: Math.round(cumulativeCollected),
        dailyRate: dailyExpected > 0 ? ((dailyCollected / dailyExpected) * 100).toFixed(1) : 0,
        cumulativeRate: cumulativeExpected > 0 ? ((cumulativeCollected / cumulativeExpected) * 100).toFixed(1) : 0,
      };
    });
  }, [filteredAndSortedTenants, oneWeekAgo]);

  // Identify low performers (collection rate < 50%)
  const lowPerformers = useMemo(() => {
    return filteredAndSortedTenants?.filter(t => t.collectionRate < 50) || [];
  }, [filteredAndSortedTenants]);

  // Show alert for low performers
  useEffect(() => {
    if (lowPerformers.length > 0) {
      toast.warning(`⚠️ ${lowPerformers.length} tenant(s) have collection rates below 50%`, {
        description: "Consider reaching out to these tenants or their agents.",
        duration: 5000,
      });
    }
  }, [lowPerformers.length]);

  // Export to Excel
  const handleExport = () => {
    if (!filteredAndSortedTenants || filteredAndSortedTenants.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredAndSortedTenants.map(tenant => ({
      "Tenant Name": tenant.name,
      "Contact": tenant.contact,
      "Address": tenant.address,
      "Agent": tenant.agent_name || "N/A",
      "Service Center": tenant.service_center || "N/A",
      "Date Added": format(parseISO(tenant.created_at), "MMM dd, yyyy"),
      "Expected Amount": tenant.totalDue,
      "Collected Amount": tenant.totalPaid,
      "Collection Rate (%)": tenant.collectionRate.toFixed(2),
      "Paid Payments": tenant.paidCount,
      "Total Payments": tenant.totalCount,
      "Performance": tenant.collectionRate >= 80 ? "Excellent" : tenant.collectionRate >= 50 ? "Good" : "Needs Attention",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recently Added");

    // Auto-size columns
    const maxWidth = exportData.reduce((acc, row) => {
      Object.keys(row).forEach((key, i) => {
        const value = String(row[key as keyof typeof row]);
        acc[i] = Math.max(acc[i] || 10, value.length, key.length);
      });
      return acc;
    }, [] as number[]);
    
    ws['!cols'] = maxWidth.map(w => ({ wch: w + 2 }));

    XLSX.writeFile(wb, `Recently-Added-Tenants-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Report exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 md:p-8">
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
              <h1 className="text-3xl font-bold text-foreground">Recently Added Tenants</h1>
              <p className="text-muted-foreground">New tenants from the last 7 days</p>
            </div>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Low Performance Alert */}
        {lowPerformers.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{lowPerformers.length} tenant(s)</strong> have collection rates below 50% in their first week. 
              Consider immediate follow-up with agents: {lowPerformers.slice(0, 3).map(t => t.agent_name).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
              {lowPerformers.length > 3 && " and others"}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="New Tenants"
            value={totalStats.totalTenants}
            icon={UserPlus}
            description="Added this week"
          />
          <StatsCard
            title="Expected Amount"
            value={`UGX ${totalStats.totalExpected.toLocaleString()}`}
            icon={DollarSign}
            description="Total due this week"
          />
          <StatsCard
            title="Collected"
            value={`UGX ${totalStats.totalCollected.toLocaleString()}`}
            icon={CheckCircle}
            description="Total collected"
          />
          <StatsCard
            title="Avg Collection Rate"
            value={`${totalStats.avgCollectionRate.toFixed(1)}%`}
            icon={TrendingUp}
            description="Performance metric"
          />
        </div>

        {/* Performance Comparison Charts */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Week 1 Performance Comparison</h2>
          </div>
          
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="agents">By Agent</TabsTrigger>
              <TabsTrigger value="centers">By Service Center</TabsTrigger>
            </TabsList>
            
            <TabsContent value="agents" className="space-y-4">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="agent" 
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
                      formatter={(value: any, name: string) => {
                        if (name === "avgCollectionRate") return [`${value}%`, "Collection Rate"];
                        if (name === "totalTenants") return [value, "Tenants"];
                        if (name === "totalExpected") return [`UGX ${Number(value).toLocaleString()}`, "Expected"];
                        if (name === "totalCollected") return [`UGX ${Number(value).toLocaleString()}`, "Collected"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalTenants" fill="hsl(var(--primary))" name="Tenants Added" />
                    <Bar dataKey="avgCollectionRate" fill="hsl(var(--accent))" name="Collection Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="centers" className="space-y-4">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceCenterComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="center" 
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
                      formatter={(value: any, name: string) => {
                        if (name === "avgCollectionRate") return [`${value}%`, "Collection Rate"];
                        if (name === "totalTenants") return [value, "Tenants"];
                        if (name === "totalExpected") return [`UGX ${Number(value).toLocaleString()}`, "Expected"];
                        if (name === "totalCollected") return [`UGX ${Number(value).toLocaleString()}`, "Collected"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalTenants" fill="hsl(var(--primary))" name="Tenants Added" />
                    <Bar dataKey="avgCollectionRate" fill="hsl(var(--accent))" name="Collection Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Daily Progress Timeline */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Daily Progress Timeline</h2>
          </div>
          
          <Tabs defaultValue="cumulative" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cumulative" className="space-y-4">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                      formatter={(value: any, name: string) => {
                        if (name === "cumulativeRate") return [`${value}%`, "Collection Rate"];
                        return [`UGX ${Number(value).toLocaleString()}`, name];
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeExpected" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                      name="Expected"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeCollected" 
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent) / 0.2)" 
                      name="Collected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {dailyProgressData.slice(-1).map(day => (
                  <div key={day.fullDate} className="text-center p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Rate</p>
                    <p className="text-2xl font-bold text-primary">{day.cumulativeRate}%</p>
                  </div>
                ))}
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expected</p>
                  <p className="text-2xl font-bold text-accent">
                    {dailyProgressData.length > 0 ? dailyProgressData[dailyProgressData.length - 1].cumulativeExpected.toLocaleString() : 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-primary">
                    {dailyProgressData.length > 0 ? dailyProgressData[dailyProgressData.length - 1].cumulativeCollected.toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="daily" className="space-y-4">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                      formatter={(value: any, name: string) => {
                        if (name === "dailyRate") return [`${value}%`, "Collection Rate"];
                        return [`UGX ${Number(value).toLocaleString()}`, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="dailyExpected" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Expected"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dailyCollected" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      name="Collected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Filters and Sorting */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filter & Sort:</span>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest First</SelectItem>
                  <SelectItem value="collection-high">Collection Rate (High)</SelectItem>
                  <SelectItem value="collection-low">Collection Rate (Low)</SelectItem>
                  <SelectItem value="agent">Agent (A-Z)</SelectItem>
                  <SelectItem value="service-center">Service Center (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Service Centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Centers</SelectItem>
                  {uniqueServiceCenters.map(center => (
                    <SelectItem key={center} value={center}>{center}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(agentFilter !== "all" || serviceCenterFilter !== "all" || sortBy !== "date") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setAgentFilter("all");
                    setServiceCenterFilter("all");
                    setSortBy("date");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tenants List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Individual Tenant Stats 
            <span className="text-muted-foreground text-base ml-2">
              ({filteredAndSortedTenants?.length || 0} tenant{filteredAndSortedTenants?.length !== 1 ? 's' : ''})
            </span>
          </h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading tenants...</p>
            </div>
          ) : filteredAndSortedTenants && filteredAndSortedTenants.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAndSortedTenants.map((tenant) => (
                <Card key={tenant.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.contact}</p>
                        <p className="text-sm text-muted-foreground">{tenant.address}</p>
                      </div>
                      <Link to={`/tenant/${tenant.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Added {format(parseISO(tenant.created_at), "MMM dd, yyyy")}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Agent</p>
                        <p className="text-sm font-medium text-foreground">{tenant.agent_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Service Center</p>
                        <p className="text-sm font-medium text-foreground">{tenant.service_center || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <p className="text-sm font-semibold text-foreground">
                          {tenant.totalDue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Collected</p>
                        <p className="text-sm font-semibold text-primary">
                          {tenant.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="text-sm font-semibold text-accent">
                          {tenant.collectionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {tenant.paidCount} of {tenant.totalCount} payments
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tenant.collectionRate >= 80 
                          ? "bg-primary/10 text-primary" 
                          : tenant.collectionRate >= 50
                          ? "bg-accent/10 text-accent"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {tenant.collectionRate >= 80 ? "Excellent" : tenant.collectionRate >= 50 ? "Good" : "Needs Attention"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No tenants added in the last 7 days</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
