import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AgentPipelineTenantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentPhone: string;
  agentName: string;
}

export function AgentPipelineTenantsDialog({ 
  open, 
  onOpenChange, 
  agentPhone, 
  agentName 
}: AgentPipelineTenantsDialogProps) {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['pipeline-tenants-list', agentPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('agent_phone', agentPhone)
        .eq('status', 'pipeline')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pipeline Tenants - {agentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : tenants && tenants.length > 0 ? (
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div 
                key={tenant.id} 
                className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{tenant.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {tenant.contact}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {tenant.address}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {format(new Date(tenant.created_at), 'MMM dd, yyyy')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rent:</span>{' '}
                    <span className="font-medium">UGX {tenant.rent_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Landlord:</span>{' '}
                    <span className="font-medium">{tenant.landlord}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No pipeline tenants found for this agent.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
