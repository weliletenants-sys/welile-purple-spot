import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
        .select("rent_amount, repayment_days, registration_fee, access_fee");

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
      
      const totalAccessFees = tenants?.reduce((sum, tenant) => {
        return sum + Number(tenant.access_fee || 0);
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
        const rentAmount = Number(tenant.rent_amount);
        const registrationFee = 5000;
        const accessFees = Math.ceil(rentAmount * 0.33);
        return sum + rentAmount + registrationFee + accessFees;
      }, 0) || 0;

      const collectionRate = totalExpectedRevenue > 0 
        ? ((totalRentPaid / totalExpectedRevenue) * 100).toFixed(1)
        : "0";

      const outstandingBalance = totalExpectedRevenue - totalRentPaid;

      return {
        numberOfTenants,
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
