import { useState } from "react";
import { useAllTransferHistory } from "@/hooks/useAllTransferHistory";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowRight, Search, Filter, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TenantReassignmentHistory() {
  const { data: transfers = [], isLoading } = useAllTransferHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Get unique agents for filter
  const uniqueAgents = Array.from(
    new Set(
      transfers.flatMap((t) => [
        t.metadata?.from_agent || t.agent_name,
        t.metadata?.to_agent,
      ].filter(Boolean))
    )
  ).sort();

  // Filter transfers
  const filteredTransfers = transfers.filter((transfer) => {
    const tenantName = transfer.metadata?.tenant_name?.toLowerCase() || "";
    const fromAgent = (transfer.metadata?.from_agent || transfer.agent_name).toLowerCase();
    const toAgent = (transfer.metadata?.to_agent || "").toLowerCase();
    const reason = (transfer.metadata?.reason || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || 
      tenantName.includes(searchLower) ||
      fromAgent.includes(searchLower) ||
      toAgent.includes(searchLower) ||
      reason.includes(searchLower);

    const matchesAgent = agentFilter === "all" || 
      fromAgent.includes(agentFilter.toLowerCase()) ||
      toAgent.includes(agentFilter.toLowerCase());

    const transferDate = new Date(transfer.created_at);
    const matchesDateFrom = !dateFrom || transferDate >= dateFrom;
    const matchesDateTo = !dateTo || transferDate <= dateTo;

    return matchesSearch && matchesAgent && matchesDateFrom && matchesDateTo;
  });

  // Group transfers by date
  const groupedTransfers = filteredTransfers.reduce((acc, transfer) => {
    const date = format(new Date(transfer.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(transfer);
    return acc;
  }, {} as Record<string, typeof transfers>);

  const clearFilters = () => {
    setSearchTerm("");
    setAgentFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchTerm || agentFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Reassignment History</h1>
          <p className="text-muted-foreground">Complete audit trail of all tenant transfers between agents</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredTransfers.length} Transfer{filteredTransfers.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenant, agent, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {uniqueAgents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(!dateFrom && "text-muted-foreground")}>
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
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(!dateTo && "text-muted-foreground")}>
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
              />
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredTransfers.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Transfers Found</h3>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters to see more results"
              : "No tenant reassignment history available"}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransfers)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dateTransfers]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  {dateTransfers.map((transfer) => (
                    <Card key={transfer.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary mt-2" />
                          <div className="w-px h-full bg-border mt-2" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {transfer.metadata?.tenant_name || "Unknown Tenant"}
                                </h3>
                                <Badge
                                  variant={transfer.action_type === "tenant_transfer_out" ? "destructive" : "default"}
                                >
                                  {transfer.action_type === "tenant_transfer_out" ? "Transfer Out" : "Transfer In"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transfer.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>

                          {/* Transfer details */}
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {transfer.metadata?.from_agent || transfer.agent_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({transfer.agent_phone})
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {transfer.metadata?.to_agent || "Unknown Agent"}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          {transfer.metadata?.reason && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Reason for Transfer
                              </p>
                              <p className="text-sm bg-muted/30 p-2 rounded border-l-2 border-primary">
                                {transfer.metadata.reason}
                              </p>
                            </div>
                          )}

                          {/* Action description */}
                          {transfer.action_description && (
                            <p className="text-sm text-muted-foreground italic">
                              {transfer.action_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
