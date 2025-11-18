import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAllTransferHistory } from "@/hooks/useAllTransferHistory";
import { Loader2, ArrowRight, Search, CalendarIcon, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransferHistory() {
  const { data: transfers, isLoading } = useAllTransferHistory();
  
  const [tenantSearch, setTenantSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filterTransfers = () => {
    if (!transfers) return [];
    
    // Group by tenant_id to avoid duplicates (we only show transfers out)
    const uniqueTransfers = transfers.filter((t) => t.action_type === "tenant_transfer_out");
    
    return uniqueTransfers.filter((transfer) => {
      const tenantName = transfer.metadata.tenant_name?.toLowerCase() || "";
      const fromAgent = transfer.agent_name.toLowerCase();
      const toAgent = transfer.metadata.to_agent?.toLowerCase() || "";
      const transferDate = new Date(transfer.created_at);

      const matchesTenant = !tenantSearch || tenantName.includes(tenantSearch.toLowerCase());
      const matchesAgent = !agentSearch || 
        fromAgent.includes(agentSearch.toLowerCase()) || 
        toAgent.includes(agentSearch.toLowerCase());
      const matchesDateFrom = !dateFrom || transferDate >= dateFrom;
      const matchesDateTo = !dateTo || transferDate <= dateTo;

      return matchesTenant && matchesAgent && matchesDateFrom && matchesDateTo;
    });
  };

  const filteredTransfers = filterTransfers();
  const hasActiveFilters = tenantSearch || agentSearch || dateFrom || dateTo;

  const clearFilters = () => {
    setTenantSearch("");
    setAgentSearch("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Calculate statistics
  const totalTransfers = transfers?.filter((t) => t.action_type === "tenant_transfer_out").length || 0;
  const agentsInvolved = new Set(
    transfers
      ?.filter((t) => t.action_type === "tenant_transfer_out")
      .flatMap((t) => [t.agent_name, t.metadata.to_agent])
      .filter(Boolean)
  ).size;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Transfer History</h1>
            <p className="text-muted-foreground">Loading tenant movements...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full mb-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <History className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Transfer History</h1>
          <p className="text-muted-foreground">All tenant movements between agents</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{totalTransfers}</span>
              <Badge variant="secondary" className="text-xs">All Time</Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agents Involved</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{agentsInvolved}</span>
              <Badge variant="secondary" className="text-xs">Unique</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter transfers by tenant, agent, or date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant Name</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenant..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Name</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agent..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer List */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Records</CardTitle>
          <CardDescription>
            Showing {filteredTransfers.length} of {totalTransfers} transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No transfers found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>From Agent</TableHead>
                    <TableHead className="text-center">→</TableHead>
                    <TableHead>To Agent</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(transfer.created_at), "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transfer.created_at), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {transfer.metadata.tenant_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transfer.agent_name}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="h-4 w-4 mx-auto text-primary" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transfer.metadata.to_agent || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground">
                          {transfer.metadata.reason || "No reason provided"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
