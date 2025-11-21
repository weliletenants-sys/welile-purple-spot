import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface AgentWorkload {
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  tenant_count: number;
  total_rent: number;
  active_tenants: number;
  pending_tenants: number;
  avg_performance: number;
}

export const AgentWorkloadOverview = () => {
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ["agent-workload-overview"],
    queryFn: async () => {
      // Fetch all agents with their tenant data
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select("id, name, phone")
        .eq("is_active", true)
        .order("name");

      if (agentsError) throw agentsError;

      // For each agent, fetch their tenant statistics
      const workloadPromises = agents.map(async (agent) => {
        const { data: tenants, error: tenantsError } = await supabase
          .from("tenants")
          .select("id, rent_amount, status, performance")
          .eq("agent_id", agent.id);

        if (tenantsError) throw tenantsError;

        const tenantCount = tenants.length;
        const totalRent = tenants.reduce((sum, t) => sum + Number(t.rent_amount), 0);
        const activeTenants = tenants.filter(t => t.status === "active").length;
        const pendingTenants = tenants.filter(t => t.status === "pending").length;
        const avgPerformance = tenantCount > 0
          ? tenants.reduce((sum, t) => sum + (t.performance || 0), 0) / tenantCount
          : 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_phone: agent.phone || "",
          tenant_count: tenantCount,
          total_rent: totalRent,
          active_tenants: activeTenants,
          pending_tenants: pendingTenants,
          avg_performance: avgPerformance,
        } as AgentWorkload;
      });

      const workload = await Promise.all(workloadPromises);
      
      // Sort by tenant count (highest first)
      return workload.sort((a, b) => b.tenant_count - a.tenant_count);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Workload Overview</CardTitle>
          <CardDescription>Loading agent workload data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAgents = workloadData?.length || 0;
  const totalTenants = workloadData?.reduce((sum, a) => sum + a.tenant_count, 0) || 0;
  const totalRentManaged = workloadData?.reduce((sum, a) => sum + a.total_rent, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Agent Workload Overview
        </CardTitle>
        <CardDescription>
          Tenant count, rent managed, and performance metrics per agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Total Agents
            </div>
            <div className="text-2xl font-bold">{totalAgents}</div>
          </div>
          <div className="p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Total Tenants
            </div>
            <div className="text-2xl font-bold">{totalTenants}</div>
          </div>
          <div className="p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Total Rent Managed
            </div>
            <div className="text-2xl font-bold">
              UGX {totalRentManaged.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Agent Details */}
        <div className="space-y-3">
          {workloadData && workloadData.length > 0 ? (
            workloadData.map((agent) => (
              <div
                key={agent.agent_id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{agent.agent_name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.agent_phone}</p>
                  </div>
                  <Badge
                    variant={agent.tenant_count > 0 ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {agent.tenant_count} Tenant{agent.tenant_count !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Active</div>
                      <div className="font-medium">{agent.active_tenants}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                      <div className="font-medium">{agent.pending_tenants}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Total Rent</div>
                      <div className="font-medium">
                        {(agent.total_rent / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Performance</div>
                      <div className="font-medium">
                        {agent.avg_performance.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance bar */}
                {agent.tenant_count > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Performance</span>
                      <span>{agent.avg_performance.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(agent.avg_performance, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active agents found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
