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

      if (error) throw error;

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
        })
        .select()
        .single();

      if (error) throw error;

      // Create daily payments
      const dailyPayments = [];
      const today = new Date();
      const registrationFee = 5000;
      const accessFees = Math.ceil(tenant.rentAmount * 0.33);
      const totalAmount = tenant.rentAmount + registrationFee + accessFees;
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
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
          ...(updates.repaymentDays && { repayment_days: updates.repaymentDays }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  return {
    tenants,
    isLoading,
    addTenant: addTenant.mutateAsync,
    updateTenant: updateTenant.mutateAsync,
  };
};
