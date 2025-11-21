import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserCog, UserX, Users, Search } from "lucide-react";
import { Agent } from "@/hooks/useAgents";

interface AgentTenantManagementDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AgentTenantManagementDialog = ({ 
  agent, 
  open, 
  onOpenChange,
  onSuccess 
}: AgentTenantManagementDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  // Fetch agent's tenants
  const { data: agentTenants, refetch: refetchAgentTenants } = useQuery({
    queryKey: ["agent-tenants", agent?.id],
    queryFn: async () => {
      if (!agent) return [];
      
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, contact, address, rent_amount, status")
        .eq("agent_id", agent.id)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!agent && open,
  });

  // Fetch unassigned tenants
  const { data: unassignedTenants, refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, contact, address, rent_amount, status, agent_name")
        .or("agent_id.is.null,agent_name.eq.")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleAssignTenant = async (tenantId: string, tenantName: string) => {
    if (!agent) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          agent_id: agent.id,
          agent_name: agent.name,
          agent_phone: agent.phone,
          edited_by: "Admin",
          edited_at: new Date().toISOString(),
        })
        .eq("id", tenantId);

      if (error) throw error;

      // Log the activity
      await supabase.rpc("log_agent_activity", {
        p_agent_id: agent.id,
        p_agent_name: agent.name,
        p_agent_phone: agent.phone,
        p_action_type: "tenant_assigned",
        p_action_description: `Tenant ${tenantName} assigned by admin`,
        p_metadata: { tenant_id: tenantId, tenant_name: tenantName }
      });

      toast({
        title: "Tenant Assigned",
        description: `${tenantName} has been assigned to ${agent.name}`,
      });

      refetchAgentTenants();
      refetchUnassigned();
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning tenant:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnassignTenant = async (tenantId: string, tenantName: string) => {
    if (!agent) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          agent_id: null,
          agent_name: "",
          agent_phone: "",
          edited_by: "Admin",
          edited_at: new Date().toISOString(),
        })
        .eq("id", tenantId);

      if (error) throw error;

      // Log the activity
      await supabase.rpc("log_agent_activity", {
        p_agent_id: agent.id,
        p_agent_name: agent.name,
        p_agent_phone: agent.phone,
        p_action_type: "tenant_unassigned",
        p_action_description: `Tenant ${tenantName} unassigned by admin`,
        p_metadata: { tenant_id: tenantId, tenant_name: tenantName }
      });

      toast({
        title: "Tenant Unassigned",
        description: `${tenantName} has been unassigned from ${agent.name}`,
      });

      refetchAgentTenants();
      refetchUnassigned();
      onSuccess?.();
    } catch (error) {
      console.error("Error unassigning tenant:", error);
      toast({
        title: "Unassignment Failed",
        description: "Failed to unassign tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!agent || selectedTenants.length === 0) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          agent_id: agent.id,
          agent_name: agent.name,
          agent_phone: agent.phone,
          edited_by: "Admin",
          edited_at: new Date().toISOString(),
        })
        .in("id", selectedTenants);

      if (error) throw error;

      // Log the activity
      await supabase.rpc("log_agent_activity", {
        p_agent_id: agent.id,
        p_agent_name: agent.name,
        p_agent_phone: agent.phone,
        p_action_type: "bulk_tenant_assigned",
        p_action_description: `${selectedTenants.length} tenants assigned by admin`,
        p_metadata: { tenant_ids: selectedTenants, count: selectedTenants.length }
      });

      toast({
        title: "Tenants Assigned",
        description: `${selectedTenants.length} tenants have been assigned to ${agent.name}`,
      });

      setSelectedTenants([]);
      refetchAgentTenants();
      refetchUnassigned();
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning tenants:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tenants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTenants.length === filteredUnassignedTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredUnassignedTenants.map(t => t.id));
    }
  };

  const filteredAgentTenants = agentTenants?.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredUnassignedTenants = unassignedTenants?.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Tenants for {agent.name}
          </DialogTitle>
          <DialogDescription>
            Assign or unassign tenants for this agent
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="assigned" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">
              Assigned Tenants ({agentTenants?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unassigned">
              Unassigned Tenants ({unassignedTenants?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="flex-1 overflow-auto mt-4">
            {filteredAgentTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No tenants found matching your search" : "No tenants assigned to this agent"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAgentTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.contact}</div>
                      <div className="text-xs text-muted-foreground">{tenant.address}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          UGX {tenant.rent_amount.toLocaleString()}
                        </Badge>
                        <Badge variant={tenant.status === "active" ? "default" : "outline"} className="text-xs">
                          {tenant.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignTenant(tenant.id, tenant.name)}
                      disabled={isUpdating}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Unassign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unassigned" className="flex-1 overflow-auto mt-4">
            {filteredUnassignedTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No tenants found matching your search" : "No unassigned tenants available"}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 p-3 border rounded-lg bg-accent/20">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTenants.length === filteredUnassignedTenants.length && filteredUnassignedTenants.length > 0}
                      onCheckedChange={toggleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All ({selectedTenants.length}/{filteredUnassignedTenants.length})
                    </label>
                  </div>
                  {selectedTenants.length > 0 && (
                    <Button
                      onClick={handleBulkAssign}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserCog className="h-4 w-4 mr-2" />
                      )}
                      Assign {selectedTenants.length} Selected
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {filteredUnassignedTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={selectedTenants.includes(tenant.id)}
                        onCheckedChange={() => toggleTenantSelection(tenant.id)}
                        id={`tenant-${tenant.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.contact}</div>
                        <div className="text-xs text-muted-foreground">{tenant.address}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            UGX {tenant.rent_amount.toLocaleString()}
                          </Badge>
                          <Badge variant={tenant.status === "active" ? "default" : "outline"} className="text-xs">
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignTenant(tenant.id, tenant.name)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserCog className="h-4 w-4 mr-2" />
                        )}
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
