import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AgentTransferTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    contact: string;
  };
  currentAgentName: string;
  onTransferComplete: () => void;
}

export function AgentTransferTenantDialog({
  open,
  onOpenChange,
  tenant,
  currentAgentName,
  onTransferComplete,
}: AgentTransferTenantDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { data: agents, isLoading: isLoadingAgents } = useAgents();

  const handleTransfer = () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }
    setShowConfirmation(true);
  };

  const executeTransfer = async () => {
    setIsTransferring(true);
    try {
      const selectedAgent = agents?.find(a => a.id === selectedAgentId);
      if (!selectedAgent) {
        throw new Error("Selected agent not found");
      }

      // Get current agent data
      const { data: currentAgent } = await supabase
        .from('agents')
        .select('id, name, phone')
        .eq('name', currentAgentName)
        .maybeSingle();

      if (!currentAgent) {
        throw new Error("Current agent not found");
      }

      // Update tenant with new agent
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          agent_id: selectedAgent.id,
          agent_name: selectedAgent.name,
          agent_phone: selectedAgent.phone,
          edited_by: currentAgentName,
          edited_at: new Date().toISOString(),
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      // Log status history
      await supabase
        .from('tenant_status_history')
        .insert({
          tenant_id: tenant.id,
          old_status: 'transferred',
          new_status: 'transferred',
          changed_by: currentAgentName,
          reason: `Transferred from ${currentAgentName} to ${selectedAgent.name}`,
          notes: reason || `Tenant transferred to ${selectedAgent.name}`,
        });

      // Log activity for current agent
      await supabase
        .from('agent_activity_log')
        .insert({
          agent_id: currentAgent.id,
          agent_name: currentAgent.name,
          agent_phone: currentAgent.phone,
          action_type: 'tenant_transfer_out',
          action_description: `Transferred tenant ${tenant.name} to ${selectedAgent.name}`,
          metadata: {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            to_agent: selectedAgent.name,
            reason: reason,
          },
        });

      // Log activity for receiving agent
      await supabase
        .from('agent_activity_log')
        .insert({
          agent_id: selectedAgent.id,
          agent_name: selectedAgent.name,
          agent_phone: selectedAgent.phone,
          action_type: 'tenant_transfer_in',
          action_description: `Received tenant ${tenant.name} from ${currentAgentName}`,
          metadata: {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            from_agent: currentAgentName,
            reason: reason,
          },
        });

      toast.success(`Tenant transferred to ${selectedAgent.name} successfully`);
      onTransferComplete();
      onOpenChange(false);
      setSelectedAgentId("");
      setReason("");
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error transferring tenant:', error);
      toast.error("Failed to transfer tenant");
    } finally {
      setIsTransferring(false);
    }
  };

  const selectedAgent = agents?.find(a => a.id === selectedAgentId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Tenant</DialogTitle>
            <DialogDescription>
              Transfer {tenant.name} to another agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{tenant.name}</p>
                <p className="text-sm text-muted-foreground">{tenant.contact}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Transfer to Agent *</Label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isLoadingAgents}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents
                    ?.filter(agent => agent.name !== currentAgentName)
                    .map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} {agent.phone && `(${agent.phone})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you transferring this tenant?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !selectedAgentId}
            >
              {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer <span className="font-semibold">{tenant.name}</span> to{" "}
              <span className="font-semibold">{selectedAgent?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransferring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeTransfer} disabled={isTransferring}>
              {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
