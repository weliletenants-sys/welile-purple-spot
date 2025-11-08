import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Hourglass, PauseCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TenantStatusBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TenantStatusBreakdownDialog = ({ open, onOpenChange }: TenantStatusBreakdownDialogProps) => {
  const { data: breakdown } = useQuery({
    queryKey: ["tenantStatusBreakdown"],
    queryFn: async () => {
      // Fetch all tenants with their payments
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, status");

      if (tenantsError) throw tenantsError;

      // Fetch all payments to determine dormant status
      const { data: payments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("tenant_id, date, paid");

      if (paymentsError) throw paymentsError;

      const today = new Date();
      const dormantThreshold = new Date();
      dormantThreshold.setDate(dormantThreshold.getDate() - 40);

      // Calculate dormant tenants (overdue > 40 days)
      const tenantLastPaymentMap = new Map<string, Date>();
      payments.forEach((payment: any) => {
        if (payment.paid) {
          const paymentDate = new Date(payment.date);
          const current = tenantLastPaymentMap.get(payment.tenant_id);
          if (!current || paymentDate > current) {
            tenantLastPaymentMap.set(payment.tenant_id, paymentDate);
          }
        }
      });

      const pipelineTenants = tenants?.filter(t => t.status === "pipeline") || [];
      let activeTenants = 0;
      let dormantTenants = 0;

      tenants?.forEach(tenant => {
        if (tenant.status === "pipeline") return;

        const lastPayment = tenantLastPaymentMap.get(tenant.id);
        const overduePayments = payments.filter((p: any) => 
          p.tenant_id === tenant.id && 
          !p.paid && 
          new Date(p.date) < today
        );

        // Check if overdue for more than 40 days
        const oldestOverdue = overduePayments.reduce((oldest: Date | null, p: any) => {
          const date = new Date(p.date);
          return !oldest || date < oldest ? date : oldest;
        }, null);

        const isDormant = oldestOverdue && oldestOverdue < dormantThreshold;

        if (isDormant) {
          dormantTenants++;
        } else {
          activeTenants++;
        }
      });

      return {
        total: tenants?.length || 0,
        pipeline: pipelineTenants.length,
        active: activeTenants,
        dormant: dormantTenants,
      };
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Tenant Status Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Tenants</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">{breakdown?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">All tenants in system</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Active Tenants</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{breakdown?.active || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {breakdown?.total ? ((breakdown.active / breakdown.total) * 100).toFixed(1) : 0}% of total
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Pipeline Tenants</h3>
              <Hourglass className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{breakdown?.pipeline || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {breakdown?.total ? ((breakdown.pipeline / breakdown.total) * 100).toFixed(1) : 0}% of total
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Dormant Tenants</h3>
              <PauseCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">{breakdown?.dormant || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {breakdown?.total ? ((breakdown.dormant / breakdown.total) * 100).toFixed(1) : 0}% - Overdue 40+ days
            </p>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Status Definitions:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• <span className="font-medium text-green-600">Active:</span> Tenants with regular payments or overdue less than 40 days</li>
            <li>• <span className="font-medium text-blue-600">Pipeline:</span> Tenants in onboarding with minimal details collected</li>
            <li>• <span className="font-medium text-destructive">Dormant:</span> Tenants overdue for 40+ days (reactivate on any payment)</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
