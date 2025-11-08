import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { calculateRepaymentDetails } from "@/data/tenants";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

export const useExecutiveStats = (dateRange?: DateRange) => {
  const { data: stats, refetch } = useQuery({
    queryKey: ["executiveStats", dateRange],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("rent_amount, repayment_days, registration_fee, access_fee, source, edited_by");

      if (tenantsError) throw tenantsError;

      // Fetch all payments with date filtering
      let paymentsQuery = supabase
        .from("daily_payments")
        .select("amount, paid, paid_amount, date");

      if (dateRange?.startDate) {
        paymentsQuery = paymentsQuery.gte("date", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        paymentsQuery = paymentsQuery.lte("date", dateRange.endDate);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      // Fetch data entry earnings
      let earningsQuery = supabase
        .from("agent_earnings")
        .select("amount, earning_type, created_at")
        .eq("earning_type", "data_entry");

      if (dateRange?.startDate) {
        earningsQuery = earningsQuery.gte("created_at", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        earningsQuery = earningsQuery.lte("created_at", dateRange.endDate);
      }

      const { data: dataEntryEarnings, error: earningsError } = await earningsQuery;

      if (earningsError) throw earningsError;

      // Calculate statistics
      const numberOfTenants = tenants?.length || 0;
      // Count bulk uploads from both source field and edited_by field (for legacy uploads)
      const bulkUploadedTenants = tenants?.filter(t => 
        t.source === 'bulk_upload' || t.edited_by === 'Bulk Upload'
      ).length || 0;
      const autoImportedTenants = tenants?.filter(t => t.source === 'auto_import').length || 0;
      const manualTenants = numberOfTenants - bulkUploadedTenants - autoImportedTenants;
      
      // Calculate total access fees using the same formula as tenant cards
      const totalAccessFees = tenants?.reduce((sum, tenant) => {
        const repaymentDetails = calculateRepaymentDetails(
          Number(tenant.rent_amount),
          tenant.repayment_days
        );
        return sum + repaymentDetails.accessFees;
      }, 0) || 0;

      const totalRegistrationFees = tenants?.reduce((sum, tenant) => {
        return sum + Number(tenant.registration_fee || 0);
      }, 0) || 0;

      const totalRentAmounts = tenants?.reduce((sum, tenant) => {
        return sum + Number(tenant.rent_amount || 0);
      }, 0) || 0;

      const totalRentPaid = payments
        ?.filter(p => p.paid)
        .reduce((sum, p) => sum + Number(p.paid_amount || p.amount), 0) || 0;

      const today = new Date().toISOString().split("T")[0];
      const overduePayments = payments
        ?.filter(p => !p.paid && p.date < today)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const totalExpectedRevenue = tenants?.reduce((sum, tenant) => {
        const repaymentDetails = calculateRepaymentDetails(
          Number(tenant.rent_amount),
          tenant.repayment_days
        );
        return sum + repaymentDetails.totalAmount;
      }, 0) || 0;

      const collectionRate = totalExpectedRevenue > 0 
        ? ((totalRentPaid / totalExpectedRevenue) * 100).toFixed(1)
        : "0";

      const outstandingBalance = totalExpectedRevenue - totalRentPaid;

      // Calculate data entry stats
      const totalDataEntryRewards = dataEntryEarnings?.reduce((sum, earning) => {
        return sum + Number(earning.amount);
      }, 0) || 0;
      const totalDataEntryActivities = dataEntryEarnings?.length || 0;

      // Fetch pipeline bonus earnings
      let pipelineBonusQuery = supabase
        .from("agent_earnings")
        .select("amount")
        .eq("earning_type", "pipeline_bonus");

      if (dateRange?.startDate) {
        pipelineBonusQuery = pipelineBonusQuery.gte("created_at", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        pipelineBonusQuery = pipelineBonusQuery.lte("created_at", dateRange.endDate);
      }

      const { data: pipelineBonusEarnings, error: pipelineError } = await pipelineBonusQuery;

      if (pipelineError) throw pipelineError;

      const totalPipelineBonuses = pipelineBonusEarnings?.reduce((sum, earning) => {
        return sum + Number(earning.amount);
      }, 0) || 0;
      const totalPipelineActivities = pipelineBonusEarnings?.length || 0;

      return {
        numberOfTenants,
        manualTenants,
        bulkUploadedTenants,
        autoImportedTenants,
        totalAccessFees,
        totalRegistrationFees,
        totalRentAmounts,
        totalRentPaid,
        overduePayments,
        totalExpectedRevenue,
        collectionRate,
        outstandingBalance,
        totalDataEntryRewards,
        totalDataEntryActivities,
        totalPipelineBonuses,
        totalPipelineActivities,
      };
    },
  });

  // Set up realtime subscriptions for instant updates
  useEffect(() => {
    const tenantsChannel = supabase
      .channel("tenants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_payments",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [refetch]);

  return stats;
};
