import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceCenterStats {
  serviceCenterName: string;
  district: string;
  region: string;
  totalPayments: number;
  totalAmount: number;
  averagePaymentAmount: number;
  uniqueTenants: number;
  recordersCount: number;
  recorders: string[];
}

export const useServiceCenterAnalytics = (
  dateFrom?: string,
  dateTo?: string,
  selectedRegion?: string,
  selectedDistrict?: string
) => {
  return useQuery({
    queryKey: ["serviceCenterAnalytics", dateFrom, dateTo, selectedRegion, selectedDistrict],
    queryFn: async () => {
      let query = supabase
        .from("daily_payments")
        .select(`
          service_center,
          paid_amount,
          tenant_id,
          recorded_by,
          recorded_at
        `)
        .eq("paid", true)
        .not("service_center", "is", null);

      if (dateFrom) {
        query = query.gte("recorded_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("recorded_at", dateTo);
      }

      const { data: payments, error } = await query;

      if (error) {
        console.error("Error fetching service center analytics:", error);
        throw error;
      }

      // Fetch service centers info
      const { data: centers, error: centersError } = await supabase
        .from("service_centers")
        .select("name, district, region")
        .eq("is_active", true);

      if (centersError) {
        console.error("Error fetching service centers:", centersError);
        throw centersError;
      }

      // Create a map of service center details
      const centerMap = new Map(
        centers?.map((c) => [c.name, { district: c.district, region: c.region }]) || []
      );

      // Group payments by service center
      const statsMap = new Map<string, ServiceCenterStats>();

      payments?.forEach((payment) => {
        const centerName = payment.service_center || "Unknown";
        const centerInfo = centerMap.get(centerName);

        // Apply region and district filters
        if (selectedRegion && centerInfo?.region !== selectedRegion) return;
        if (selectedDistrict && centerInfo?.district !== selectedDistrict) return;

        if (!statsMap.has(centerName)) {
          statsMap.set(centerName, {
            serviceCenterName: centerName,
            district: centerInfo?.district || "Unknown",
            region: centerInfo?.region || "Unknown",
            totalPayments: 0,
            totalAmount: 0,
            averagePaymentAmount: 0,
            uniqueTenants: 0,
            recordersCount: 0,
            recorders: [],
          });
        }

        const stats = statsMap.get(centerName)!;
        stats.totalPayments++;
        stats.totalAmount += Number(payment.paid_amount || 0);

        // Track unique tenants
        if (payment.tenant_id) {
          const tenantSet = new Set<string>();
          payments
            ?.filter((p) => p.service_center === centerName)
            .forEach((p) => {
              if (p.tenant_id) tenantSet.add(p.tenant_id);
            });
          stats.uniqueTenants = tenantSet.size;
        }

        // Track unique recorders
        if (payment.recorded_by && !stats.recorders.includes(payment.recorded_by)) {
          stats.recorders.push(payment.recorded_by);
          stats.recordersCount = stats.recorders.length;
        }
      });

      // Calculate averages
      const serviceCenterStats = Array.from(statsMap.values()).map((stats) => ({
        ...stats,
        averagePaymentAmount: stats.totalPayments > 0 ? stats.totalAmount / stats.totalPayments : 0,
      }));

      // Sort by total amount descending
      return serviceCenterStats.sort((a, b) => b.totalAmount - a.totalAmount);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useServiceCenters = () => {
  return useQuery({
    queryKey: ["serviceCenters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_centers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

export const useServiceCenterRegions = () => {
  return useQuery({
    queryKey: ["serviceCenterRegions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_centers")
        .select("region")
        .eq("is_active", true);

      if (error) throw error;

      // Get unique regions
      const regions = Array.from(new Set(data?.map((c) => c.region).filter(Boolean)));
      return regions.sort();
    },
  });
};

export const useServiceCenterDistricts = (region?: string) => {
  return useQuery({
    queryKey: ["serviceCenterDistricts", region],
    queryFn: async () => {
      let query = supabase
        .from("service_centers")
        .select("district")
        .eq("is_active", true);

      if (region) {
        query = query.eq("region", region);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get unique districts
      const districts = Array.from(new Set(data?.map((c) => c.district).filter(Boolean)));
      return districts.sort();
    },
    enabled: !region || region.length > 0,
  });
};
