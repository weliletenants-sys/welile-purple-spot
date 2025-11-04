import { Card } from "@/components/ui/card";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

export const HomeSummaryWidget = () => {
  const stats = useExecutiveStats();

  const collectionRate = parseFloat(stats?.collectionRate || '0');
  const totalTenants = stats?.numberOfTenants || 0;
  const rentPaid = stats?.totalRentPaid || 0;
  const overdue = stats?.overduePayments || 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quick Summary</h3>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tenants</p>
            <p className="text-xl font-bold">{totalTenants}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Collection</p>
            <p className="text-xl font-bold">{collectionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm font-bold">UGX {rentPaid.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-sm font-bold">UGX {overdue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
