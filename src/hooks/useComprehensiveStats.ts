import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { calculateRepaymentDetails } from "@/data/tenants";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

export const useComprehensiveStats = (dateRange?: DateRange) => {
  const { data: stats, refetch } = useQuery({
    queryKey: ["comprehensiveStats", dateRange],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*");

      if (tenantsError) throw tenantsError;

      // Fetch payments
      let paymentsQuery = supabase
        .from("daily_payments")
        .select("*");

      if (dateRange?.startDate) {
        paymentsQuery = paymentsQuery.gte("date", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        paymentsQuery = paymentsQuery.lte("date", dateRange.endDate);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;
      if (paymentsError) throw paymentsError;

      // Fetch agent earnings
      let earningsQuery = supabase
        .from("agent_earnings")
        .select("*");

      if (dateRange?.startDate) {
        earningsQuery = earningsQuery.gte("created_at", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        earningsQuery = earningsQuery.lte("created_at", dateRange.endDate);
      }

      const { data: agentEarnings, error: earningsError } = await earningsQuery;
      if (earningsError) throw earningsError;

      // Fetch service centers
      const { data: serviceCenters, error: centersError } = await supabase
        .from("service_centers")
        .select("*")
        .eq("is_active", true);

      if (centersError) throw centersError;

      // Fetch withdrawal requests
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("withdrawal_requests")
        .select("*");

      if (withdrawalsError) throw withdrawalsError;

      // Basic tenant stats
      const numberOfTenants = tenants?.length || 0;
      const bulkUploadedTenants = tenants?.filter(t => 
        t.source === 'bulk_upload' || t.edited_by === 'Bulk Upload'
      ).length || 0;
      const autoImportedTenants = tenants?.filter(t => t.source === 'auto_import').length || 0;
      const manualTenants = numberOfTenants - bulkUploadedTenants - autoImportedTenants;

      // Status breakdown
      const activeTenants = tenants?.filter(t => t.status === 'Active').length || 0;
      const pipelineTenants = tenants?.filter(t => t.status === 'Pipeline').length || 0;
      const inactiveTenants = tenants?.filter(t => t.status === 'Inactive').length || 0;

      // Financial stats
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

      // Agent stats
      const uniqueAgents = new Set(tenants?.map(t => t.agent_name).filter(Boolean));
      const totalAgents = uniqueAgents.size;
      
      const agentsByPerformance = Array.from(uniqueAgents).map(agentName => {
        const agentTenants = tenants?.filter(t => t.agent_name === agentName) || [];
        const agentPayments = payments?.filter(p => {
          const tenant = tenants?.find(t => t.id === p.tenant_id);
          return tenant?.agent_name === agentName;
        }) || [];
        
        const totalCollected = agentPayments
          .filter(p => p.paid)
          .reduce((sum, p) => sum + Number(p.paid_amount || p.amount), 0);
        
        return {
          name: agentName,
          tenants: agentTenants.length,
          collected: totalCollected
        };
      }).sort((a, b) => b.collected - a.collected);

      const topAgent = agentsByPerformance[0];

      // Agent earnings breakdown
      const totalCommissions = agentEarnings?.filter(e => e.earning_type === 'commission').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalSignupBonuses = agentEarnings?.filter(e => e.earning_type === 'signup_bonus').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalDataEntryRewards = agentEarnings?.filter(e => e.earning_type === 'data_entry').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalRecordingBonuses = agentEarnings?.filter(e => e.earning_type === 'recording_bonus').reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Service center stats
      const totalServiceCenters = serviceCenters?.length || 0;
      const serviceCenterDistribution = serviceCenters?.map(sc => {
        const centerTenants = tenants?.filter(t => t.service_center === sc.name) || [];
        return {
          name: sc.name,
          tenants: centerTenants.length,
          region: sc.region,
          district: sc.district
        };
      }).sort((a, b) => b.tenants - a.tenants);

      const topServiceCenter = serviceCenterDistribution?.[0];

      // Payment recording stats
      const uniqueRecorders = new Set(payments?.map(p => p.recorded_by).filter(Boolean));
      const totalRecorders = uniqueRecorders.size;
      
      const recentRecordings = payments?.filter(p => {
        if (!p.recorded_at) return false;
        const recordedDate = new Date(p.recorded_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return recordedDate >= sevenDaysAgo;
      }).length || 0;

      // Risk indicators
      const tenantsAtRisk = tenants?.filter(t => {
        const tenantPayments = payments?.filter(p => p.tenant_id === t.id) || [];
        const unpaidPayments = tenantPayments.filter(p => !p.paid && p.date < today);
        return unpaidPayments.length >= 3; // 3 or more missed payments
      }).length || 0;

      const defaultRate = numberOfTenants > 0 
        ? ((tenantsAtRisk / numberOfTenants) * 100).toFixed(1)
        : "0";

      // Withdrawal stats
      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;
      const approvedWithdrawals = withdrawals?.filter(w => w.status === 'approved').length || 0;
      const totalWithdrawalRequests = withdrawals?.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      // Pipeline conversion
      const convertedFromPipeline = tenants?.filter(t => t.status === 'Active' && t.edited_at).length || 0;
      const conversionRate = pipelineTenants > 0 
        ? ((convertedFromPipeline / (pipelineTenants + convertedFromPipeline)) * 100).toFixed(1)
        : "0";

      // Average metrics
      const averageRentAmount = numberOfTenants > 0 ? (totalRentAmounts / numberOfTenants) : 0;
      const averagePaymentAmount = payments?.filter(p => p.paid).length > 0
        ? totalRentPaid / payments.filter(p => p.paid).length
        : 0;

      return {
        // Basic stats
        numberOfTenants,
        manualTenants,
        bulkUploadedTenants,
        autoImportedTenants,
        activeTenants,
        pipelineTenants,
        inactiveTenants,
        
        // Financial stats
        totalAccessFees,
        totalRegistrationFees,
        totalRentAmounts,
        totalRentPaid,
        overduePayments,
        totalExpectedRevenue,
        collectionRate,
        outstandingBalance,
        averageRentAmount,
        averagePaymentAmount,
        
        // Agent stats
        totalAgents,
        topAgent,
        totalCommissions,
        totalSignupBonuses,
        totalDataEntryRewards,
        totalRecordingBonuses,
        
        // Service center stats
        totalServiceCenters,
        topServiceCenter,
        serviceCenterDistribution,
        
        // Recording stats
        totalRecorders,
        recentRecordings,
        
        // Risk indicators
        tenantsAtRisk,
        defaultRate,
        
        // Withdrawal stats
        pendingWithdrawals,
        approvedWithdrawals,
        totalWithdrawalRequests,
        
        // Pipeline stats
        conversionRate,
      };
    },
  });

  // Set up realtime subscriptions
  useEffect(() => {
    const tenantsChannel = supabase
      .channel("tenants-changes-comprehensive")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenants" },
        () => refetch()
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("payments-changes-comprehensive")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_payments" },
        () => refetch()
      )
      .subscribe();

    const earningsChannel = supabase
      .channel("earnings-changes-comprehensive")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_earnings" },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(earningsChannel);
    };
  }, [refetch]);

  return stats;
};
