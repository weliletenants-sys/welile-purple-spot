import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Clock, 
  Search,
  ArrowRight,
  Phone,
  MapPin,
  DollarSign,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { PipelineConversionWizard } from "@/components/PipelineConversionWizard";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function PipelineDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [serviceCenterFilter, setServiceCenterFilter] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();

  // Fetch pipeline tenants
  const { data: pipelineTenants = [], isLoading } = useQuery({
    queryKey: ["pipelineTenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "pipeline")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch agents for filter
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const totalPipeline = pipelineTenants.length;
  const uniqueAgents = new Set(pipelineTenants.map((t: any) => t.agent_name)).size;
  const avgDaysInPipeline = pipelineTenants.length > 0
    ? Math.round(
        pipelineTenants.reduce((sum: number, t: any) => {
          const days = Math.floor(
            (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / pipelineTenants.length
      )
    : 0;

  // Filter tenants
  const filteredTenants = pipelineTenants.filter((tenant: any) => {
    const matchesSearch =
      !searchTerm ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact?.includes(searchTerm) ||
      tenant.agent_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = agentFilter === "all" || tenant.agent_name === agentFilter;
    const matchesServiceCenter =
      serviceCenterFilter === "all" || tenant.service_center === serviceCenterFilter;

    return matchesSearch && matchesAgent && matchesServiceCenter;
  });

  const handleConvert = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowWizard(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToHome />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Target className="h-8 w-8 text-primary" />
                Pipeline Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and convert pipeline tenants
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPipeline}</div>
              <p className="text-xs text-muted-foreground">Active prospects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueAgents}</div>
              <p className="text-xs text-muted-foreground">Contributing agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Days in Pipeline</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDaysInPipeline}</div>
              <p className="text-xs text-muted-foreground">Average duration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  pipelineTenants.filter((t: any) => {
                    const created = new Date(t.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created >= weekAgo;
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">New this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent: any) => (
                    <SelectItem key={agent.name} value={agent.name}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by service center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Centers</SelectItem>
                  {Array.from(new Set(pipelineTenants.map((t: any) => t.service_center)))
                    .filter(Boolean)
                    .map((center: any) => (
                      <SelectItem key={center} value={center}>
                        {center}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setAgentFilter("all");
                  setServiceCenterFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Tenants List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Pipeline Tenants ({filteredTenants.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/add-pipeline-tenant")}
                >
                  Add New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading pipeline tenants...
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pipeline tenants found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTenants.map((tenant: any) => {
                  const daysInPipeline = Math.floor(
                    (new Date().getTime() - new Date(tenant.created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{tenant.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysInPipeline} days
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{tenant.contact || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{tenant.address || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>UGX {tenant.rent_amount?.toLocaleString() || "0"}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>Agent: {tenant.agent_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Added: {format(new Date(tenant.created_at), "MMM d, yyyy")}</span>
                              </div>
                              {tenant.service_center && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{tenant.service_center}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleConvert(tenant)}
                            className="ml-4"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Convert
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Wizard */}
      <PipelineConversionWizard
        tenant={selectedTenant}
        open={showWizard}
        onOpenChange={(open) => {
          setShowWizard(open);
          if (!open) setSelectedTenant(null);
        }}
      />
    </div>
  );
}
