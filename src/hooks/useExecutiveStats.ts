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
        .select("rent_amount, repayment_days, registration_fee, access_fee, source");

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

      // Calculate statistics
      const numberOfTenants = tenants?.length || 0;
      const manualTenants = tenants?.filter(t => t.source === 'manual').length || 0;
      const bulkUploadedTenants = tenants?.filter(t => t.source === 'bulk_upload').length || 0;
      const autoImportedTenants = tenants?.filter(t => t.source === 'auto_import').length || 0;
      
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
