import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parseISO, startOfWeek, subWeeks, differenceInDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useEffect } from "react";

export const ForecastHistory = () => {
  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ["forecast-history"],
    queryFn: async () => {
      // Fetch all forecasts
      const { data: forecasts, error } = await supabase
        .from("payment_forecasts")
        .select("*")
        .order("forecast_date", { ascending: true });
      
      if (error) throw error;
      
      if (!forecasts || forecasts.length === 0) {
        return { hasData: false };
      }
      
      // Group by forecast date and days_ahead
      const groupedByPeriod: Record<number, any[]> = {
        7: [],
        14: [],
        30: [],
      };
      
      forecasts.forEach((forecast) => {
        if (groupedByPeriod[forecast.days_ahead]) {
          groupedByPeriod[forecast.days_ahead].push({
            forecastDate: forecast.forecast_date,
            targetDate: forecast.target_date,
            expected: Number(forecast.expected_amount),
            forecast: Number(forecast.forecast_amount),
            collectionRate: Number(forecast.collection_rate),
            daysAhead: forecast.days_ahead,
          });
        }
      });
      
      // Prepare chart data for each period
      const chartData7Days = groupedByPeriod[7].map((f) => ({
        date: format(parseISO(f.forecastDate), "MMM dd"),
        forecast: f.forecast,
        expected: f.expected,
        rate: f.collectionRate,
      }));
      
      const chartData14Days = groupedByPeriod[14].map((f) => ({
        date: format(parseISO(f.forecastDate), "MMM dd"),
        forecast: f.forecast,
        expected: f.expected,
        rate: f.collectionRate,
      }));
      
      const chartData30Days = groupedByPeriod[30].map((f) => ({
        date: format(parseISO(f.forecastDate), "MMM dd"),
        forecast: f.forecast,
        expected: f.expected,
        rate: f.collectionRate,
      }));
      
      // Calculate week-over-week changes
      const calculateWeekOverWeek = (data: any[], period: number) => {
        if (data.length < 2) return null;
        
        // Get the most recent forecast
        const latest = data[data.length - 1];
        
        // Find forecast from approximately one week ago
        const oneWeekAgo = data.find((f) => {
          const daysDiff = differenceInDays(
            parseISO(latest.forecastDate),
            parseISO(f.forecastDate)
          );
          return daysDiff >= 6 && daysDiff <= 8;
        });
        
        if (!oneWeekAgo) return null;
        
        const forecastChange = latest.forecast - oneWeekAgo.forecast;
        const forecastChangePercent = oneWeekAgo.forecast > 0 
          ? ((forecastChange / oneWeekAgo.forecast) * 100)
          : 0;
        
        const rateChange = latest.collectionRate - oneWeekAgo.collectionRate;
        
        return {
          period,
          latest: {
            forecastDate: latest.forecastDate,
            targetDate: latest.targetDate,
            forecast: latest.forecast,
            expected: latest.expected,
            rate: latest.collectionRate,
          },
          oneWeekAgo: {
            forecastDate: oneWeekAgo.forecastDate,
            targetDate: oneWeekAgo.targetDate,
            forecast: oneWeekAgo.forecast,
            expected: oneWeekAgo.expected,
            rate: oneWeekAgo.collectionRate,
          },
          changes: {
            forecastChange,
            forecastChangePercent,
            rateChange,
          },
        };
      };
      
      const weekOverWeek7 = calculateWeekOverWeek(groupedByPeriod[7], 7);
      const weekOverWeek14 = calculateWeekOverWeek(groupedByPeriod[14], 14);
      const weekOverWeek30 = calculateWeekOverWeek(groupedByPeriod[30], 30);
      
      return {
        hasData: true,
        totalForecasts: forecasts.length,
        chartData: {
          sevenDays: chartData7Days,
          fourteenDays: chartData14Days,
          thirtyDays: chartData30Days,
        },
        weekOverWeek: {
          sevenDays: weekOverWeek7,
          fourteenDays: weekOverWeek14,
          thirtyDays: weekOverWeek30,
        },
        recentForecasts: groupedByPeriod[7].slice(-10).reverse(),
      };
    },
  });
  
  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('forecast-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_forecasts'
        },
        () => {
          console.log('New forecast detected, refreshing history...');
          refetch();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading forecast history...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!historyData?.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Forecast History
          </CardTitle>
          <CardDescription>Historical forecast trends and comparisons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No forecast history available. Forecasts will appear here once generated.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Forecast History Dashboard
          </CardTitle>
          <CardDescription>
            Track forecast evolution and week-over-week performance • {historyData.totalForecasts} total forecasts
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Week-over-Week Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Week-over-Week Comparison</CardTitle>
          <CardDescription>How forecasts have changed from last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WeekOverWeekCard data={historyData.weekOverWeek.sevenDays} />
            <WeekOverWeekCard data={historyData.weekOverWeek.fourteenDays} />
            <WeekOverWeekCard data={historyData.weekOverWeek.thirtyDays} />
          </div>
        </CardContent>
      </Card>
      
      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Forecast Trends</CardTitle>
          <CardDescription>How forecast predictions have evolved over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="7days" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7days">7-Day Forecasts</TabsTrigger>
              <TabsTrigger value="14days">14-Day Forecasts</TabsTrigger>
              <TabsTrigger value="30days">30-Day Forecasts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="7days" className="space-y-4">
              <ForecastTrendChart data={historyData.chartData.sevenDays} title="7-Day" />
            </TabsContent>
            
            <TabsContent value="14days" className="space-y-4">
              <ForecastTrendChart data={historyData.chartData.fourteenDays} title="14-Day" />
            </TabsContent>
            
            <TabsContent value="30days" className="space-y-4">
              <ForecastTrendChart data={historyData.chartData.thirtyDays} title="30-Day" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Recent Forecasts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Forecast Records</CardTitle>
          <CardDescription>Latest 7-day forecasts generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {historyData.recentForecasts.map((forecast: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      Generated: {format(parseISO(forecast.forecastDate), "PPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Target: {format(parseISO(forecast.targetDate), "PPP")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {forecast.collectionRate.toFixed(1)}% rate
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Expected Amount</p>
                    <p className="font-medium">UGX {forecast.expected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Forecasted Collection</p>
                    <p className="font-medium text-primary">
                      UGX {Math.round(forecast.forecast).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Week-over-Week Card Component
const WeekOverWeekCard = ({ data }: { data: any }) => {
  if (!data) {
    return (
      <div className="border rounded-lg p-4 opacity-50">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {data?.period || 'N/A'}-Day Forecast
        </p>
        <p className="text-xs text-muted-foreground">Insufficient data for comparison</p>
      </div>
    );
  }
  
  const { period, latest, oneWeekAgo, changes } = data;
  const isPositive = changes.forecastChange >= 0;
  const TrendIcon = isPositive ? TrendingUp : changes.forecastChange < 0 ? TrendingDown : Minus;
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{period}-Day Forecast</p>
        <Badge variant={isPositive ? "default" : "destructive"}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {changes.forecastChangePercent >= 0 ? '+' : ''}
          {changes.forecastChangePercent.toFixed(1)}%
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">Latest Forecast</p>
          <p className="text-lg font-bold">UGX {Math.round(latest.forecast).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(latest.forecastDate), "MMM dd")}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground">Previous Week</p>
          <p className="text-sm font-medium">UGX {Math.round(oneWeekAgo.forecast).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(oneWeekAgo.forecastDate), "MMM dd")}
          </p>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Rate Change:</span>
          <span className={changes.rateChange >= 0 ? "text-green-600" : "text-red-600"}>
            {changes.rateChange >= 0 ? '+' : ''}{changes.rateChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Forecast Trend Chart Component
const ForecastTrendChart = ({ data, title }: { data: any[]; title: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No historical data available for {title} forecasts
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Forecast Amount Trend */}
      <div>
        <h4 className="text-sm font-medium mb-3">Forecast vs. Expected Trends</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.length / 8) || 0}
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
            <Line 
              type="monotone" 
              dataKey="expected" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              name="Expected Amount"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Forecasted Collection"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Collection Rate Trend */}
      <div>
        <h4 className="text-sm font-medium mb-3">Collection Rate Evolution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.length / 8) || 0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar 
              dataKey="rate" 
              fill="hsl(var(--primary))" 
              name="Collection Rate"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
