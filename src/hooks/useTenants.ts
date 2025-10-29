import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/data/tenants";
import { useEffect } from "react";

interface UseTenantsPaginationOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  locationFilter?: string;
  feeFilter?: string;
  agentFilter?: string;
}

export const useTenants = (options?: UseTenantsPaginationOptions) => {
  const queryClient = useQueryClient();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const searchTerm = options?.searchTerm ?? "";
  const locationFilter = options?.locationFilter ?? "all";
  const feeFilter = options?.feeFilter ?? "all";
  const agentFilter = options?.agentFilter ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["tenants", page, pageSize, searchTerm, locationFilter, feeFilter, agentFilter],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get latest payment dates for all tenants
      const { data: paymentData } = await supabase
        .from("daily_payments")
        .select("tenant_id, updated_at")
        .eq("paid", true)
        .order("updated_at", { ascending: false });

      // Create a map of tenant_id to latest payment date
      const latestPayments = new Map<string, string>();
      paymentData?.forEach(payment => {
        if (!latestPayments.has(payment.tenant_id)) {
          latestPayments.set(payment.tenant_id, payment.updated_at);
        }
      });

      let query = supabase
        .from("tenants")
        .select("*", { count: "exact" })
        .range(from, to);

      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,landlord.ilike.%${searchTerm}%,landlord_contact.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%,payment_status.ilike.%${searchTerm}%,agent_name.ilike.%${searchTerm}%,agent_phone.ilike.%${searchTerm}%,guarantor1_name.ilike.%${searchTerm}%,guarantor1_contact.ilike.%${searchTerm}%,guarantor2_name.ilike.%${searchTerm}%,guarantor2_contact.ilike.%${searchTerm}%,location_country.ilike.%${searchTerm}%,location_county.ilike.%${searchTerm}%,location_district.ilike.%${searchTerm}%,location_subcounty_or_ward.ilike.%${searchTerm}%,location_cell_or_village.ilike.%${searchTerm}%`
        );
      }

      // Apply location filter if provided
      if (locationFilter && locationFilter !== "all") {
        query = query.eq("address", locationFilter);
      }

      // Apply fee filter if provided
      if (feeFilter === "registration") {
        query = query.gt("registration_fee", 0);
      }

      // Apply agent filter if provided
      if (agentFilter && agentFilter !== "all") {
        query = query.eq("agent_name", agentFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching tenants:", error);
        return { tenants: [], totalCount: 0 };
      }

      const tenants = data.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        contact: tenant.contact,
        address: tenant.address,
        status: tenant.status,
        paymentStatus: tenant.payment_status,
        performance: tenant.performance,
        landlord: tenant.landlord,
        landlordContact: tenant.landlord_contact,
        rentAmount: Number(tenant.rent_amount),
        registrationFee: Number(tenant.registration_fee || 0),
        accessFee: Number(tenant.access_fee || 0),
        repaymentDays: tenant.repayment_days,
        dailyPayments: [],
        guarantor1: tenant.guarantor1_name
          ? {
              name: tenant.guarantor1_name,
              contact: tenant.guarantor1_contact,
            }
          : undefined,
        guarantor2: tenant.guarantor2_name
          ? {
              name: tenant.guarantor2_name,
              contact: tenant.guarantor2_contact,
            }
          : undefined,
        location: {
          country: tenant.location_country || "",
          county: tenant.location_county || "",
          district: tenant.location_district || "",
          subcountyOrWard: tenant.location_subcounty_or_ward || "",
          cellOrVillage: tenant.location_cell_or_village || "",
        },
        agentName: tenant.agent_name || "",
        agentPhone: tenant.agent_phone || "",
        editedBy: tenant.edited_by,
        editedAt: tenant.edited_at,
        lastPaymentDate: latestPayments.get(tenant.id) || null,
      })) as Tenant[];

      // Sort by latest payment date (most recent first), then by created_at
      tenants.sort((a: any, b: any) => {
        if (a.lastPaymentDate && b.lastPaymentDate) {
          return new Date(b.lastPaymentDate).getTime() - new Date(a.lastPaymentDate).getTime();
        }
        if (a.lastPaymentDate) return -1;
        if (b.lastPaymentDate) return 1;
        return new Date(b.editedAt || b.id).getTime() - new Date(a.editedAt || a.id).getTime();
      });

      return { tenants, totalCount: count || 0 };
    },
  });

  // Subscribe to realtime changes for tenants
  useEffect(() => {
    const channel = supabase
      .channel('tenants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants'
        },
        () => {
          // Invalidate all tenant queries when any change occurs
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Separate query for unique locations (without pagination)
  const { data: locationsData = [] } = useQuery({
    queryKey: ["tenant-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("address")
        .order("address");

      if (error) {
        console.error("Error fetching locations:", error);
        return [];
      }

      const uniqueLocations = Array.from(new Set(data.map(t => t.address)));
      return uniqueLocations.sort();
    },
  });

  const addTenant = useMutation({
    mutationFn: async (tenant: Omit<Tenant, "id" | "dailyPayments">) => {
      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: tenant.name,
          contact: tenant.contact,
          address: tenant.address,
          status: tenant.status,
          payment_status: tenant.paymentStatus,
          performance: tenant.performance,
          source: "manual",
          landlord: tenant.landlord,
          landlord_contact: tenant.landlordContact,
          rent_amount: tenant.rentAmount,
          registration_fee: tenant.registrationFee,
          access_fee: tenant.accessFee,
          repayment_days: tenant.repaymentDays,
          guarantor1_name: tenant.guarantor1?.name,
          guarantor1_contact: tenant.guarantor1?.contact,
          guarantor2_name: tenant.guarantor2?.name,
          guarantor2_contact: tenant.guarantor2?.contact,
          location_country: tenant.location?.country,
          location_county: tenant.location?.county,
          location_district: tenant.location?.district,
          location_subcounty_or_ward: tenant.location?.subcountyOrWard,
          location_cell_or_village: tenant.location?.cellOrVillage,
          agent_name: tenant.agentName,
          agent_phone: tenant.agentPhone,
        })
        .select()
        .single();

      if (error) throw error;

      // Create daily payments
      const dailyPayments = [];
      const today = new Date();
      const totalAmount = tenant.rentAmount + tenant.registrationFee + tenant.accessFee;
      const dailyInstallment = Math.ceil(totalAmount / tenant.repaymentDays);

      for (let i = 0; i < tenant.repaymentDays; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dailyPayments.push({
          tenant_id: data.id,
          date: date.toISOString().split("T")[0],
          amount: dailyInstallment,
          paid: false,
        });
      }

      const { error: paymentsError } = await supabase
        .from("daily_payments")
        .insert(dailyPayments);

      if (paymentsError) throw paymentsError;

      // Create agent signup bonus earning (UGX 5000)
      if (tenant.agentName && tenant.agentPhone) {
        const { error: earningsError } = await supabase
          .from("agent_earnings")
          .insert({
            agent_phone: tenant.agentPhone,
            agent_name: tenant.agentName,
            tenant_id: data.id,
            amount: 5000,
            earning_type: "signup_bonus",
          });

        if (earningsError) throw earningsError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    },
  });

  const updateTenant = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Tenant>;
    }) => {
      const { data, error } = await supabase
        .from("tenants")
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.contact && { contact: updates.contact }),
          ...(updates.address && { address: updates.address }),
          ...(updates.status && { status: updates.status }),
          ...(updates.paymentStatus && { payment_status: updates.paymentStatus }),
          ...(updates.performance !== undefined && { performance: updates.performance }),
          ...(updates.landlord && { landlord: updates.landlord }),
          ...(updates.landlordContact && { landlord_contact: updates.landlordContact }),
          ...(updates.rentAmount !== undefined && { rent_amount: updates.rentAmount }),
          ...(updates.registrationFee !== undefined && { registration_fee: updates.registrationFee }),
          ...(updates.accessFee !== undefined && { access_fee: updates.accessFee }),
          ...(updates.repaymentDays && { repayment_days: updates.repaymentDays }),
          ...(updates.guarantor1 && {
            guarantor1_name: updates.guarantor1.name,
            guarantor1_contact: updates.guarantor1.contact,
          }),
          ...(updates.guarantor2 && {
            guarantor2_name: updates.guarantor2.name,
            guarantor2_contact: updates.guarantor2.contact,
          }),
          ...(updates.location && {
            location_country: updates.location.country,
            location_county: updates.location.county,
            location_district: updates.location.district,
            location_subcounty_or_ward: updates.location.subcountyOrWard,
            location_cell_or_village: updates.location.cellOrVillage,
          }),
          ...(updates.agentName && { agent_name: updates.agentName }),
          ...(updates.agentPhone && { agent_phone: updates.agentPhone }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      // Delete associated daily payments
      const { error: paymentsError } = await supabase
        .from("daily_payments")
        .delete()
        .eq("tenant_id", id);

      if (paymentsError) throw paymentsError;

      // Delete associated agent earnings
      const { error: earningsError } = await supabase
        .from("agent_earnings")
        .delete()
        .eq("tenant_id", id);

      if (earningsError) throw earningsError;

      // Delete tenant
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    },
  });

  return {
    tenants: data?.tenants || [],
    totalCount: data?.totalCount || 0,
    locations: locationsData,
    isLoading,
    addTenant: addTenant.mutateAsync,
    updateTenant: updateTenant.mutateAsync,
    deleteTenant: deleteTenant.mutateAsync,
  };
};
