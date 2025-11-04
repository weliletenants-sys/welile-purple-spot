import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, TrendingUp, Calendar, Activity, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface RecorderPerformance {
  recorder_name: string;
  payments_count: number;
  total_amount: number;
  avg_payment: number;
  first_payment: string;
  last_payment: string;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface RecorderDailyActivity {
  recorder_name: string;
  activities: DailyActivity[];
}

export const RecorderPerformanceComparison = () => {
  const [performanceData, setPerformanceData] = useState<RecorderPerformance[]>([]);
  const [dailyActivities, setDailyActivities] = useState<RecorderDailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [allRecorders, setAllRecorders] = useState<string[]>([]);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedRecorders, setSelectedRecorders] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPerformanceData();
  }, [dateFrom, dateTo, selectedRecorders, paymentStatusFilter]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Build query with filters
      let query = supabase
        .from("daily_payments")
        .select("recorded_by, amount, recorded_at, paid")
        .not("recorded_by", "is", null);

      // Apply date filters
      if (dateFrom) {
        query = query.gte("recorded_at", format(dateFrom, "yyyy-MM-dd"));
      }
      if (dateTo) {
        query = query.lte("recorded_at", format(dateTo, "yyyy-MM-dd") + "T23:59:59");
      }

      // Apply recorder filter
      if (selectedRecorders.length > 0) {
        query = query.in("recorded_by", selectedRecorders);
      }

      // Apply payment status filter
      if (paymentStatusFilter !== "all") {
        query = query.eq("paid", paymentStatusFilter === "paid");
      }

      const { data: payments, error: paymentsError } = await query;

      if (paymentsError) throw paymentsError;

      // Collect all unique recorders for filter
      const uniqueRecorders = new Set<string>();
      payments?.forEach(p => p.recorded_by && uniqueRecorders.add(p.recorded_by));
      setAllRecorders(Array.from(uniqueRecorders).sort());

      // Aggregate performance data
      const performanceMap = new Map<string, RecorderPerformance>();
      const activityMap = new Map<string, Map<string, number>>();

      payments?.forEach((payment) => {
        const recorder = payment.recorded_by!;
        const amount = Number(payment.amount);
        const date = payment.recorded_at ? new Date(payment.recorded_at).toISOString().split('T')[0] : '';

        if (!performanceMap.has(recorder)) {
          performanceMap.set(recorder, {
            recorder_name: recorder,
            payments_count: 0,
            total_amount: 0,
            avg_payment: 0,
            first_payment: date,
            last_payment: date,
          });
        }

        const perf = performanceMap.get(recorder)!;
        perf.payments_count += 1;
        perf.total_amount += amount;
        if (date < perf.first_payment) perf.first_payment = date;
        if (date > perf.last_payment) perf.last_payment = date;

        // Track daily activity
        if (!activityMap.has(recorder)) {
          activityMap.set(recorder, new Map<string, number>());
        }
        const recorderActivity = activityMap.get(recorder)!;
        recorderActivity.set(date, (recorderActivity.get(date) || 0) + 1);
      });

      // Calculate averages and sort
      const performance = Array.from(performanceMap.values()).map(perf => ({
        ...perf,
        avg_payment: perf.total_amount / perf.payments_count,
      })).sort((a, b) => b.total_amount - a.total_amount);

      // Convert activity map to array format
      const activities = Array.from(activityMap.entries()).map(([recorder, dates]) => ({
        recorder_name: recorder,
        activities: Array.from(dates.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }));

      setPerformanceData(performance);
      setDailyActivities(activities);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const topPerformers = performanceData.slice(0, 5);
  const avgPaymentsPerRecorder = performanceData.length > 0
    ? performanceData.reduce((sum, p) => sum + p.payments_count, 0) / performanceData.length
    : 0;
  const avgAmountPerRecorder = performanceData.length > 0
    ? performanceData.reduce((sum, p) => sum + p.total_amount, 0) / performanceData.length
    : 0;

  const toggleRecorder = (recorder: string) => {
    setSelectedRecorders(prev =>
      prev.includes(recorder)
        ? prev.filter(r => r !== recorder)
        : [...prev, recorder]
    );
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedRecorders([]);
    setPaymentStatusFilter("all");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid Only</SelectItem>
                  <SelectItem value="unpaid">Unpaid Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recorder Selection */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Select Recorders (Optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg">
              {allRecorders.map((recorder) => (
                <div key={recorder} className="flex items-center space-x-2">
                  <Checkbox
                    id={recorder}
                    checked={selectedRecorders.includes(recorder)}
                    onCheckedChange={() => toggleRecorder(recorder)}
                  />
                  <label
                    htmlFor={recorder}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {recorder}
                  </label>
                </div>
              ))}
            </div>
            {(dateFrom || dateTo || selectedRecorders.length > 0 || paymentStatusFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recorders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payments per Recorder</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPaymentsPerRecorder.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Amount per Recorder</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {avgAmountPerRecorder.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 5 Performers by Total Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.recorder_name} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{performer.recorder_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {performer.payments_count} payments
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    UGX {performer.total_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg: UGX {performer.avg_payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payments Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payments Recorded Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recorder_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="payments_count" fill="hsl(var(--primary))" name="Payments Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total Amount Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Amount Recorded Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recorder_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `UGX ${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="total_amount" fill="hsl(var(--chart-2))" name="Total Amount (UGX)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Heatmap - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recording Activity Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyActivities.slice(0, 5).map((recorderActivity) => (
            <div key={recorderActivity.recorder_name} className="mb-8 last:mb-0">
              <h4 className="mb-4 font-semibold">{recorderActivity.recorder_name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={recorderActivity.activities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: number) => [`${value} payments`, 'Count']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
