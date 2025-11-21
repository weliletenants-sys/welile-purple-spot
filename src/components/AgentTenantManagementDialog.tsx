import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserCog, UserX, Users, Search, Filter, X } from "lucide-react";
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
  const [selectedAssignedTenants, setSelectedAssignedTenants] = useState<string[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceCenterFilter, setServiceCenterFilter] = useState<string>("all");
  const [minRent, setMinRent] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch service centers
  const { data: serviceCenters } = useQuery({
    queryKey: ["service-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_centers")
        .select("name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch agent's tenants
  const { data: agentTenants, refetch: refetchAgentTenants } = useQuery({
    queryKey: ["agent-tenants", agent?.id],
    queryFn: async () => {
      if (!agent) return [];
      
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, contact, address, rent_amount, status, service_center")
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
        .select("id, name, contact, address, rent_amount, status, service_center, agent_name")
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

  const handleBulkUnassign = async () => {
    if (!agent || selectedAssignedTenants.length === 0) return;
    
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
        .in("id", selectedAssignedTenants);

      if (error) throw error;

      // Log the activity
      await supabase.rpc("log_agent_activity", {
        p_agent_id: agent.id,
        p_agent_name: agent.name,
        p_agent_phone: agent.phone,
        p_action_type: "bulk_tenant_unassigned",
        p_action_description: `${selectedAssignedTenants.length} tenants unassigned by admin`,
        p_metadata: { tenant_ids: selectedAssignedTenants, count: selectedAssignedTenants.length }
      });

      toast({
        title: "Tenants Unassigned",
        description: `${selectedAssignedTenants.length} tenants have been unassigned from ${agent.name}`,
      });

      setSelectedAssignedTenants([]);
      refetchAgentTenants();
      refetchUnassigned();
      onSuccess?.();
    } catch (error) {
      console.error("Error unassigning tenants:", error);
      toast({
        title: "Unassignment Failed",
        description: "Failed to unassign tenants. Please try again.",
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

  const toggleAssignedTenantSelection = (tenantId: string) => {
    setSelectedAssignedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const toggleSelectAllAssigned = () => {
    if (selectedAssignedTenants.length === filteredAgentTenants.length) {
      setSelectedAssignedTenants([]);
    } else {
      setSelectedAssignedTenants(filteredAgentTenants.map(t => t.id));
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setServiceCenterFilter("all");
    setMinRent("");
    setMaxRent("");
    setSearchTerm("");
  };

  const hasActiveFilters = statusFilter !== "all" || serviceCenterFilter !== "all" || minRent || maxRent || searchTerm;

  const applyFilters = (tenants: any[]) => {
    return tenants.filter(tenant => {
      // Search filter
      const matchesSearch = 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.contact.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
      
      // Service center filter
      const matchesServiceCenter = 
        serviceCenterFilter === "all" || 
        tenant.service_center === serviceCenterFilter;
      
      // Rent amount filter
      const rentAmount = Number(tenant.rent_amount);
      const matchesMinRent = !minRent || rentAmount >= Number(minRent);
      const matchesMaxRent = !maxRent || rentAmount <= Number(maxRent);
      
      return matchesSearch && matchesStatus && matchesServiceCenter && matchesMinRent && matchesMaxRent;
    });
  };

  const filteredAgentTenants = applyFilters(agentTenants || []);
  const filteredUnassignedTenants = applyFilters(unassignedTenants || []);

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

        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-center-filter" className="text-xs">Service Center</Label>
                <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
                  <SelectTrigger id="service-center-filter" className="h-9">
                    <SelectValue placeholder="All Centers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Centers</SelectItem>
                    {serviceCenters?.map((center) => (
                      <SelectItem key={center.name} value={center.name}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-rent" className="text-xs">Min Rent (UGX)</Label>
                <Input
                  id="min-rent"
                  type="number"
                  placeholder="0"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-rent" className="text-xs">Max Rent (UGX)</Label>
                <Input
                  id="max-rent"
                  type="number"
                  placeholder="No limit"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
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
              <>
                <div className="flex items-center justify-between mb-4 p-3 border rounded-lg bg-accent/20">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAssignedTenants.length === filteredAgentTenants.length && filteredAgentTenants.length > 0}
                      onCheckedChange={toggleSelectAllAssigned}
                      id="select-all-assigned"
                    />
                    <label htmlFor="select-all-assigned" className="text-sm font-medium cursor-pointer">
                      Select All ({selectedAssignedTenants.length}/{filteredAgentTenants.length})
                    </label>
                  </div>
                  {selectedAssignedTenants.length > 0 && (
                    <Button
                      onClick={handleBulkUnassign}
                      disabled={isUpdating}
                      size="sm"
                      variant="destructive"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4 mr-2" />
                      )}
                      Unassign {selectedAssignedTenants.length} Selected
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {filteredAgentTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={selectedAssignedTenants.includes(tenant.id)}
                        onCheckedChange={() => toggleAssignedTenantSelection(tenant.id)}
                        id={`assigned-tenant-${tenant.id}`}
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
                          {tenant.service_center && (
                            <Badge variant="outline" className="text-xs">
                              {tenant.service_center}
                            </Badge>
                          )}
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
              </>
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
                          {tenant.service_center && (
                            <Badge variant="outline" className="text-xs">
                              {tenant.service_center}
                            </Badge>
                          )}
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
