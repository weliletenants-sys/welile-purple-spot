import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantStatusHistory } from "@/hooks/useTenantStatusHistory";
import { Clock, ArrowRight, User, FileText } from "lucide-react";
import { format } from "date-fns";

interface TenantStatusHistoryProps {
  tenantId: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "under_review":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "pending":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
};

const formatStatusLabel = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function TenantStatusHistory({ tenantId }: TenantStatusHistoryProps) {
  const { data: history, isLoading } = useTenantStatusHistory(tenantId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status Change History
        </CardTitle>
        <CardDescription>
          Complete timeline of all status changes for this tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background"></div>

                  <div className="space-y-2">
                    {/* Status change */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.old_status ? (
                        <>
                          <Badge className={getStatusColor(entry.old_status)}>
                            {formatStatusLabel(entry.old_status)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Initial status:</span>
                      )}
                      <Badge className={getStatusColor(entry.new_status)}>
                        {formatStatusLabel(entry.new_status)}
                      </Badge>
                    </div>

                    {/* Timestamp and changed by */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(entry.changed_at), "MMM dd, yyyy HH:mm")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{entry.changed_by}</span>
                      </div>
                    </div>

                    {/* Reason */}
                    {entry.reason && (
                      <div className="bg-muted/50 rounded-md p-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">Reason:</p>
                            <p className="text-muted-foreground">
                              {entry.reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <div className="bg-muted/50 rounded-md p-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">Notes:</p>
                            <p className="text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No status changes recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
