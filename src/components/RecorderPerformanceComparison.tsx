import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trophy, TrendingUp, Calendar, Activity } from "lucide-react";
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

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Fetch recorder performance stats
      const { data: payments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("recorded_by, amount, recorded_at")
        .not("recorded_by", "is", null);

      if (paymentsError) throw paymentsError;

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
