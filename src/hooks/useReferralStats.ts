import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";

export interface ReferrerStats {
  referrerName: string;
  referrerPhone: string;
  totalEarnings: number;
  totalTenants: number;
  tenants: {
    id: string;
    name: string;
    contact: string;
    district: string;
    createdAt: string;
    earnings: number;
  }[];
}

export type TimePeriod = "all" | "week" | "month";

interface UseReferralStatsParams {
  period?: TimePeriod;
}

export const useReferralStats = ({ period = "all" }: UseReferralStatsParams = {}) => {
  return useQuery({
    queryKey: ["referral-stats", period],
    queryFn: async () => {
      let query = supabase
        .from("agent_earnings")
        .select(`
          agent_name,
          agent_phone,
          amount,
          created_at,
          tenant_id,
          tenants (
            id,
            name,
            contact,
            location_district,
            created_at
          )
        `)
        .eq("earning_type", "pipeline_referral")
        .order("created_at", { ascending: false });

      // Apply date filtering based on period
      if (period === "week") {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        query = query
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());
      } else if (period === "month") {
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        query = query
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());
      }

      const { data: earnings, error } = await query;

      if (error) throw error;

      // Group by referrer
      const referrerMap = new Map<string, ReferrerStats>();

      earnings?.forEach((earning: any) => {
        const key = `${earning.agent_name}-${earning.agent_phone}`;
        
        if (!referrerMap.has(key)) {
          referrerMap.set(key, {
            referrerName: earning.agent_name,
            referrerPhone: earning.agent_phone,
            totalEarnings: 0,
            totalTenants: 0,
            tenants: [],
          });
        }

        const referrer = referrerMap.get(key)!;
        referrer.totalEarnings += Number(earning.amount);
        referrer.totalTenants += 1;

        if (earning.tenants) {
          referrer.tenants.push({
            id: earning.tenants.id,
            name: earning.tenants.name,
            contact: earning.tenants.contact,
            district: earning.tenants.location_district || "N/A",
            createdAt: earning.created_at,
            earnings: Number(earning.amount),
          });
        }
      });

      // Convert map to array and sort by total earnings
      return Array.from(referrerMap.values()).sort(
        (a, b) => b.totalEarnings - a.totalEarnings
      );
    },
  });
};

export const useReferralTotals = () => {
  return useQuery({
    queryKey: ["referral-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_earnings")
        .select("amount")
        .eq("earning_type", "pipeline_referral");

      if (error) throw error;

      const totalEarnings = data.reduce((sum, earning) => sum + Number(earning.amount), 0);
      const totalTenants = data.length;
      const uniqueReferrers = new Set(data.map(() => "referrer")).size; // This will be calculated properly in the main query

      return {
        totalEarnings,
        totalTenants,
        uniqueReferrers: 0, // Will be set from main query
      };
    },
  });
};
