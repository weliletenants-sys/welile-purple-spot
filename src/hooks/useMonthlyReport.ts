import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachMonthOfInterval, parseISO } from "date-fns";

interface MonthlyReport {
  totalTenants: number;
  totalPayments: number;
  withdrawalRequests: number;
  pendingWithdrawals: number;
  activeAgents: number;
  paymentRate: number;
  totalEarnings: number;
  topAgents: Array<{
    name: string;
    paymentsRecorded: number;
    totalAmount: number;
    earnings: number;
  }>;
  tenantGrowth: Array<{
    month: string;
    count: number;
  }>;
}

export const useMonthlyReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["monthlyReport", startDate, endDate],
    queryFn: async (): Promise<MonthlyReport> => {
      const start = startDate ? parseISO(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 2));
      const end = endDate ? parseISO(endDate) : new Date();

      // Get total tenants
      const { count: totalTenants } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });

      // Get payments for the date range
      const { data: payments } = await supabase
        .from("daily_payments")
        .select("paid_amount, recorded_by, date")
        .eq("paid", true)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

      const totalPayments = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

      // Get withdrawal requests
      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("status")
        .gte("requested_at", start.toISOString())
        .lte("requested_at", end.toISOString());

      const withdrawalRequests = withdrawals?.length || 0;
      const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending").length || 0;

      // Get active agents
      const activeAgentsSet = new Set(payments?.map((p) => p.recorded_by) || []);
      const activeAgents = activeAgentsSet.size;

      // Calculate payment rate
      const expectedPayments = totalTenants || 1;
      const paymentRate = Math.round(((payments?.length || 0) / expectedPayments) * 100);

      // Get agent earnings
      const { data: earnings } = await supabase
        .from("agent_earnings")
        .select("amount")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const totalEarnings = earnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // Get top agents
      const agentStats = new Map<string, { paymentsRecorded: number; totalAmount: number }>();
      
      payments?.forEach((payment) => {
        const agent = payment.recorded_by;
        if (!agent) return;
        
        const current = agentStats.get(agent) || { paymentsRecorded: 0, totalAmount: 0 };
        agentStats.set(agent, {
          paymentsRecorded: current.paymentsRecorded + 1,
          totalAmount: current.totalAmount + (payment.paid_amount || 0),
        });
      });

      const topAgents = Array.from(agentStats.entries())
        .map(([name, stats]) => ({
          name,
          paymentsRecorded: stats.paymentsRecorded,
          totalAmount: stats.totalAmount,
          earnings: Math.round(stats.totalAmount * 0.05),
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // Get tenant growth data
      const { data: allTenants } = await supabase
        .from("tenants")
        .select("created_at")
        .order("created_at", { ascending: true });

      const months = eachMonthOfInterval({ start, end });
      const tenantGrowth = months.map((month) => {
        const count = allTenants?.filter((t) => 
          new Date(t.created_at) <= month
        ).length || 0;
        
        return {
          month: format(month, "MMM yyyy"),
          count,
        };
      });

      return {
        totalTenants: totalTenants || 0,
        totalPayments,
        withdrawalRequests,
        pendingWithdrawals,
        activeAgents,
        paymentRate: Math.min(paymentRate, 100),
        totalEarnings,
        topAgents,
        tenantGrowth,
      };
    },
  });
};
