import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { calculateRepaymentDetails } from "@/data/tenants";

export interface AgentEarning {
  agentName: string;
  agentPhone: string;
  earnedCommission: number;
  expectedCommission: number;
  withdrawnCommission: number;
  earningsCount: number;
  tenantsCount: number;
  totalOutstandingBalance: number;
  expectedCollectionDaily: number;
  expectedCollectionWeekly: number;
  expectedCollectionMonthly: number;
  expectedCollectionTwoMonths: number;
  expectedCollectionThreeMonths: number;
}

export const useAgentEarnings = (period?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agentEarnings", period],
    queryFn: async () => {
      // Get all tenants grouped by agent
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, agent_name, agent_phone, rent_amount, repayment_days");

      if (tenantsError) {
        console.error("Error fetching tenants:", tenantsError);
        throw tenantsError;
      }

      // Get all daily payments to calculate outstanding balances
      const { data: payments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("tenant_id, paid, amount, paid_amount");

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        throw paymentsError;
      }

      // Get earnings filtered by period
      let earningsQuery = supabase
        .from("agent_earnings")
        .select("*");

      if (period && period !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case "daily":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "weekly":
            startDate.setDate(now.getDate() - 7);
            break;
          case "monthly":
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        earningsQuery = earningsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: earnings, error: earningsError } = await earningsQuery;

      if (earningsError) {
        console.error("Error fetching agent earnings:", earningsError);
        throw earningsError;
      }

      // Create a map of tenant payments
      const tenantPaymentsMap = new Map<string, { outstanding: number; totalDue: number }>();
      payments?.forEach((payment: any) => {
        if (!tenantPaymentsMap.has(payment.tenant_id)) {
          tenantPaymentsMap.set(payment.tenant_id, { outstanding: 0, totalDue: 0 });
        }
        const tenantPayment = tenantPaymentsMap.get(payment.tenant_id)!;
        tenantPayment.totalDue += Number(payment.amount);
        if (!payment.paid) {
          tenantPayment.outstanding += Number(payment.amount);
        } else if (payment.paid_amount) {
          tenantPayment.outstanding += Math.max(0, Number(payment.amount) - Number(payment.paid_amount));
        }
      });

      // Group by agent name (to remove duplicates by name)
      const agentMap = new Map<string, AgentEarning>();
      
      // Calculate expected commission from tenants (5% of total repayment including fees)
      tenants?.forEach((tenant: any) => {
        if (!tenant.agent_name) return;
        
        const key = tenant.agent_name.trim().toUpperCase();
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: tenant.agent_name,
            agentPhone: tenant.agent_phone || "",
            earnedCommission: 0,
            expectedCommission: 0,
            withdrawnCommission: 0,
            earningsCount: 0,
            tenantsCount: 0,
            totalOutstandingBalance: 0,
            expectedCollectionDaily: 0,
            expectedCollectionWeekly: 0,
            expectedCollectionMonthly: 0,
            expectedCollectionTwoMonths: 0,
            expectedCollectionThreeMonths: 0,
          });
        }
        const agent = agentMap.get(key)!;
        
        // Calculate total repayment including registration fee and compound interest access fees
        const repaymentDetails = calculateRepaymentDetails(
          Number(tenant.rent_amount),
          tenant.repayment_days
        );
        agent.expectedCommission += repaymentDetails.totalAmount * 0.05; // 5% of total
        agent.tenantsCount += 1;

        // Add outstanding balance for this tenant
        const tenantPayment = tenantPaymentsMap.get(tenant.id);
        if (tenantPayment) {
          agent.totalOutstandingBalance += tenantPayment.outstanding;
        }

        // Calculate expected collections based on repayment schedule
        const dailyInstallment = repaymentDetails.dailyInstallment;
        agent.expectedCollectionDaily += dailyInstallment;
        agent.expectedCollectionWeekly += dailyInstallment * 7;
        agent.expectedCollectionMonthly += dailyInstallment * 30;
        agent.expectedCollectionTwoMonths += dailyInstallment * 60;
        agent.expectedCollectionThreeMonths += dailyInstallment * 90;

        // Use the first non-empty phone number found
        if (tenant.agent_phone && !agent.agentPhone) {
          agent.agentPhone = tenant.agent_phone;
        }
      });

      // Add earned and withdrawn commissions
      earnings?.forEach((earning: any) => {
        if (!earning.agent_name) return;
        
        const key = earning.agent_name.trim().toUpperCase();
        if (!agentMap.has(key)) {
          agentMap.set(key, {
            agentName: earning.agent_name,
            agentPhone: earning.agent_phone || "",
            earnedCommission: 0,
            expectedCommission: 0,
            withdrawnCommission: 0,
            earningsCount: 0,
            tenantsCount: 0,
            totalOutstandingBalance: 0,
            expectedCollectionDaily: 0,
            expectedCollectionWeekly: 0,
            expectedCollectionMonthly: 0,
            expectedCollectionTwoMonths: 0,
            expectedCollectionThreeMonths: 0,
          });
        }
        
        const agent = agentMap.get(key)!;
        // Use the first non-empty phone number found
        if (earning.agent_phone && !agent.agentPhone) {
          agent.agentPhone = earning.agent_phone;
        }
        
        if (earning.earning_type === "commission") {
          agent.earnedCommission += Number(earning.amount);
          agent.earningsCount += 1;
        } else if (earning.earning_type === "withdrawal") {
          agent.withdrawnCommission += Number(earning.amount);
        }
      });

      return Array.from(agentMap.values()).sort((a, b) => b.earnedCommission - a.earnedCommission);
    },
  });

  // Subscribe to realtime changes for agent_earnings, tenants, and daily_payments
  useEffect(() => {
    const earningsChannel = supabase
      .channel('agent-earnings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_earnings'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
        }
      )
      .subscribe();

    const tenantsChannel = supabase
      .channel('agent-tenants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('agent-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_payments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agentEarnings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [queryClient]);

  return query;
};
