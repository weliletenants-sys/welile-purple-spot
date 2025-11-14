import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyPayment } from "@/data/tenants";
import { useEffect } from "react";

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
        serviceCenter: payment.service_center,
        paymentMode: payment.payment_mode,
        paymentType: payment.payment_type || 'actual',
        _id: payment.id,
      })) as (DailyPayment & { _id: string })[];
    },
    enabled: !!tenantId,
  });

  // Subscribe to realtime changes for daily_payments
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('daily-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_payments',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
          queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);

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
          ...(updates.serviceCenter && { service_center: updates.serviceCenter }),
          ...(updates.paymentMode && { payment_mode: updates.paymentMode }),
          ...(updates.paymentType && { payment_type: updates.paymentType }),
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      // Only create commissions for actual payments, not adjustments
      const isActualPayment = updates.paymentType !== 'adjustment';
      
      // If payment is marked as paid and is actual payment, create agent commission (5% of paid amount)
      if (updates.paid === true && updates.paidAmount && isActualPayment) {
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("agent_name, agent_phone, status")
          .eq("id", tenantId)
          .single();

        if (!tenantError && tenant) {
          // Reactivate dormant tenants when they make any payment
          // Check if tenant is currently dormant (overdue > 40 days)
          const today = new Date();
          const dormantThreshold = new Date();
          dormantThreshold.setDate(dormantThreshold.getDate() - 40);

          const { data: overduePayments } = await supabase
            .from("daily_payments")
            .select("date")
            .eq("tenant_id", tenantId)
            .eq("paid", false)
            .lt("date", today.toISOString().split("T")[0]);

          const oldestOverdue = overduePayments?.reduce((oldest: Date | null, p: any) => {
            const date = new Date(p.date);
            return !oldest || date < oldest ? date : oldest;
          }, null);

          const isDormant = oldestOverdue && oldestOverdue < dormantThreshold;

          // If dormant and status is not already active, reactivate
          if (isDormant && tenant.status !== "active") {
            await supabase
              .from("tenants")
              .update({ status: "active" })
              .eq("id", tenantId);
          }

          // Create agent commission if tenant is not in pipeline
          if (tenant.status !== "pipeline" && tenant.agent_name && tenant.agent_phone) {
            const commission = Math.round(updates.paidAmount * 0.05); // 5% commission
            
            const { error: earningsError } = await supabase
              .from("agent_earnings")
              .insert({
                agent_phone: tenant.agent_phone,
                agent_name: tenant.agent_name,
                tenant_id: tenantId,
                payment_id: paymentId,
                amount: commission,
                earning_type: "commission",
              });

            if (earningsError) {
              console.error("Error creating agent commission:", earningsError);
            }
          }
        }

        // Create 0.5% recording bonus for the person who recorded the payment
        if (updates.recordedBy) {
          const recordingBonus = Math.round(updates.paidAmount * 0.005); // 0.5% recording bonus
          
          const { error: recordingError } = await supabase
            .from("agent_earnings")
            .insert({
              agent_phone: updates.recordedBy, // Using recordedBy as identifier
              agent_name: updates.recordedBy,
              tenant_id: tenantId,
              payment_id: paymentId,
              amount: recordingBonus,
              earning_type: "recording_bonus",
            });

          if (recordingError) {
            console.error("Error creating recording bonus:", recordingError);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
    },
  });

  return {
    payments,
    isLoading,
    updatePayment: updatePayment.mutateAsync,
  };
};
