import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog } from "lucide-react";
import { Tenant } from "@/data/tenants";

interface AssignTenantToAgentDialogProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssignTenantToAgentDialog = ({ 
  tenant, 
  open, 
  onOpenChange,
  onSuccess 
}: AssignTenantToAgentDialogProps) => {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Agent Required",
        description: "Please select an agent to assign this tenant to.",
        variant: "destructive",
      });
      return;
    }

    const selectedAgent = agents?.find(a => a.id === selectedAgentId);
    if (!selectedAgent) return;

    setIsAssigning(true);
    
    try {
      // Update tenant with new agent details
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          agent_id: selectedAgent.id,
          agent_name: selectedAgent.name,
          agent_phone: selectedAgent.phone,
          edited_by: "System",
          edited_at: new Date().toISOString(),
        })
        .eq("id", tenant.id);

      if (updateError) throw updateError;

      // Log the assignment activity
      const { error: logError } = await supabase.rpc("log_agent_activity", {
        p_agent_id: selectedAgent.id,
        p_agent_name: selectedAgent.name,
        p_agent_phone: selectedAgent.phone,
        p_action_type: "tenant_assigned",
        p_action_description: `Tenant ${tenant.name} assigned to agent`,
        p_metadata: {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          previous_agent: tenant.agentName,
          notes: notes || null
        }
      });

      if (logError) console.error("Failed to log activity:", logError);

      toast({
        title: "Tenant Assigned",
        description: `${tenant.name} has been assigned to ${selectedAgent.name}`,
      });

      onOpenChange(false);
      setSelectedAgentId("");
      setNotes("");
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning tenant:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tenant to agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const currentAgentName = tenant.agentName || "Unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Assign Tenant to Agent
          </DialogTitle>
          <DialogDescription>
            Assign {tenant.name} to an agent for management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Agent</Label>
            <div className="p-3 bg-muted rounded-md">
              <span className="font-medium">{currentAgentName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-select">Assign To Agent *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent-select">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agentsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : agents && agents.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No agents available
                  </div>
                ) : (
                  agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {agent.phone}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this assignment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedAgentId || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Tenant"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
