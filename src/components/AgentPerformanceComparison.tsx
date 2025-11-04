import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, ArrowUp, ArrowDown, Minus, Play, TrendingUp, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AgentPeriodData {
  tenantsManaged: number;
  paymentsRecorded: number;
  totalPaymentAmount: number;
  earningsGenerated: number;
  dataEntryActivities: number;
  averagePaymentSize: number;
  tenantsWithPayments: number;
}

export const AgentPerformanceComparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [period1, setPeriod1] = useState<DateRange | undefined>();
  const [period2, setPeriod2] = useState<DateRange | undefined>();
  const [period1Data, setPeriod1Data] = useState<AgentPeriodData | null>(null);
  const [period2Data, setPeriod2Data] = useState<AgentPeriodData | null>(null);

  // Fetch agents list
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data: tenants } = await supabase
          .from('tenants')
          .select('agent_name')
          .not('agent_name', 'is', null);
        
        const uniqueAgents = Array.from(new Set(tenants?.map(t => t.agent_name).filter(Boolean) || [])) as string[];
        setAgents(uniqueAgents.sort());
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to load agents');
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  const fetchAgentPeriodData = async (agentName: string, dateRange: DateRange): Promise<AgentPeriodData> => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error('Invalid date range');
    }

    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');

    // Fetch agent's tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('*')
      .eq('agent_name', agentName);

    const tenantIds = tenants?.map(t => t.id) || [];

    // Fetch payments recorded by this agent in the period
    const { data: payments } = await supabase
      .from('daily_payments')
      .select('*')
      .in('tenant_id', tenantIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('recorded_by', agentName);

    // Fetch agent earnings
    const { data: earnings } = await supabase
      .from('agent_earnings')
      .select('*')
      .eq('agent_name', agentName)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Calculate statistics
    const tenantsManaged = tenants?.length || 0;
    const paymentsRecorded = payments?.length || 0;
    const totalPaymentAmount = payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0;
    const earningsGenerated = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const dataEntryActivities = earnings?.filter(e => e.earning_type === 'data_entry').length || 0;
    const averagePaymentSize = paymentsRecorded > 0 ? totalPaymentAmount / paymentsRecorded : 0;
    
    // Count unique tenants with payments
    const tenantsWithPayments = new Set(payments?.map(p => p.tenant_id)).size;

    return {
      tenantsManaged,
      paymentsRecorded,
      totalPaymentAmount,
      earningsGenerated,
      dataEntryActivities,
      averagePaymentSize,
      tenantsWithPayments
    };
  };

  const compareAgentPerformance = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    if (!period1?.from || !period1?.to || !period2?.from || !period2?.to) {
      toast.error('Please select both date ranges');
      return;
    }

    setIsComparing(true);
    try {
      const [data1, data2] = await Promise.all([
        fetchAgentPeriodData(selectedAgent, period1),
        fetchAgentPeriodData(selectedAgent, period2)
      ]);

      setPeriod1Data(data1);
      setPeriod2Data(data2);
      toast.success(`Comparison for ${selectedAgent} generated successfully!`);
    } catch (error) {
      console.error('Error comparing agent performance:', error);
      toast.error('Failed to generate comparison');
    } finally {
      setIsComparing(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return { percentage: 0, trend: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const;
    return { percentage: Math.abs(change), trend };
  };

  const renderTrend = (trend: 'up' | 'down' | 'neutral', percentage: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{percentage.toFixed(1)}%</span>
        </div>
      );
    }
    if (trend === 'down') {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <ArrowDown className="h-4 w-4" />
          <span className="text-sm font-medium">-{percentage.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  };

  // Prepare chart data
  const comparisonChartData = period1Data && period2Data ? [
    {
      metric: 'Payments Recorded',
      'Period 1': period1Data.paymentsRecorded,
      'Period 2': period2Data.paymentsRecorded
    },
    {
      metric: 'Payment Amount (K)',
      'Period 1': Math.round(period1Data.totalPaymentAmount / 1000),
      'Period 2': Math.round(period2Data.totalPaymentAmount / 1000)
    },
    {
      metric: 'Earnings (K)',
      'Period 1': Math.round(period1Data.earningsGenerated / 1000),
      'Period 2': Math.round(period2Data.earningsGenerated / 1000)
    },
    {
      metric: 'Avg Payment Size (K)',
      'Period 1': Math.round(period1Data.averagePaymentSize / 1000),
      'Period 2': Math.round(period2Data.averagePaymentSize / 1000)
    }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Comparison</CardTitle>
          <CardDescription>Track individual agent performance across different time periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Agent</label>
            {loadingAgents ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Period 1 Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Period 1</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !period1 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {period1?.from ? (
                      period1.to ? (
                        <>
                          {format(period1.from, "LLL dd, y")} - {format(period1.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(period1.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick period 1</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={period1?.from}
                    selected={period1}
                    onSelect={setPeriod1}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Period 2 Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Period 2</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !period2 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {period2?.from ? (
                      period2.to ? (
                        <>
                          {format(period2.from, "LLL dd, y")} - {format(period2.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(period2.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick period 2</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={period2?.from}
                    selected={period2}
                    onSelect={setPeriod2}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={compareAgentPerformance} disabled={isComparing || !selectedAgent} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isComparing ? 'Comparing...' : 'Compare Performance'}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {period1Data && period2Data && selectedAgent && (
        <>
          {/* Agent Overview */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {selectedAgent} - Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tenants Managed</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold">{period1Data.tenantsManaged}</p>
                    <span className="text-xs text-muted-foreground">→ {period2Data.tenantsManaged}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Tenants</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold">{period1Data.tenantsWithPayments}</p>
                    <span className="text-xs text-muted-foreground">→ {period2Data.tenantsWithPayments}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold">{period1Data.paymentsRecorded}</p>
                    <span className="text-xs text-muted-foreground">→ {period2Data.paymentsRecorded}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Entry</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold">{period1Data.dataEntryActivities}</p>
                    <span className="text-xs text-muted-foreground">→ {period2Data.dataEntryActivities}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics Comparison */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payments Recorded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-2xl font-bold">{period1Data.paymentsRecorded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-2xl font-bold">{period2Data.paymentsRecorded}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {renderTrend(
                        calculateChange(period2Data.paymentsRecorded, period1Data.paymentsRecorded).trend,
                        calculateChange(period2Data.paymentsRecorded, period1Data.paymentsRecorded).percentage
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Payment Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-lg font-bold">UGX {period1Data.totalPaymentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-lg font-bold">UGX {period2Data.totalPaymentAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {renderTrend(
                        calculateChange(period2Data.totalPaymentAmount, period1Data.totalPaymentAmount).trend,
                        calculateChange(period2Data.totalPaymentAmount, period1Data.totalPaymentAmount).percentage
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Earnings Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-lg font-bold">UGX {period1Data.earningsGenerated.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-lg font-bold">UGX {period2Data.earningsGenerated.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {renderTrend(
                        calculateChange(period2Data.earningsGenerated, period1Data.earningsGenerated).trend,
                        calculateChange(period2Data.earningsGenerated, period1Data.earningsGenerated).percentage
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Average Payment Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-lg font-bold">UGX {Math.round(period1Data.averagePaymentSize).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-lg font-bold">UGX {Math.round(period2Data.averagePaymentSize).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {renderTrend(
                        calculateChange(period2Data.averagePaymentSize, period1Data.averagePaymentSize).trend,
                        calculateChange(period2Data.averagePaymentSize, period1Data.averagePaymentSize).percentage
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tenants with Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-2xl font-bold">{period1Data.tenantsWithPayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-2xl font-bold">{period2Data.tenantsWithPayments}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {renderTrend(
                        calculateChange(period2Data.tenantsWithPayments, period1Data.tenantsWithPayments).trend,
                        calculateChange(period2Data.tenantsWithPayments, period1Data.tenantsWithPayments).percentage
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-2xl font-bold">
                      {period1Data.tenantsManaged > 0 
                        ? ((period1Data.tenantsWithPayments / period1Data.tenantsManaged) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-2xl font-bold">
                      {period2Data.tenantsManaged > 0 
                        ? ((period2Data.tenantsWithPayments / period2Data.tenantsManaged) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change</span>
                      {(() => {
                        const rate1 = period1Data.tenantsManaged > 0 
                          ? (period1Data.tenantsWithPayments / period1Data.tenantsManaged) * 100 
                          : 0;
                        const rate2 = period2Data.tenantsManaged > 0 
                          ? (period2Data.tenantsWithPayments / period2Data.tenantsManaged) * 100 
                          : 0;
                        return renderTrend(
                          calculateChange(rate2, rate1).trend,
                          calculateChange(rate2, rate1).percentage
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison Chart</CardTitle>
              <CardDescription>Visual comparison of key performance metrics (values in thousands)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Period 1" fill="hsl(var(--primary))" />
                  <Bar dataKey="Period 2" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
