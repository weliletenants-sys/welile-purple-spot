import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/data/tenants";

export const useTenants = () => {
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tenants:", error);
        return [];
      }

      return data.map((tenant: any) => ({
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
      })) as Tenant[];
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
    tenants,
    isLoading,
    addTenant: addTenant.mutateAsync,
    updateTenant: updateTenant.mutateAsync,
    deleteTenant: deleteTenant.mutateAsync,
  };
};
