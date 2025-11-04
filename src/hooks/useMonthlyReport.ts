import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export const useMonthlyReport = (monthYear: string) => {
  return useQuery({
    queryKey: ["monthlyReport", monthYear],
    queryFn: async (): Promise<MonthlyReport> => {
      const [year, month] = monthYear.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Get total tenants
      const { count: totalTenants } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });

      // Get payments for the month
      const { data: payments } = await supabase
        .from("daily_payments")
        .select("paid_amount, recorded_by")
        .eq("paid", true)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());

      const totalPayments = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

      // Get withdrawal requests
      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("status")
        .gte("requested_at", startDate.toISOString())
        .lte("requested_at", endDate.toISOString());

      const withdrawalRequests = withdrawals?.length || 0;
      const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending").length || 0;

      // Get active agents
      const activeAgentsSet = new Set(payments?.map((p) => p.recorded_by) || []);
      const activeAgents = activeAgentsSet.size;

      // Calculate payment rate (simplified - assuming expected payments = total tenants)
      const expectedPayments = totalTenants || 1;
      const paymentRate = Math.round(((payments?.length || 0) / expectedPayments) * 100);

      // Get agent earnings
      const { data: earnings } = await supabase
        .from("agent_earnings")
        .select("amount")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

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
          earnings: Math.round(stats.totalAmount * 0.05), // 5% commission
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      return {
        totalTenants: totalTenants || 0,
        totalPayments,
        withdrawalRequests,
        pendingWithdrawals,
        activeAgents,
        paymentRate: Math.min(paymentRate, 100),
        totalEarnings,
        topAgents,
      };
    },
  });
};
