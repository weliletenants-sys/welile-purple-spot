import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily forecast generation...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date
    const today = new Date();
    const forecastDate = today.toISOString().split('T')[0];
    
    // Calculate date ranges
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];
    
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(today.getDate() + 14);
    const fourteenDaysFromNowStr = fourteenDaysFromNow.toISOString().split('T')[0];
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString().split('T')[0];

    console.log(`Fetching historical payments from ${thirtyDaysAgoStr} to ${forecastDate}`);

    // Fetch historical payment data (last 30 days)
    const { data: historicalPayments, error: paymentsError } = await supabase
      .from('daily_payments')
      .select('date, paid_amount, amount, paid')
      .gte('date', thirtyDaysAgoStr)
      .lte('date', forecastDate)
      .order('date');

    if (paymentsError) {
      console.error('Error fetching historical payments:', paymentsError);
      throw paymentsError;
    }

    console.log(`Found ${historicalPayments?.length || 0} historical payment records`);

    // Calculate daily statistics
    const dailyStats: Record<string, { expected: number; paid: number; count: number }> = {};
    
    historicalPayments?.forEach((payment) => {
      const date = payment.date;
      if (!dailyStats[date]) {
        dailyStats[date] = { expected: 0, paid: 0, count: 0 };
      }
      dailyStats[date].expected += Number(payment.amount);
      if (payment.paid) {
        dailyStats[date].paid += Number(payment.paid_amount || payment.amount);
      }
      dailyStats[date].count += 1;
    });

    // Calculate collection rates
    const rates = Object.values(dailyStats).map((stat) =>
      stat.expected > 0 ? (stat.paid / stat.expected) * 100 : 0
    );

    // Calculate average collection rate
    const avgCollectionRate = rates.length > 0
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      : 0;

    console.log(`Average collection rate: ${avgCollectionRate.toFixed(2)}%`);

    // Calculate trend (simple linear regression)
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

    const trend = calculateTrend(rates);
    console.log(`Trend: ${trend.toFixed(4)}`);

    // Fetch upcoming expected payments
    console.log(`Fetching upcoming payments from ${forecastDate} to ${thirtyDaysFromNowStr}`);
    
    const { data: upcomingPayments, error: upcomingError } = await supabase
      .from('daily_payments')
      .select('date, amount')
      .gte('date', forecastDate)
      .lte('date', thirtyDaysFromNowStr)
      .order('date');

    if (upcomingError) {
      console.error('Error fetching upcoming payments:', upcomingError);
      throw upcomingError;
    }

    console.log(`Found ${upcomingPayments?.length || 0} upcoming payment records`);

    // Group upcoming payments by period
    const groupByPeriod = (endDate: string) => {
      return upcomingPayments
        ?.filter(p => p.date <= endDate)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    };

    const expected7Days = groupByPeriod(sevenDaysFromNowStr);
    const expected14Days = groupByPeriod(fourteenDaysFromNowStr);
    const expected30Days = groupByPeriod(thirtyDaysFromNowStr);

    console.log(`Expected amounts - 7d: ${expected7Days}, 14d: ${expected14Days}, 30d: ${expected30Days}`);

    // Apply collection rate with trend adjustment
    const getForecast = (expected: number, daysAhead: number) => {
      const adjustedRate = avgCollectionRate + (trend * daysAhead);
      const clampedRate = Math.max(0, Math.min(100, adjustedRate));
      return (expected * clampedRate) / 100;
    };

    const forecast7Days = getForecast(expected7Days, 7);
    const forecast14Days = getForecast(expected14Days, 14);
    const forecast30Days = getForecast(expected30Days, 30);

    console.log(`Forecasted amounts - 7d: ${forecast7Days}, 14d: ${forecast14Days}, 30d: ${forecast30Days}`);

    // Prepare forecasts to save
    const forecastsToSave = [
      {
        forecast_date: forecastDate,
        target_date: sevenDaysFromNowStr,
        expected_amount: expected7Days,
        forecast_amount: forecast7Days,
        collection_rate: avgCollectionRate,
        days_ahead: 7,
      },
      {
        forecast_date: forecastDate,
        target_date: fourteenDaysFromNowStr,
        expected_amount: expected14Days,
        forecast_amount: forecast14Days,
        collection_rate: avgCollectionRate,
        days_ahead: 14,
      },
      {
        forecast_date: forecastDate,
        target_date: thirtyDaysFromNowStr,
        expected_amount: expected30Days,
        forecast_amount: forecast30Days,
        collection_rate: avgCollectionRate,
        days_ahead: 30,
      },
    ];

    console.log('Saving forecasts to database...');

    // Save forecasts to database
    const { data: savedForecasts, error: saveError } = await supabase
      .from('payment_forecasts')
      .insert(forecastsToSave)
      .select();

    if (saveError) {
      console.error('Error saving forecasts:', saveError);
      throw saveError;
    }

    console.log(`Successfully saved ${savedForecasts?.length || 0} forecasts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily forecasts generated successfully',
        forecastDate,
        forecasts: {
          sevenDays: {
            targetDate: sevenDaysFromNowStr,
            expected: expected7Days,
            forecast: Math.round(forecast7Days),
          },
          fourteenDays: {
            targetDate: fourteenDaysFromNowStr,
            expected: expected14Days,
            forecast: Math.round(forecast14Days),
          },
          thirtyDays: {
            targetDate: thirtyDaysFromNowStr,
            expected: expected30Days,
            forecast: Math.round(forecast30Days),
          },
        },
        collectionRate: avgCollectionRate.toFixed(2),
        trend: trend.toFixed(4),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-daily-forecast function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
