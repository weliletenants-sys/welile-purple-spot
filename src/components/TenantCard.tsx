import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, Phone, MapPin, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Tenant, calculateRepaymentDetails } from "@/data/tenants";
import { useNavigate } from "react-router-dom";

interface TenantCardProps {
  tenant: Tenant;
}

export const TenantCard = ({ tenant }: TenantCardProps) => {
  const navigate = useNavigate();
  const repaymentDetails = calculateRepaymentDetails(tenant.rentAmount, tenant.repaymentDays);
  
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
        {/* Header with Name and Performance */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-lg">
              {tenant.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {tenant.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{tenant.contact}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-1 font-bold text-xl ${getPerformanceColor(tenant.performance)}`}>
              <TrendingUp className="w-5 h-5" />
              {tenant.performance}%
            </div>
            <span className="text-xs text-muted-foreground">Performance</span>
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
            <div>
              <p className="text-foreground font-medium">{tenant.landlord}</p>
              <p className="text-muted-foreground text-xs">{tenant.landlordContact}</p>
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
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-primary">UGX {repaymentDetails.totalAmount.toLocaleString()}</span>
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
