import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

export interface DailyComparison {
  date: string;
  expected: number;
  actual: number;
  difference: number;
  percentageOfExpected: number;
}

export const useDailyPaymentComparison = (days: number = 7) => {
  return useQuery({
    queryKey: ["daily-payment-comparison", days],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const startDate = format(subDays(today, days - 1), "yyyy-MM-dd");
      const endDate = format(today, "yyyy-MM-dd");

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

      // Combine forecasts with actuals
      const comparisons: DailyComparison[] = [];
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(today, days - 1 - i), "yyyy-MM-dd");
        const forecast = forecasts?.find(f => f.target_date === date);
        const expected = forecast?.expected_amount || 0;
        const actual = actualByDate[date] || 0;
        const difference = actual - expected;
        const percentageOfExpected = expected > 0 ? (actual / expected) * 100 : 0;

        comparisons.push({
          date,
          expected,
          actual,
          difference,
          percentageOfExpected,
        });
      }

      return comparisons;
    },
  });
};
