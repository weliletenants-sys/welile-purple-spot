import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subWeeks, subMonths } from "date-fns";

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
  rankChange?: "up" | "down" | "new" | "same";
  previousRank?: number;
  rankDifference?: number;
}

export type TimePeriod = "all" | "week" | "month";

interface UseReferralStatsParams {
  period?: TimePeriod;
}

const fetchPeriodData = async (startDate: Date | null, endDate: Date | null) => {
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

  if (startDate && endDate) {
    query = query
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());
  }

  const { data: earnings, error } = await query;
  if (error) throw error;

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

  return Array.from(referrerMap.values()).sort(
    (a, b) => b.totalEarnings - a.totalEarnings
  );
};

export const useReferralStats = ({ period = "all" }: UseReferralStatsParams = {}) => {
  return useQuery({
    queryKey: ["referral-stats", period],
    queryFn: async () => {
      let currentStart: Date | null = null;
      let currentEnd: Date | null = null;
      let previousStart: Date | null = null;
      let previousEnd: Date | null = null;

      // Set date ranges based on period
      if (period === "week") {
        currentStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        currentEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        previousStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        previousEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      } else if (period === "month") {
        currentStart = startOfMonth(new Date());
        currentEnd = endOfMonth(new Date());
        previousStart = startOfMonth(subMonths(new Date(), 1));
        previousEnd = endOfMonth(subMonths(new Date(), 1));
      }

      // Fetch current period data
      const currentData = await fetchPeriodData(currentStart, currentEnd);

      // For "all" period, no comparison needed
      if (period === "all") {
        return currentData;
      }

      // Fetch previous period data for comparison
      const previousData = await fetchPeriodData(previousStart, previousEnd);

      // Create a map of previous rankings
      const previousRankings = new Map<string, number>();
      previousData.forEach((referrer, index) => {
        const key = `${referrer.referrerName}-${referrer.referrerPhone}`;
        previousRankings.set(key, index + 1);
      });

      // Add rank comparison to current data
      return currentData.map((referrer, currentIndex) => {
        const key = `${referrer.referrerName}-${referrer.referrerPhone}`;
        const previousRank = previousRankings.get(key);
        const currentRank = currentIndex + 1;

        if (!previousRank) {
          // New entry
          return {
            ...referrer,
            rankChange: "new" as const,
          };
        }

        const rankDiff = previousRank - currentRank;

        if (rankDiff > 0) {
          // Moved up
          return {
            ...referrer,
            rankChange: "up" as const,
            previousRank,
            rankDifference: rankDiff,
          };
        } else if (rankDiff < 0) {
          // Moved down
          return {
            ...referrer,
            rankChange: "down" as const,
            previousRank,
            rankDifference: Math.abs(rankDiff),
          };
        } else {
          // Same position
          return {
            ...referrer,
            rankChange: "same" as const,
            previousRank,
          };
        }
      });
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
