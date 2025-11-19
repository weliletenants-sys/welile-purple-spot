import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyPaymentComparison } from "@/hooks/useDailyPaymentComparison";
import { format, subDays, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const WeeklySummaryCard = () => {
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 6);
  
  const { data: comparisons, isLoading } = useDailyPaymentComparison({
    from: weekAgo,
    to: today,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  // Calculate weekly stats
  const weeklyStats = comparisons.reduce(
    (acc, day) => ({
      totalExpected: acc.totalExpected + day.expected,
      totalActual: acc.totalActual + day.actual,
      daysAboveTarget: acc.daysAboveTarget + (day.percentageOfExpected > 100 ? 1 : 0),
      daysBelowTarget: acc.daysBelowTarget + (day.percentageOfExpected < 100 ? 1 : 0),
    }),
    { totalExpected: 0, totalActual: 0, daysAboveTarget: 0, daysBelowTarget: 0 }
  );

  const weeklyPerformance = weeklyStats.totalExpected > 0
    ? (weeklyStats.totalActual / weeklyStats.totalExpected) * 100
    : 0;

  const isAboveTarget = weeklyPerformance > 100;

  // Prepare chart data
  const chartData = comparisons.map((day) => ({
    date: format(new Date(day.date), "EEE"),
    expected: day.expected,
    actual: day.actual,
    performance: day.percentageOfExpected,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Performance Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAboveTarget ? (
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-2xl font-bold ${
                isAboveTarget
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {weeklyPerformance.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Expected</p>
            <p className="text-lg font-bold text-foreground">
              UGX {(weeklyStats.totalExpected / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Actual</p>
            <p className="text-lg font-bold text-foreground">
              UGX {(weeklyStats.totalActual / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-muted-foreground mb-1">Days Above</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {weeklyStats.daysAboveTarget}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-muted-foreground mb-1">Days Below</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {weeklyStats.daysBelowTarget}
            </p>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Daily Performance (%)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expected vs Actual Bar Chart */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Expected vs Actual</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`UGX ${value.toLocaleString()}`, ""]}
              />
              <Bar dataKey="expected" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
