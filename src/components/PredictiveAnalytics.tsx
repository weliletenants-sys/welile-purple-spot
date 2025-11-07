import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, Save } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { toast } from "sonner";

export const PredictiveAnalytics = () => {
  const queryClient = useQueryClient();
  
  const { data: forecast, isLoading } = useQuery({
    queryKey: ["payment-forecast"],
    queryFn: async () => {
      // Fetch last 30 days of payment data
      const thirtyDaysAgo = format(addDays(new Date(), -30), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data: historicalPayments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("date, paid_amount, amount, paid")
        .gte("date", thirtyDaysAgo)
        .lte("date", today)
        .order("date");
      
      if (paymentsError) throw paymentsError;
      
      // Group by date and calculate daily stats
      const dailyStats = historicalPayments?.reduce((acc: any, payment) => {
        const date = payment.date;
        if (!acc[date]) {
          acc[date] = { expected: 0, paid: 0, count: 0 };
        }
        acc[date].expected += Number(payment.amount);
        if (payment.paid) {
          acc[date].paid += Number(payment.paid_amount || payment.amount);
        }
        acc[date].count += 1;
        return acc;
      }, {});
      
      // Calculate daily collection rates
      const rates = Object.values(dailyStats || {}).map((stat: any) => 
        stat.expected > 0 ? (stat.paid / stat.expected) * 100 : 0
      );
      
      // Calculate average collection rate
      const avgCollectionRate = rates.length > 0 
        ? rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length 
        : 0;
      
      // Calculate trend (simple linear regression slope)
      const trend = calculateTrend(rates);
      
      // Fetch upcoming expected payments
      const sevenDaysFromNow = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const fourteenDaysFromNow = format(addDays(new Date(), 14), "yyyy-MM-dd");
      const thirtyDaysFromNow = format(addDays(new Date(), 30), "yyyy-MM-dd");
      
      const { data: upcomingPayments, error: upcomingError } = await supabase
        .from("daily_payments")
        .select("date, amount")
        .gte("date", today)
        .lte("date", thirtyDaysFromNow)
        .order("date");
      
      if (upcomingError) throw upcomingError;
      
      // Group upcoming payments by period
      const groupByPeriod = (endDate: string) => {
        return upcomingPayments
          ?.filter(p => p.date <= endDate)
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      };
      
      const expected7Days = groupByPeriod(sevenDaysFromNow);
      const expected14Days = groupByPeriod(fourteenDaysFromNow);
      const expected30Days = groupByPeriod(thirtyDaysFromNow);
      
      // Apply collection rate with trend adjustment
      const getForecast = (expected: number, daysAhead: number) => {
        const adjustedRate = avgCollectionRate + (trend * daysAhead);
        const clampedRate = Math.max(0, Math.min(100, adjustedRate));
        return (expected * clampedRate) / 100;
      };
      
      // Generate daily forecast for chart
      const dailyForecast = [];
      for (let i = 0; i <= 30; i++) {
        const forecastDate = addDays(new Date(), i);
        const dateStr = format(forecastDate, "yyyy-MM-dd");
        
        const dayPayments = upcomingPayments?.filter(p => p.date === dateStr) || [];
        const dayExpected = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const dayForecast = getForecast(dayExpected, i);
        
        dailyForecast.push({
          date: format(forecastDate, "MMM dd"),
          expected: dayExpected,
          forecast: Math.round(dayForecast),
          lower: Math.round(dayForecast * 0.85), // 85% confidence lower bound
          upper: Math.round(dayForecast * 1.15), // 115% confidence upper bound
        });
      }
      
      const forecastDate = format(new Date(), "yyyy-MM-dd");
      
      return {
        avgCollectionRate,
        trend,
        forecasts: {
          sevenDays: {
            expected: expected7Days,
            forecast: getForecast(expected7Days, 7),
            targetDate: sevenDaysFromNow,
          },
          fourteenDays: {
            expected: expected14Days,
            forecast: getForecast(expected14Days, 14),
            targetDate: fourteenDaysFromNow,
          },
          thirtyDays: {
            expected: expected30Days,
            forecast: getForecast(expected30Days, 30),
            targetDate: thirtyDaysFromNow,
          },
        },
        dailyForecast,
        forecastDate,
      };
    },
  });
  
  // Mutation to save forecast
  const saveForecastMutation = useMutation({
    mutationFn: async () => {
      if (!forecast) return;
      
      const forecastsToSave = [
        {
          forecast_date: forecast.forecastDate,
          target_date: forecast.forecasts.sevenDays.targetDate,
          expected_amount: forecast.forecasts.sevenDays.expected,
          forecast_amount: forecast.forecasts.sevenDays.forecast,
          collection_rate: forecast.avgCollectionRate,
          days_ahead: 7,
        },
        {
          forecast_date: forecast.forecastDate,
          target_date: forecast.forecasts.fourteenDays.targetDate,
          expected_amount: forecast.forecasts.fourteenDays.expected,
          forecast_amount: forecast.forecasts.fourteenDays.forecast,
          collection_rate: forecast.avgCollectionRate,
          days_ahead: 14,
        },
        {
          forecast_date: forecast.forecastDate,
          target_date: forecast.forecasts.thirtyDays.targetDate,
          expected_amount: forecast.forecasts.thirtyDays.expected,
          forecast_amount: forecast.forecasts.thirtyDays.forecast,
          collection_rate: forecast.avgCollectionRate,
          days_ahead: 30,
        },
      ];
      
      const { error } = await supabase
        .from("payment_forecasts")
        .insert(forecastsToSave);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Forecast saved for accuracy tracking");
      queryClient.invalidateQueries({ queryKey: ["forecast-accuracy"] });
    },
    onError: () => {
      toast.error("Failed to save forecast");
    },
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading predictive analytics...</p>
        </CardContent>
      </Card>
    );
  }
  
  const trendDirection = (forecast?.trend || 0) >= 0 ? "improving" : "declining";
  const TrendIcon = trendDirection === "improving" ? TrendingUp : TrendingDown;
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                Forecast expected collections based on historical trends
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveForecastMutation.mutate()}
              disabled={saveForecastMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveForecastMutation.isPending ? "Saving..." : "Save Forecast"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Performance */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Collection Rate (30 days)</p>
                <p className="text-2xl font-bold">{forecast?.avgCollectionRate.toFixed(1)}%</p>
              </div>
              <Badge variant={trendDirection === "improving" ? "default" : "destructive"} className="gap-1">
                <TrendIcon className="h-3 w-3" />
                {trendDirection}
              </Badge>
            </div>
            
            {/* Forecasts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ForecastCard
                title="Next 7 Days"
                expected={forecast?.forecasts.sevenDays.expected || 0}
                forecast={forecast?.forecasts.sevenDays.forecast || 0}
              />
              <ForecastCard
                title="Next 14 Days"
                expected={forecast?.forecasts.fourteenDays.expected || 0}
                forecast={forecast?.forecasts.fourteenDays.forecast || 0}
              />
              <ForecastCard
                title="Next 30 Days"
                expected={forecast?.forecasts.thirtyDays.expected || 0}
                forecast={forecast?.forecasts.thirtyDays.forecast || 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Collection Forecast</CardTitle>
          <CardDescription>Expected vs. forecasted collections with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={forecast?.dailyForecast || []}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={4}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#confidenceGradient)"
                fillOpacity={1}
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--background))"
                name="Lower Bound"
              />
              <Line 
                type="monotone" 
                dataKey="expected" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Expected"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Forecast"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for forecast cards
const ForecastCard = ({ 
  title, 
  expected, 
  forecast 
}: { 
  title: string; 
  expected: number; 
  forecast: number; 
}) => {
  const collectionRate = expected > 0 ? (forecast / expected) * 100 : 0;
  
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Expected:</span>
          <span className="font-medium">UGX {expected.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Forecast:</span>
          <span className="font-bold text-primary">UGX {Math.round(forecast).toLocaleString()}</span>
        </div>
        <div className="pt-2">
          <Badge variant="outline" className="w-full justify-center">
            {collectionRate.toFixed(1)}% collection rate
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Calculate trend using simple linear regression
const calculateTrend = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
};
