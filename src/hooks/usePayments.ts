import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyPayment } from "@/data/tenants";

export const usePayments = (tenantId: string) => {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching payments:", error);
        return [];
      }

      return data.map((payment: any) => ({
        date: payment.date,
        amount: Number(payment.amount),
        paid: payment.paid,
        paidAmount: payment.paid_amount ? Number(payment.paid_amount) : undefined,
        recordedBy: payment.recorded_by,
        recordedAt: payment.recorded_at,
        modifiedBy: payment.modified_by,
        modifiedAt: payment.modified_at,
        _id: payment.id,
      })) as (DailyPayment & { _id: string })[];
    },
    enabled: !!tenantId,
  });

  const updatePayment = useMutation({
    mutationFn: async ({
      paymentId,
      updates,
    }: {
      paymentId: string;
      updates: Partial<DailyPayment>;
    }) => {
      const { data, error } = await supabase
        .from("daily_payments")
        .update({
          ...(updates.paid !== undefined && { paid: updates.paid }),
          ...(updates.paidAmount !== undefined && { paid_amount: updates.paidAmount }),
          ...(updates.recordedBy && { recorded_by: updates.recordedBy }),
          ...(updates.recordedAt && { recorded_at: updates.recordedAt }),
          ...(updates.modifiedBy && { modified_by: updates.modifiedBy }),
          ...(updates.modifiedAt && { modified_at: updates.modifiedAt }),
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
    },
  });

  return {
    payments,
    isLoading,
    updatePayment: updatePayment.mutateAsync,
  };
};
