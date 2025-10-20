import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, TrendingUp, Calendar, DollarSign, Trash2, Wallet, UserCheck } from "lucide-react";
import { Tenant, calculateRepaymentDetails } from "@/data/tenants";
import { useNavigate } from "react-router-dom";
import { EditTenantForm } from "./EditTenantForm";
import { useTenants } from "@/hooks/useTenants";
import { useToast } from "@/hooks/use-toast";
import { ContactButtons } from "./ContactButtons";
import { usePayments } from "@/hooks/usePayments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TenantCardProps {
  tenant: Tenant;
}

export const TenantCard = ({ tenant }: TenantCardProps) => {
  const navigate = useNavigate();
  const { deleteTenant } = useTenants();
  const { toast } = useToast();
  const repaymentDetails = calculateRepaymentDetails(tenant.rentAmount, tenant.repaymentDays);
  const { payments } = usePayments(tenant.id);

  // Calculate balance for this tenant
  const totalPaid = payments?.filter(p => p.paid).reduce((sum, p) => sum + (p.paidAmount || p.amount), 0) || 0;
  const totalExpected = tenant.rentAmount + (tenant.registrationFee || 0) + (tenant.accessFee || 0);
  const balance = totalExpected - totalPaid;

  const handleDelete = async () => {
    try {
      await deleteTenant(tenant.id);
      toast({
        title: "Success",
        description: "Tenant deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'review': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-accent/10 text-accent border-accent/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 75) return 'text-primary';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <Card 
      className="group p-6 hover:shadow-[var(--shadow-purple)] transition-all duration-300 border-border bg-gradient-to-br from-card to-secondary/20 hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/tenant/${tenant.id}`)}
    >
      <div className="space-y-4">
        {/* Header with Name, Performance and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-lg shrink-0">
              {tenant.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                {tenant.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{tenant.contact}</span>
                <ContactButtons phoneNumber={tenant.contact} iconOnly />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`flex items-center gap-1 font-bold text-xl ${getPerformanceColor(tenant.performance)}`}>
              <TrendingUp className="w-5 h-5" />
              {tenant.performance}%
            </div>
            <div className="flex items-center gap-1">
              <EditTenantForm tenant={tenant} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {tenant.name}'s record and all associated payment data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={getStatusColor(tenant.status)}>
            {tenant.status}
          </Badge>
          <Badge variant="outline" className={getPaymentColor(tenant.paymentStatus)}>
            {tenant.paymentStatus}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">{tenant.address}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <User className="w-4 h-4 text-accent mt-0.5" />
            <div className="flex-1">
              <p className="text-foreground font-medium">{tenant.landlord}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-xs">{tenant.landlordContact}</p>
                <ContactButtons phoneNumber={tenant.landlordContact} iconOnly />
              </div>
            </div>
          </div>
          {tenant.agentName && (
            <div className="flex items-start gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Agent</p>
                <p className="text-foreground font-medium">{tenant.agentName}</p>
                {tenant.agentPhone && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground text-xs">{tenant.agentPhone}</p>
                    <ContactButtons phoneNumber={tenant.agentPhone} iconOnly />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Outstanding Balance - Prominent */}
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
                <p className="text-2xl font-bold text-foreground">UGX {balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Repayment Info */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Schedule:</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {tenant.repaymentDays} days
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Daily:</span>
            </div>
            <span className="font-bold text-foreground">UGX {repaymentDetails.dailyInstallment.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Expected:</span>
            <span className="font-bold text-primary">UGX {repaymentDetails.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-bold text-green-600 dark:text-green-400">UGX {totalPaid.toLocaleString()}</span>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="pt-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tenant.performance >= 90 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : tenant.performance >= 75 
                  ? 'bg-gradient-to-r from-primary to-accent'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
              style={{ width: `${tenant.performance}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
