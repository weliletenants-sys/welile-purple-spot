import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

export const useTrendData = (days: number = 30) => {
  return useQuery({
    queryKey: ["trendData", days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      // Fetch payments grouped by date
      const { data: payments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("date, paid_amount, amount, paid")
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });
      
      if (paymentsError) throw paymentsError;
      
      // Fetch tenants created over time
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("created_at, status")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      
      if (tenantsError) throw tenantsError;
      
      // Process payment trends
      const paymentsByDate = new Map<string, { paid: number; expected: number }>();
      payments?.forEach(payment => {
        const dateKey = payment.date;
        const current = paymentsByDate.get(dateKey) || { paid: 0, expected: 0 };
        
        if (payment.paid) {
          current.paid += Number(payment.paid_amount || payment.amount);
        }
        current.expected += Number(payment.amount);
        
        paymentsByDate.set(dateKey, current);
      });
      
      // Process tenant trends
      const tenantsByDate = new Map<string, { active: number; pipeline: number }>();
      tenants?.forEach(tenant => {
        const dateKey = format(new Date(tenant.created_at), "yyyy-MM-dd");
        const current = tenantsByDate.get(dateKey) || { active: 0, pipeline: 0 };
        
        if (tenant.status === "active") {
          current.active += 1;
        } else if (tenant.status === "pipeline") {
          current.pipeline += 1;
        }
        
        tenantsByDate.set(dateKey, current);
      });
      
      // Generate complete date range
      const dateRange: string[] = [];
      for (let i = 0; i < days; i++) {
        dateRange.push(format(subDays(endDate, days - i - 1), "yyyy-MM-dd"));
      }
      
      // Combine all data
      const paymentTrend = dateRange.map(date => ({
        date: format(new Date(date), "MMM dd"),
        paid: paymentsByDate.get(date)?.paid || 0,
        expected: paymentsByDate.get(date)?.expected || 0,
        rate: paymentsByDate.get(date) 
          ? ((paymentsByDate.get(date)!.paid / paymentsByDate.get(date)!.expected) * 100).toFixed(1)
          : 0
      }));
      
      const tenantTrend = dateRange.map(date => ({
        date: format(new Date(date), "MMM dd"),
        active: tenantsByDate.get(date)?.active || 0,
        pipeline: tenantsByDate.get(date)?.pipeline || 0,
      }));
      
      return {
        paymentTrend,
        tenantTrend,
      };
    },
  });
};

export const useDistributionData = () => {
  return useQuery({
    queryKey: ["distributionData"],
    queryFn: async () => {
      // Fetch tenants for status distribution
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("status, source, service_center");
      
      if (tenantsError) throw tenantsError;
      
      // Status distribution
      const statusCounts = new Map<string, number>();
      const sourceCounts = new Map<string, number>();
      const serviceCenterCounts = new Map<string, number>();
      
      tenants?.forEach(tenant => {
        statusCounts.set(tenant.status, (statusCounts.get(tenant.status) || 0) + 1);
        sourceCounts.set(tenant.source || "unknown", (sourceCounts.get(tenant.source || "unknown") || 0) + 1);
        if (tenant.service_center) {
          serviceCenterCounts.set(tenant.service_center, (serviceCenterCounts.get(tenant.service_center) || 0) + 1);
        }
      });
      
      const statusDistribution = Array.from(statusCounts.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
      
      const sourceDistribution = Array.from(sourceCounts.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
      
      const serviceCenterDistribution = Array.from(serviceCenterCounts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 service centers
      
      return {
        statusDistribution,
        sourceDistribution,
        serviceCenterDistribution,
      };
    },
  });
};
