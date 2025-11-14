import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAgentTransferHistory } from "@/hooks/useAgentTransferHistory";
import { Loader2, ArrowRight, ArrowLeft, Search, CalendarIcon, X, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentTransferHistoryProps {
  agentName: string;
}

export function AgentTransferHistory({ agentName }: AgentTransferHistoryProps) {
  const { data: transfers, isLoading } = useAgentTransferHistory(agentName);
  
  const [tenantSearch, setTenantSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filterTransfers = (transfersList: typeof transfers) => {
    if (!transfersList) return [];
    
    return transfersList.filter((transfer) => {
      const tenantName = transfer.metadata.tenant_name?.toLowerCase() || "";
      const otherAgent = (transfer.action_type === "tenant_transfer_out" 
        ? transfer.metadata.to_agent 
        : transfer.metadata.from_agent)?.toLowerCase() || "";
      const transferDate = new Date(transfer.created_at);

      const matchesTenant = !tenantSearch || tenantName.includes(tenantSearch.toLowerCase());
      const matchesAgent = !agentSearch || otherAgent.includes(agentSearch.toLowerCase());
      const matchesDateFrom = !dateFrom || transferDate >= dateFrom;
      const matchesDateTo = !dateTo || transferDate <= dateTo;

      return matchesTenant && matchesAgent && matchesDateFrom && matchesDateTo;
    });
  };

  const transfersOut = filterTransfers(transfers?.filter((t) => t.action_type === "tenant_transfer_out"));
  const transfersIn = filterTransfers(transfers?.filter((t) => t.action_type === "tenant_transfer_in"));

  const hasActiveFilters = tenantSearch || agentSearch || dateFrom || dateTo;

  const clearFilters = () => {
    setTenantSearch("");
    setAgentSearch("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Calculate statistics
  const totalTransfersOut = transfers?.filter((t) => t.action_type === "tenant_transfer_out").length || 0;
  const totalTransfersIn = transfers?.filter((t) => t.action_type === "tenant_transfer_in").length || 0;
  
  const getMostFrequentReason = () => {
    if (!transfers || transfers.length === 0) return "N/A";
    
    const reasonCounts: Record<string, number> = {};
    transfers.forEach((transfer) => {
      const reason = transfer.metadata.reason || "No reason provided";
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    return mostFrequent ? mostFrequent[0] : "N/A";
  };

  const mostFrequentReason = getMostFrequentReason();

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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ArrowRight className="h-4 w-4 text-orange-600" />
                Transferred Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{totalTransfersOut}</p>
              <p className="text-xs text-muted-foreground mt-1">Total tenants transferred</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4 text-green-600" />
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{totalTransfersIn}</p>
              <p className="text-xs text-muted-foreground mt-1">Total tenants received</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 text-blue-600" />
                Most Frequent Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-blue-600 line-clamp-2" title={mostFrequentReason}>
                {mostFrequentReason}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Common transfer reason</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenant..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agent..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 lg:px-3"
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {transfersOut.length + transfersIn.length} result(s)
              </span>
            </div>
          )}
        </div>

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
                {hasActiveFilters ? "No transfers match your filters" : "No transfers out yet"}
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
                {hasActiveFilters ? "No transfers match your filters" : "No transfers received yet"}
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
