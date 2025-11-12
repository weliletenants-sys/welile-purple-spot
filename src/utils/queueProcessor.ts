import { supabase } from "@/integrations/supabase/client";
import type { QueuedAction } from "@/hooks/useOfflineQueue";

export const processQueuedAction = async (action: QueuedAction): Promise<void> => {
  switch (action.type) {
    case "RECORD_PAYMENT":
      await recordPayment(action.data);
      break;
    case "ADD_TENANT":
      await addTenant(action.data);
      break;
    case "UPDATE_TENANT":
      await updateTenant(action.data);
      break;
    case "DELETE_TENANT":
      await deleteTenant(action.data);
      break;
    case "ADD_COMMENT":
      await addComment(action.data);
      break;
    case "DELETE_COMMENT":
      await deleteComment(action.data);
      break;
    case "TRANSFER_TENANT":
      await transferTenant(action.data);
      break;
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
};

const recordPayment = async (data: any) => {
  const { error } = await supabase
    .from("daily_payments")
    .update({
      paid: true,
      paid_amount: data.paid_amount,
      recorded_by: data.recorded_by,
      recorded_at: data.recorded_at,
      payment_mode: data.payment_mode,
      service_center: data.service_center,
    })
    .eq("id", data.payment_id);

  if (error) throw error;
};

const addTenant = async (data: any) => {
  const { error } = await supabase
    .from("tenants")
    .insert(data.tenant);

  if (error) throw error;
};

const updateTenant = async (data: any) => {
  const { error } = await supabase
    .from("tenants")
    .update(data.updates)
    .eq("id", data.tenant_id);

  if (error) throw error;
};

const deleteTenant = async (data: any) => {
  const { error } = await supabase
    .from("tenants")
    .delete()
    .eq("id", data.tenant_id);

  if (error) throw error;
};

const addComment = async (data: any) => {
  const { error } = await supabase
    .from("tenant_comments")
    .insert({
      tenant_id: data.tenant_id,
      comment_text: data.comment_text,
      commenter_name: data.commenter_name,
    });

  if (error) throw error;
};

const deleteComment = async (data: any) => {
  const { error } = await supabase
    .from("tenant_comments")
    .delete()
    .eq("id", data.comment_id);

  if (error) throw error;
};

const transferTenant = async (data: any) => {
  // Update tenant's service center
  const { error: updateError } = await supabase
    .from("tenants")
    .update({ service_center: data.to_service_center })
    .eq("id", data.tenant_id);

  if (updateError) throw updateError;

  // Record the transfer
  const { error: transferError } = await supabase
    .from("tenant_service_center_transfers")
    .insert({
      tenant_id: data.tenant_id,
      from_service_center: data.from_service_center,
      to_service_center: data.to_service_center,
      transferred_by: data.transferred_by,
      reason: data.reason || null,
      notes: data.notes || null,
    });

  if (transferError) throw transferError;
};
