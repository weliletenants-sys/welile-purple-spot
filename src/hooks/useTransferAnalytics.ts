import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface TransferTrend {
  month: string;
  count: number;
}

export interface ReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

export interface MigrationPattern {
  from: string;
  to: string;
  count: number;
}

export interface TransferAnalytics {
  totalTransfers: number;
  thisMonthTransfers: number;
  lastMonthTransfers: number;
  trends: TransferTrend[];
  topReasons: ReasonStats[];
  migrationPatterns: MigrationPattern[];
  topTransferredTenants: Array<{
    tenantId: string;
    tenantName: string;
    transferCount: number;
  }>;
  mostActiveRecorders: Array<{
    recorder: string;
    count: number;
  }>;
}

export const useTransferAnalytics = (monthsBack: number = 6) => {
  return useQuery({
    queryKey: ["transfer-analytics", monthsBack],
    queryFn: async (): Promise<TransferAnalytics> => {
      // Fetch all transfers
      const { data: transfers, error } = await supabase
        .from("tenant_service_center_transfers")
        .select("*, tenants(name)")
        .order("transferred_at", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const startDate = subMonths(now, monthsBack);

      // Filter transfers within date range
      const recentTransfers = transfers?.filter(
        (t) => new Date(t.transferred_at) >= startDate
      ) || [];

      // Calculate total transfers
      const totalTransfers = recentTransfers.length;

      // This month transfers
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const thisMonthTransfers = recentTransfers.filter((t) => {
        const date = new Date(t.transferred_at);
        return date >= thisMonthStart && date <= thisMonthEnd;
      }).length;

      // Last month transfers
      const lastMonth = subMonths(now, 1);
      const lastMonthStart = startOfMonth(lastMonth);
      const lastMonthEnd = endOfMonth(lastMonth);
      const lastMonthTransfers = recentTransfers.filter((t) => {
        const date = new Date(t.transferred_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).length;

      // Calculate trends by month
      const trendsMap = new Map<string, number>();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const month = subMonths(now, i);
        const monthKey = format(month, "MMM yyyy");
        trendsMap.set(monthKey, 0);
      }

      recentTransfers.forEach((transfer) => {
        const monthKey = format(new Date(transfer.transferred_at), "MMM yyyy");
        if (trendsMap.has(monthKey)) {
          trendsMap.set(monthKey, (trendsMap.get(monthKey) || 0) + 1);
        }
      });

      const trends: TransferTrend[] = Array.from(trendsMap.entries()).map(
        ([month, count]) => ({ month, count })
      );

      // Calculate top reasons
      const reasonsMap = new Map<string, number>();
      recentTransfers.forEach((transfer) => {
        const reason = transfer.reason || "Not specified";
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      const topReasons: ReasonStats[] = Array.from(reasonsMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: (count / totalTransfers) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate migration patterns
      const patternsMap = new Map<string, number>();
      recentTransfers.forEach((transfer) => {
        const from = transfer.from_service_center || "Not assigned";
        const to = transfer.to_service_center;
        const key = `${from}→${to}`;
        patternsMap.set(key, (patternsMap.get(key) || 0) + 1);
      });

      const migrationPatterns: MigrationPattern[] = Array.from(
        patternsMap.entries()
      )
        .map(([key, count]) => {
          const [from, to] = key.split("→");
          return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Calculate top transferred tenants
      const tenantTransfersMap = new Map<string, { name: string; count: number }>();
      recentTransfers.forEach((transfer) => {
        const tenantId = transfer.tenant_id;
        const tenantName = (transfer.tenants as any)?.name || "Unknown";
        const current = tenantTransfersMap.get(tenantId);
        if (current) {
          current.count++;
        } else {
          tenantTransfersMap.set(tenantId, { name: tenantName, count: 1 });
        }
      });

      const topTransferredTenants = Array.from(tenantTransfersMap.entries())
        .map(([tenantId, { name, count }]) => ({
          tenantId,
          tenantName: name,
          transferCount: count,
        }))
        .filter((t) => t.transferCount > 1)
        .sort((a, b) => b.transferCount - a.transferCount)
        .slice(0, 10);

      // Calculate most active recorders
      const recordersMap = new Map<string, number>();
      recentTransfers.forEach((transfer) => {
        const recorder = transfer.transferred_by;
        recordersMap.set(recorder, (recordersMap.get(recorder) || 0) + 1);
      });

      const mostActiveRecorders = Array.from(recordersMap.entries())
        .map(([recorder, count]) => ({ recorder, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalTransfers,
        thisMonthTransfers,
        lastMonthTransfers,
        trends,
        topReasons,
        migrationPatterns,
        topTransferredTenants,
        mostActiveRecorders,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
