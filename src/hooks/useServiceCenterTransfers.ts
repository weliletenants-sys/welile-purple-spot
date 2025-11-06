import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceCenterTransfer {
  id: string;
  tenant_id: string;
  from_service_center: string | null;
  to_service_center: string;
  transferred_by: string;
  transferred_at: string;
  reason: string | null;
  notes: string | null;
}

export const useServiceCenterTransfers = (tenantId?: string) => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["service-center-transfers", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("tenant_service_center_transfers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("transferred_at", { ascending: false });

      if (error) throw error;
      return data as ServiceCenterTransfer[];
    },
    enabled: !!tenantId,
  });

  const transferTenant = useMutation({
    mutationFn: async ({
      tenantId,
      tenantName,
      fromServiceCenter,
      toServiceCenter,
      transferredBy,
      reason,
      notes,
    }: {
      tenantId: string;
      tenantName: string;
      fromServiceCenter: string | null;
      toServiceCenter: string;
      transferredBy: string;
      reason?: string;
      notes?: string;
    }) => {
      // Update tenant's service center
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ service_center: toServiceCenter })
        .eq("id", tenantId);

      if (updateError) throw updateError;

      // Record the transfer in audit trail
      const { error: transferError } = await supabase
        .from("tenant_service_center_transfers")
        .insert({
          tenant_id: tenantId,
          from_service_center: fromServiceCenter,
          to_service_center: toServiceCenter,
          transferred_by: transferredBy,
          reason: reason || null,
          notes: notes || null,
        });

      if (transferError) throw transferError;

      return { tenantName, toServiceCenter };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["service-center-transfers"] });
      toast.success(`${data.tenantName} transferred to ${data.toServiceCenter}`);
    },
    onError: (error) => {
      console.error("Transfer error:", error);
      toast.error("Failed to transfer tenant");
    },
  });

  return {
    transfers,
    isLoading,
    transferTenant: transferTenant.mutateAsync,
    isTransferring: transferTenant.isPending,
  };
};
