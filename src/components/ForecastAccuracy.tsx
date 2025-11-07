import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart } from "recharts";

export const ForecastAccuracy = () => {
  const { data: accuracyData, isLoading } = useQuery({
    queryKey: ["forecast-accuracy"],
    queryFn: async () => {
      // Fetch forecasts from last 30 days that have passed
      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      
      const { data: forecasts, error: forecastError } = await supabase
        .from("payment_forecasts")
        .select("*")
        .lte("target_date", today)
        .gte("target_date", thirtyDaysAgo)
        .order("target_date");
      
      if (forecastError) throw forecastError;
      
      if (!forecasts || forecasts.length === 0) {
        return {
          hasData: false,
          message: "No historical forecasts found. Forecasts will be saved automatically for future accuracy tracking.",
        };
      }
      
      // Fetch actual payments for those dates
      const targetDates = [...new Set(forecasts.map(f => f.target_date))];
      const { data: actualPayments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("date, paid_amount, amount, paid")
        .in("date", targetDates);
      
      if (paymentsError) throw paymentsError;
      
      // Group actual payments by date
      const actualByDate = actualPayments?.reduce((acc: any, payment) => {
        const date = payment.date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        if (payment.paid) {
          acc[date] += Number(payment.paid_amount || payment.amount);
        }
        return acc;
      }, {});
      
      // Calculate accuracy metrics
      const comparisons = forecasts.map(forecast => {
        const actual = actualByDate[forecast.target_date] || 0;
        const predicted = Number(forecast.forecast_amount);
        const error = Math.abs(actual - predicted);
        const percentError = predicted > 0 ? (error / predicted) * 100 : 0;
        const accuracy = Math.max(0, 100 - percentError);
        
        return {
          date: format(parseISO(forecast.target_date), "MMM dd"),
          actual,
          predicted,
          error,
          percentError,
          accuracy,
          daysAhead: forecast.days_ahead,
          targetDate: forecast.target_date,
        };
      });
      
      // Calculate overall metrics
      const totalError = comparisons.reduce((sum, c) => sum + c.error, 0);
      const meanAbsoluteError = comparisons.length > 0 ? totalError / comparisons.length : 0;
      
      const totalPercentError = comparisons.reduce((sum, c) => sum + c.percentError, 0);
      const meanPercentError = comparisons.length > 0 ? totalPercentError / comparisons.length : 0;
      
      const overallAccuracy = Math.max(0, 100 - meanPercentError);
      
      // Count predictions within different accuracy bands
      const within5Percent = comparisons.filter(c => c.percentError <= 5).length;
      const within10Percent = comparisons.filter(c => c.percentError <= 10).length;
      const within20Percent = comparisons.filter(c => c.percentError <= 20).length;
      
      // Prepare chart data
      const chartData = comparisons.map(c => ({
        date: c.date,
        actual: c.actual,
        predicted: c.predicted,
      }));
      
      // Prepare scatter plot data for correlation
      const scatterData = comparisons.map(c => ({
        predicted: c.predicted,
        actual: c.actual,
      }));
      
      return {
        hasData: true,
        overallAccuracy,
        meanAbsoluteError,
        meanPercentError,
        totalForecasts: comparisons.length,
        accuracyBands: {
          within5: (within5Percent / comparisons.length) * 100,
          within10: (within10Percent / comparisons.length) * 100,
          within20: (within20Percent / comparisons.length) * 100,
        },
        comparisons,
        chartData,
        scatterData,
      };
    },
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading accuracy analysis...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!accuracyData?.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Forecast Accuracy Tracking
          </CardTitle>
          <CardDescription>Compare predictions with actual collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">{accuracyData?.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Forecasts are generated daily and accuracy will be tracked automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "default";
    if (accuracy >= 75) return "secondary";
    if (accuracy >= 60) return "outline";
    return "destructive";
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Forecast Accuracy Tracking
          </CardTitle>
          <CardDescription>
            Performance of predictive models over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Accuracy */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{accuracyData.overallAccuracy.toFixed(1)}%</p>
              <Badge variant={getAccuracyColor(accuracyData.overallAccuracy)}>
                {accuracyData.totalForecasts} predictions analyzed
              </Badge>
            </div>
            
            {/* Mean Absolute Error */}
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Avg Error</p>
              <p className="text-2xl font-bold">
                UGX {Math.round(accuracyData.meanAbsoluteError).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                ±{accuracyData.meanPercentError.toFixed(1)}% deviation
              </p>
            </div>
            
            {/* Accuracy Bands */}
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">High Precision</p>
              <p className="text-2xl font-bold">{accuracyData.accuracyBands.within10.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                Within 10% of actual
              </p>
            </div>
            
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Good Precision</p>
              <p className="text-2xl font-bold">{accuracyData.accuracyBands.within20.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                Within 20% of actual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Predicted vs. Actual Collections</CardTitle>
          <CardDescription>Historical comparison of forecasts and actual payments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={accuracyData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
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
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Actual Collections"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Correlation Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Correlation</CardTitle>
          <CardDescription>How well predictions align with actual results</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="predicted" 
                name="Predicted"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Predicted Amount', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="actual" 
                name="Actual"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Actual Amount', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter 
                name="Predictions" 
                data={accuracyData.scatterData} 
                fill="hsl(var(--primary))"
                opacity={0.6}
              />
              {/* Perfect prediction line */}
              <Line 
                type="linear" 
                dataKey="predicted" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Perfect Prediction"
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Points closer to the diagonal line indicate more accurate predictions
          </p>
        </CardContent>
      </Card>
      
      {/* Recent Predictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prediction Results</CardTitle>
          <CardDescription>Detailed breakdown of recent forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accuracyData.comparisons.slice(-10).reverse().map((comp, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{comp.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {comp.daysAhead} day{comp.daysAhead !== 1 ? 's' : ''} ahead forecast
                    </p>
                  </div>
                  <Badge variant={getAccuracyColor(comp.accuracy)}>
                    {comp.accuracy.toFixed(1)}% accurate
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Predicted</p>
                    <p className="font-medium">UGX {comp.predicted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actual</p>
                    <p className="font-medium">UGX {comp.actual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Error</p>
                    <p className="font-medium text-destructive">
                      ±UGX {comp.error.toLocaleString()}
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
