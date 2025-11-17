import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToHome } from "@/components/BackToHome";
import { PipelineConversionWizard } from "@/components/PipelineConversionWizard";
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const AgentPipelineTenants = () => {
  const { agentPhone } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);

  const decodedPhone = agentPhone ? decodeURIComponent(agentPhone) : "";

  // Fetch agent info
  const { data: agent } = useQuery({
    queryKey: ["agent", decodedPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("phone", decodedPhone)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!decodedPhone,
  });

  // Fetch pipeline tenants for this agent
  const { data: pipelineTenants, isLoading } = useQuery({
    queryKey: ["agent-pipeline-tenants", decodedPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "pipeline")
        .eq("agent_phone", decodedPhone)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!decodedPhone,
  });

  // Fetch pipeline earnings for this agent
  const { data: pipelineEarnings } = useQuery({
    queryKey: ["agent-pipeline-earnings", decodedPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_earnings")
        .select("amount")
        .eq("agent_phone", decodedPhone)
        .eq("earning_type", "pipeline_bonus");

      if (error) throw error;
      
      const total = data.reduce((sum, earning) => sum + Number(earning.amount), 0);
      return total;
    },
    enabled: !!decodedPhone,
  });

  // Filter tenants based on search
  const filteredTenants = pipelineTenants?.filter(tenant => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(search) ||
      tenant.contact.toLowerCase().includes(search) ||
      tenant.address.toLowerCase().includes(search)
    );
  });

  const handleConvert = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowWizard(true);
  };

  const getStatusBadge = (tenant: any) => {
    const daysInPipeline = Math.floor(
      (new Date().getTime() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysInPipeline > 70) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Long Wait</Badge>;
    } else if (daysInPipeline > 30) {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Waiting</Badge>;
    } else {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Recent</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background pb-20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/agent/${decodedPhone}`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Pipeline Tenants
            </h1>
            {agent && (
              <p className="text-sm text-muted-foreground">
                {agent.name} • {agent.phone}
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : pipelineTenants?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Bonuses</p>
                <p className="text-2xl font-bold text-foreground">
                  UGX {pipelineEarnings?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bonus per Tenant</p>
                <p className="text-2xl font-bold text-foreground">UGX 50</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Tenants List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-40 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredTenants && filteredTenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTenants.map((tenant) => {
              const daysInPipeline = Math.floor(
                (new Date().getTime() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={tenant.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Added {formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {getStatusBadge(tenant)}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{tenant.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Landlord: {tenant.landlord}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <DollarSign className="h-4 w-4" />
                        <span>Rent: UGX {Number(tenant.rent_amount).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Service Center & District */}
                    <div className="flex gap-2">
                      {tenant.service_center && (
                        <Badge variant="outline">{tenant.service_center}</Badge>
                      )}
                      {tenant.location_district && (
                        <Badge variant="secondary">{tenant.location_district}</Badge>
                      )}
                    </div>

                    {/* Time in Pipeline */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {daysInPipeline} {daysInPipeline === 1 ? 'day' : 'days'} in pipeline
                        </span>
                        <Button
                          onClick={() => handleConvert(tenant)}
                          size="sm"
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Convert to Active
                        </Button>
                      </div>
                    </div>

                    {/* Bonus Info */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                        ✓ Earned UGX 50 pipeline bonus for this tenant
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">No Pipeline Tenants</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? "No tenants match your search." : "Start adding pipeline tenants to see them here."}
                </p>
              </div>
            </div>
          </Card>
        )}
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
};

export default AgentPipelineTenants;
