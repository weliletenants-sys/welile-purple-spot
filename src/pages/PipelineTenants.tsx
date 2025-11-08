import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hourglass, ArrowRight, Phone, MapPin, DollarSign, Bell, Home, BarChart3 } from "lucide-react";
import { PipelineConversionWizard } from "@/components/PipelineConversionWizard";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function PipelineTenants() {
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleConvert = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowWizard(true);
  };

  const checkForAlerts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-pipeline-alerts');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Alert Check Complete",
        description: data?.message || "Successfully checked for pipeline alerts",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check for alerts",
        variant: "destructive",
      });
    },
  });

  // Keyboard shortcut: Escape to go home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Hourglass className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Pipeline Tenants</h1>
                <p className="text-muted-foreground">
                  Convert pipeline tenants to active status by collecting complete information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/pipeline-analytics')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                View Analytics
              </Button>
              <Button
                onClick={() => checkForAlerts.mutate()}
                disabled={checkForAlerts.isPending}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Bell className={`h-4 w-4 ${checkForAlerts.isPending ? 'animate-pulse' : ''}`} />
                {checkForAlerts.isPending ? "Checking..." : "Check for Alerts Now"}
              </Button>
            </div>
          </div>
        </div>

        {/* Alert Info */}
        <Card className="p-4 mb-6 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Automated Alert System Active</p>
              <p className="text-xs text-muted-foreground">
                Managers receive notifications daily at 9 AM for pipeline tenants waiting more than 70 days for conversion
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipeline Tenants</p>
              <p className="text-4xl font-bold text-blue-600">{pipelineTenants.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pipelineTenants.filter(t => {
                  const daysWaiting = Math.floor(
                    (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return daysWaiting > 70;
                }).length} waiting over 70 days
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Ready for Conversion
              </Badge>
              <Button
                onClick={() => checkForAlerts.mutate()}
                disabled={checkForAlerts.isPending}
                variant="outline"
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                {checkForAlerts.isPending ? "Checking..." : "Check for Alerts"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tenant List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pipeline tenants...</p>
          </div>
        ) : pipelineTenants.length === 0 ? (
          <Card className="p-12 text-center">
            <Hourglass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pipeline Tenants</h3>
            <p className="text-muted-foreground">
              All tenants have been converted to active status
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pipelineTenants.map((tenant) => {
              const daysWaiting = Math.floor(
                (new Date().getTime() - new Date(tenant.created_at).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysWaiting > 70;

              return (
              <Card key={tenant.id} className={`p-6 hover:shadow-lg transition-shadow ${isOverdue ? 'border-l-4 border-l-destructive' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold">{tenant.name}</h3>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
                        Pipeline - {daysWaiting} days
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="animate-pulse">
                          Overdue Alert
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>UGX {Number(tenant.rent_amount).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Added on {new Date(tenant.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConvert(tenant)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Convert to Active
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversion Wizard */}
      {selectedTenant && (
        <PipelineConversionWizard
          tenant={selectedTenant}
          open={showWizard}
          onOpenChange={setShowWizard}
        />
      )}
    </div>
  );
}
