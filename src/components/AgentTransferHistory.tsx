import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAgentTransferHistory } from "@/hooks/useAgentTransferHistory";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface AgentTransferHistoryProps {
  agentName: string;
}

export function AgentTransferHistory({ agentName }: AgentTransferHistoryProps) {
  const { data: transfers, isLoading } = useAgentTransferHistory(agentName);

  const transfersOut = transfers?.filter((t) => t.action_type === "tenant_transfer_out") || [];
  const transfersIn = transfers?.filter((t) => t.action_type === "tenant_transfer_in") || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>View all tenant transfers you've made or received</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="out" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="out" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Transferred Out ({transfersOut.length})
            </TabsTrigger>
            <TabsTrigger value="in" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Received ({transfersIn.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="out" className="mt-4">
            {transfersOut.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfers out yet
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Transferred To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfersOut.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.metadata.tenant_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transfer.metadata.to_agent || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transfer.metadata.reason || "No reason provided"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transfer.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="in" className="mt-4">
            {transfersIn.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfers received yet
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Received From</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfersIn.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.metadata.tenant_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transfer.metadata.from_agent || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transfer.metadata.reason || "No reason provided"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transfer.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
