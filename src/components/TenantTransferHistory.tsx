import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useServiceCenterTransfers } from "@/hooks/useServiceCenterTransfers";
import { ArrowRight, Clock, User, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TenantTransferHistoryProps {
  tenantId: string;
}

export const TenantTransferHistory = ({ tenantId }: TenantTransferHistoryProps) => {
  const { transfers, isLoading } = useServiceCenterTransfers(tenantId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Loading transfer records...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>No transfer history available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tenant has not been transferred between service centers yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>
          {transfers.length} transfer{transfers.length !== 1 ? "s" : ""} recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">
                {transfer.from_service_center || "Not assigned"}
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="text-foreground">{transfer.to_service_center}</span>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(transfer.transferred_at), "PPp")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>By {transfer.transferred_by}</span>
              </div>

              {transfer.reason && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 mt-0.5" />
                  <span className="flex-1">{transfer.reason}</span>
                </div>
              )}

              {transfer.notes && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <span className="font-medium">Notes: </span>
                  {transfer.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
