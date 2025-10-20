import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useExecutiveStats = () => {
  const { data: stats, refetch } = useQuery({
    queryKey: ["executiveStats"],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("rent_amount, repayment_days");

      if (tenantsError) throw tenantsError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("amount, paid, paid_amount, date");

      if (paymentsError) throw paymentsError;

      // Calculate statistics
      const numberOfTenants = tenants?.length || 0;
      
      const totalAccessFees = tenants?.reduce((sum, tenant) => {
        return sum + Math.ceil(Number(tenant.rent_amount) * 0.33);
      }, 0) || 0;

      const totalRegistrationFees = numberOfTenants * 5000;

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

      return {
        numberOfTenants,
        totalAccessFees,
        totalRegistrationFees,
        totalRentPaid,
        overduePayments,
        totalExpectedRevenue,
        collectionRate,
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
