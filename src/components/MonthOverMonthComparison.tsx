import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const MonthOverMonthComparison = () => {
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

  const currentStats = useExecutiveStats({
    startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  });

  const previousStats = useExecutiveStats({
    startDate: format(startOfMonth(previousMonth), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(previousMonth), 'yyyy-MM-dd')
  });

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return { percentage: 0, trend: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const;
    return { percentage: Math.abs(change), trend };
  };

  const tenantsChange = calculateChange(
    currentStats?.numberOfTenants || 0,
    previousStats?.numberOfTenants || 0
  );

  const paymentsChange = calculateChange(
    currentStats?.totalRentPaid || 0,
    previousStats?.totalRentPaid || 0
  );

  const collectionChange = calculateChange(
    parseFloat(currentStats?.collectionRate || '0'),
    parseFloat(previousStats?.collectionRate || '0')
  );

  const renderTrend = (trend: 'up' | 'down' | 'neutral', percentage: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUp className="h-4 w-4" />
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
      );
    }
    if (trend === 'down') {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <ArrowDown className="h-4 w-4" />
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Month-over-Month Comparison</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Tenants</p>
            <p className="text-2xl font-bold">{currentStats?.numberOfTenants || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Previous: {previousStats?.numberOfTenants || 0}
            </p>
          </div>
          {renderTrend(tenantsChange.trend, tenantsChange.percentage)}
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-bold">
              UGX {(currentStats?.totalRentPaid || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Previous: UGX {(previousStats?.totalRentPaid || 0).toLocaleString()}
            </p>
          </div>
          {renderTrend(paymentsChange.trend, paymentsChange.percentage)}
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold">
              {currentStats?.collectionRate || '0'}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Previous: {previousStats?.collectionRate || '0'}%
            </p>
          </div>
          {renderTrend(collectionChange.trend, collectionChange.percentage)}
        </div>
      </div>
    </Card>
  );
};
