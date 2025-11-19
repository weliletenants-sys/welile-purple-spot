import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export interface DailyComparison {
  date: string;
  expected: number;
  actual: number;
  difference: number;
  percentageOfExpected: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export const useDailyPaymentComparison = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["daily-payment-comparison", dateRange],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const startDate = dateRange?.from 
        ? format(dateRange.from, "yyyy-MM-dd")
        : format(subDays(today, 6), "yyyy-MM-dd");
      const endDate = dateRange?.to 
        ? format(dateRange.to, "yyyy-MM-dd")
        : format(today, "yyyy-MM-dd");

      // Fetch forecasts
      const { data: forecasts, error: forecastError } = await supabase
        .from("payment_forecasts")
        .select("target_date, expected_amount")
        .gte("target_date", startDate)
        .lte("target_date", endDate)
        .order("target_date", { ascending: true });

      if (forecastError) throw forecastError;

      // Fetch actual payments
      const { data: payments, error: paymentError } = await supabase
        .from("daily_payments")
        .select("date, paid_amount")
        .gte("date", startDate)
        .lte("date", endDate)
        .eq("paid", true);

      if (paymentError) throw paymentError;

      // Group actual payments by date
      const actualByDate = payments?.reduce((acc, payment) => {
        const date = payment.date;
        acc[date] = (acc[date] || 0) + (payment.paid_amount || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      // Get all dates in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allDates = eachDayOfInterval({ start, end });

      // Combine forecasts with actuals
      const comparisons: DailyComparison[] = allDates.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const forecast = forecasts?.find(f => f.target_date === dateStr);
        const expected = forecast?.expected_amount || 0;
        const actual = actualByDate[dateStr] || 0;
        const difference = actual - expected;
        const percentageOfExpected = expected > 0 ? (actual / expected) * 100 : 0;

        return {
          date: dateStr,
          expected,
          actual,
          difference,
          percentageOfExpected,
        };
      });

      return comparisons;
    },
  });
};
