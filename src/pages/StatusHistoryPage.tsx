import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackToHome } from "@/components/BackToHome";
import { WelileLogo } from "@/components/WelileLogo";
import { useAllStatusHistory } from "@/hooks/useTenantStatusHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Search,
  User,
  ArrowRight,
  FileText,
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  Eye,
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";

const StatusHistoryPage = () => {
  const navigate = useNavigate();
  const { data: history, isLoading, refetch } = useAllStatusHistory();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChangedBy, setFilterChangedBy] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<"changed_at" | "tenant_name" | null>("changed_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('status-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tenant_status_history'
        },
        (payload) => {
          console.log('New status change:', payload);
          refetch();
          toast({
            title: "Status Change Recorded",
            description: "The history has been updated",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  // Get unique values for filters
  const uniqueStatuses = Array.from(
    new Set(
      history?.flatMap(h => [h.old_status, h.new_status]).filter(Boolean)
    )
  ) as string[];

  const uniqueChangedBy = Array.from(
    new Set(history?.map(h => h.changed_by).filter(Boolean))
  ) as string[];

  const filteredHistory = history?.filter((entry) => {
    const tenantName = (entry.tenants as any)?.name || "";
    const tenantContact = (entry.tenants as any)?.contact || "";
    
    const matchesSearch = 
      tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantContact.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === "all" || 
      entry.old_status === filterStatus || 
      entry.new_status === filterStatus;
    
    const matchesChangedBy = 
      filterChangedBy === "all" || 
      entry.changed_by === filterChangedBy;
    
    let matchesDateRange = true;
    const changeDate = new Date(entry.changed_at);
    if (dateFrom && isBefore(changeDate, startOfDay(dateFrom))) {
      matchesDateRange = false;
    }
    if (dateTo && isAfter(changeDate, endOfDay(dateTo))) {
      matchesDateRange = false;
    }
    
    return matchesSearch && matchesStatus && matchesChangedBy && matchesDateRange;
  });

  const sortedHistory = filteredHistory?.slice().sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    if (sortColumn === "changed_at") {
      aValue = new Date(a.changed_at).getTime();
      bValue = new Date(b.changed_at).getTime();
    } else if (sortColumn === "tenant_name") {
      aValue = ((a.tenants as any)?.name || "").toLowerCase();
      bValue = ((b.tenants as any)?.name || "").toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalItems = sortedHistory?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedHistory = sortedHistory?.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSort = (column: "changed_at" | "tenant_name") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "changed_at" | "tenant_name") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterChangedBy("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    filterStatus !== "all" || 
    filterChangedBy !== "all" || 
    dateFrom || 
    dateTo || 
    searchTerm;

  const exportToExcel = () => {
    if (!sortedHistory || sortedHistory.length === 0) {
      toast({
        title: "No Data",
        description: "No status history to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = sortedHistory.map(entry => ({
      "Tenant Name": (entry.tenants as any)?.name || "Unknown",
      "Contact": (entry.tenants as any)?.contact || "N/A",
      "Old Status": entry.old_status || "Initial",
      "New Status": entry.new_status,
      "Changed By": entry.changed_by,
      "Changed At": format(new Date(entry.changed_at), "MMM dd, yyyy HH:mm"),
      "Reason": entry.reason || "N/A",
      "Notes": entry.notes || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Status History");
    XLSX.writeFile(wb, `status-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Exported ${sortedHistory.length} status change(s) to Excel`,
    });
  };

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
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "N/A";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackToHome />

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WelileLogo />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <History className="h-10 w-10 text-primary" />
            Status Change History
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete audit trail of all tenant status changes
          </p>
        </div>

        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Status Changes</p>
                <p className="text-4xl font-bold text-primary">
                  {history?.length || 0}
                </p>
                {totalItems > 0 && totalItems !== history?.length && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalItems} filtered result(s)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={!sortedHistory || sortedHistory.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Narrow down your results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Tenant</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Changed By</label>
                <Select value={filterChangedBy} onValueChange={setFilterChangedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueChangedBy.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom && dateTo
                        ? `${format(dateFrom, "MMM dd")} - ${format(dateTo, "MMM dd")}`
                        : "Select dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">From</label>
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">To</label>
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status Change Records</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : paginatedHistory && paginatedHistory.length > 0 ? (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("tenant_name")}
                            className="flex items-center"
                          >
                            Tenant
                            {getSortIcon("tenant_name")}
                          </Button>
                        </TableHead>
                        <TableHead>Status Change</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("changed_at")}
                            className="flex items-center"
                          >
                            Changed At
                            {getSortIcon("changed_at")}
                          </Button>
                        </TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {(entry.tenants as any)?.name || "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(entry.tenants as any)?.contact || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entry.old_status ? (
                                <>
                                  <Badge className={getStatusColor(entry.old_status)}>
                                    {formatStatusLabel(entry.old_status)}
                                  </Badge>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">Initial:</span>
                              )}
                              <Badge className={getStatusColor(entry.new_status)}>
                                {formatStatusLabel(entry.new_status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(entry.changed_at), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{entry.changed_by}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {entry.reason && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Reason:</span>{" "}
                                  {formatStatusLabel(entry.reason)}
                                </p>
                              )}
                              {entry.notes && (
                                <p className="text-muted-foreground line-clamp-2">
                                  <span className="font-medium">Notes:</span> {entry.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/tenant/${entry.tenant_id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No status changes found</p>
                <p className="text-sm text-muted-foreground">
                  Status changes will appear here as they occur
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusHistoryPage;
