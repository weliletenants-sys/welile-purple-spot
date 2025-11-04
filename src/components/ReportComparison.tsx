import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, ArrowUp, ArrowDown, Minus, Play } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PeriodData {
  totalTenants: number;
  totalPayments: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  topAgents: Array<{ name: string; amount: number }>;
}

export const ReportComparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [period1, setPeriod1] = useState<DateRange | undefined>();
  const [period2, setPeriod2] = useState<DateRange | undefined>();
  const [period1Data, setPeriod1Data] = useState<PeriodData | null>(null);
  const [period2Data, setPeriod2Data] = useState<PeriodData | null>(null);

  const fetchPeriodData = async (dateRange: DateRange): Promise<PeriodData> => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error('Invalid date range');
    }

    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');

    // Fetch data for the period
    const { data: tenants } = await supabase.from('tenants').select('*');
    
    const { data: payments } = await supabase
      .from('daily_payments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Calculate statistics
    const totalTenants = tenants?.length || 0;
    const totalPayments = payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;

    // Agent performance
    const agentStats: Record<string, number> = {};
    for (const payment of payments || []) {
      const tenant = tenants?.find(t => t.id === payment.tenant_id);
      if (tenant?.agent_name) {
        agentStats[tenant.agent_name] = (agentStats[tenant.agent_name] || 0) + (Number(payment.paid_amount) || 0);
      }
    }

    const topAgents = Object.entries(agentStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    return {
      totalTenants,
      totalPayments,
      totalWithdrawals,
      pendingWithdrawals,
      topAgents
    };
  };

  const compareReports = async () => {
    if (!period1?.from || !period1?.to || !period2?.from || !period2?.to) {
      toast.error('Please select both date ranges');
      return;
    }

    setIsComparing(true);
    try {
      const [data1, data2] = await Promise.all([
        fetchPeriodData(period1),
        fetchPeriodData(period2)
      ]);

      setPeriod1Data(data1);
      setPeriod2Data(data2);
      toast.success('Comparison generated successfully!');
    } catch (error) {
      console.error('Error comparing reports:', error);
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
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
      );
    }
    if (trend === 'down') {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <ArrowDown className="h-4 w-4" />
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
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

  const tenantsChange = period1Data && period2Data 
    ? calculateChange(period1Data.totalTenants, period2Data.totalTenants)
    : null;

  const paymentsChange = period1Data && period2Data
    ? calculateChange(period1Data.totalPayments, period2Data.totalPayments)
    : null;

  const withdrawalsChange = period1Data && period2Data
    ? calculateChange(period1Data.totalWithdrawals, period2Data.totalWithdrawals)
    : null;

  // Prepare chart data
  const comparisonChartData = period1Data && period2Data ? [
    {
      metric: 'Tenants',
      'Period 1': period1Data.totalTenants,
      'Period 2': period2Data.totalTenants
    },
    {
      metric: 'Payments',
      'Period 1': period1Data.totalPayments / 1000,
      'Period 2': period2Data.totalPayments / 1000
    },
    {
      metric: 'Withdrawals',
      'Period 1': period1Data.totalWithdrawals / 1000,
      'Period 2': period2Data.totalWithdrawals / 1000
    }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
          <CardDescription>Compare two different time periods side by side</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Button onClick={compareReports} disabled={isComparing} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isComparing ? 'Comparing...' : 'Compare Periods'}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {period1Data && period2Data && (
        <>
          {/* Metrics Comparison */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-2xl font-bold">{period1Data.totalTenants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-2xl font-bold">{period2Data.totalTenants}</span>
                  </div>
                  {tenantsChange && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Change</span>
                        {renderTrend(tenantsChange.trend, tenantsChange.percentage)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-lg font-bold">UGX {period1Data.totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-lg font-bold">UGX {period2Data.totalPayments.toLocaleString()}</span>
                  </div>
                  {paymentsChange && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Change</span>
                        {renderTrend(paymentsChange.trend, paymentsChange.percentage)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 1</span>
                    <span className="text-lg font-bold">UGX {period1Data.totalWithdrawals.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period 2</span>
                    <span className="text-lg font-bold">UGX {period2Data.totalWithdrawals.toLocaleString()}</span>
                  </div>
                  {withdrawalsChange && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Change</span>
                        {renderTrend(withdrawalsChange.trend, withdrawalsChange.percentage)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics (Payments & Withdrawals in thousands)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Period 1" fill="hsl(var(--primary))" />
                  <Bar dataKey="Period 2" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Agents Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Period 1 - Top Agents</CardTitle>
                <CardDescription>
                  {period1?.from && period1?.to && 
                    `${format(period1.from, "MMM dd")} - ${format(period1.to, "MMM dd")}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {period1Data.topAgents.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <span className="font-semibold">UGX {agent.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Period 2 - Top Agents</CardTitle>
                <CardDescription>
                  {period2?.from && period2?.to && 
                    `${format(period2.from, "MMM dd")} - ${format(period2.to, "MMM dd")}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {period2Data.topAgents.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <span className="font-semibold">UGX {agent.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
