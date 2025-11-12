import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePendingTenants } from "@/hooks/usePendingTenants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Search,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";
import { BulkRejectTenantsDialog } from "@/components/BulkRejectTenantsDialog";

const PendingTenants = () => {
  const navigate = useNavigate();
  const { data: tenants, isLoading } = usePendingTenants();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [sortColumn, setSortColumn] = useState<"name" | "created_at" | "location_district" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Get unique districts and agents for filters
  const uniqueDistricts = Array.from(new Set(tenants?.map(t => t.location_district).filter(Boolean))) as string[];
  const uniqueAgents = Array.from(new Set(tenants?.map(t => t.agent_name).filter(Boolean))) as string[];

  const filteredTenants = tenants?.filter((tenant) => {
    // Search filter
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact.includes(searchTerm);
    
    // District filter
    const matchesDistrict = filterDistrict === "all" || tenant.location_district === filterDistrict;
    
    // Agent filter
    const matchesAgent = filterAgent === "all" || tenant.agent_name === filterAgent;
    
    // Date range filter
    let matchesDateRange = true;
    const tenantDate = new Date(tenant.created_at);
    if (dateFrom && isBefore(tenantDate, startOfDay(dateFrom))) {
      matchesDateRange = false;
    }
    if (dateTo && isAfter(tenantDate, endOfDay(dateTo))) {
      matchesDateRange = false;
    }
    
    return matchesSearch && matchesDistrict && matchesAgent && matchesDateRange;
  });

  const sortedTenants = filteredTenants?.slice().sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    if (sortColumn === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortColumn === "created_at") {
      aValue = new Date(a.created_at).getTime();
      bValue = new Date(b.created_at).getTime();
    } else if (sortColumn === "location_district") {
      aValue = (a.location_district || "").toLowerCase();
      bValue = (b.location_district || "").toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalItems = sortedTenants?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTenants = sortedTenants?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSort = (column: "name" | "created_at" | "location_district") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "name" | "created_at" | "location_district") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
  };

  const handleStatusUpdate = async (tenantId: string, newStatus: string) => {
    setUpdatingTenant(tenantId);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ 
          status: newStatus,
          edited_at: new Date().toISOString(),
          edited_by: "Admin"
        })
        .eq("id", tenantId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Tenant status changed to ${newStatus}`,
      });

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["pending-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tenant status",
        variant: "destructive",
      });
    } finally {
      setUpdatingTenant(null);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedTenants.length === 0) return;

    setIsBulkUpdating(true);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ 
          status: newStatus,
          edited_at: new Date().toISOString(),
          edited_by: "Admin"
        })
        .in("id", selectedTenants);

      if (error) throw error;

      toast({
        title: "Bulk Update Successful",
        description: `${selectedTenants.length} tenant(s) updated to ${newStatus}`,
      });

      // Clear selection
      setSelectedTenants([]);

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["pending-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error: any) {
      console.error("Error updating statuses:", error);
      toast({
        title: "Bulk Update Failed",
        description: error.message || "Failed to update tenant statuses",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkReject = async (reason: string, notes: string) => {
    if (selectedTenants.length === 0) return;

    setIsBulkUpdating(true);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ 
          status: "under_review",
          rejection_reason: reason,
          rejection_notes: notes,
          rejected_at: new Date().toISOString(),
          rejected_by: "Admin",
          edited_at: new Date().toISOString(),
          edited_by: "Admin"
        })
        .in("id", selectedTenants);

      if (error) throw error;

      toast({
        title: "Tenants Moved to Review",
        description: `${selectedTenants.length} tenant(s) moved to under review`,
      });

      // Clear selection and close dialog
      setSelectedTenants([]);
      setShowRejectDialog(false);

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ["pending-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error: any) {
      console.error("Error rejecting tenants:", error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject tenants",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTenants.length === paginatedTenants?.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(paginatedTenants?.map(t => t.id) || []);
    }
  };

  const toggleSelectTenant = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const clearFilters = () => {
    setFilterDistrict("all");
    setFilterAgent("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    resetPagination();
  };

  const hasActiveFilters = filterDistrict !== "all" || filterAgent !== "all" || dateFrom || dateTo;

  const exportToCSV = () => {
    if (!sortedTenants || sortedTenants.length === 0) {
      toast({
        title: "No Data",
        description: "No pending tenants to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = sortedTenants.map(tenant => ({
      "Tenant Name": tenant.name,
      "Contact": tenant.contact,
      "District": tenant.location_district || "N/A",
      "Address": tenant.address,
      "Agent Name": tenant.agent_name || "Unassigned",
      "Agent Phone": tenant.agent_phone || "N/A",
      "Status": tenant.status,
      "Rent Amount": tenant.rent_amount,
      "Date Added": format(new Date(tenant.created_at), "MMM dd, yyyy"),
      "Landlord": tenant.landlord,
      "Landlord Contact": tenant.landlord_contact,
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-tenants-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${sortedTenants.length} pending tenant(s) to CSV`,
    });
  };

  const exportToExcel = () => {
    if (!sortedTenants || sortedTenants.length === 0) {
      toast({
        title: "No Data",
        description: "No pending tenants to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = sortedTenants.map(tenant => ({
      "Tenant Name": tenant.name,
      "Contact": tenant.contact,
      "District": tenant.location_district || "N/A",
      "Address": tenant.address,
      "Agent Name": tenant.agent_name || "Unassigned",
      "Agent Phone": tenant.agent_phone || "N/A",
      "Status": tenant.status,
      "Payment Status": tenant.payment_status,
      "Rent Amount": tenant.rent_amount,
      "Repayment Days": tenant.repayment_days,
      "Date Added": format(new Date(tenant.created_at), "MMM dd, yyyy"),
      "Landlord": tenant.landlord,
      "Landlord Contact": tenant.landlord_contact,
      "Guarantor 1 Name": tenant.guarantor1_name || "N/A",
      "Guarantor 1 Contact": tenant.guarantor1_contact || "N/A",
      "Guarantor 2 Name": tenant.guarantor2_name || "N/A",
      "Guarantor 2 Contact": tenant.guarantor2_contact || "N/A",
      "Service Center": tenant.service_center || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pending Tenants");
    XLSX.writeFile(wb, `pending-tenants-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Exported ${sortedTenants.length} pending tenant(s) to Excel`,
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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackToHome />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WelileLogo />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <Clock className="h-10 w-10 text-orange-600" />
            Pending Tenants
          </h1>
          <p className="text-lg text-muted-foreground">
            Review and update tenant statuses
          </p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pending Tenants</p>
                <p className="text-4xl font-bold text-orange-600">
                  {tenants?.length || 0}
                </p>
                {selectedTenants.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedTenants.length} tenant(s) selected
                  </p>
                )}
                {totalItems > 0 && totalItems !== tenants?.length && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalItems} filtered result(s)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={!sortedTenants || sortedTenants.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={!sortedTenants || sortedTenants.length === 0}
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

        {/* Bulk Actions */}
        {selectedTenants.length > 0 && (
          <Card className="mb-6 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-lg mb-1">Bulk Actions</p>
                    <p className="text-sm text-muted-foreground">
                      Update {selectedTenants.length} selected tenant(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTenants([])}
                    disabled={isBulkUpdating}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate("under_review")}
                    disabled={isBulkUpdating}
                    className="border-yellow-500/50 hover:bg-yellow-500/10"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 text-yellow-600" />
                    Mark as Under Review
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate("active")}
                    disabled={isBulkUpdating}
                    className="border-green-500/50 hover:bg-green-500/10"
                  >
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    Approve All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isBulkUpdating}
                    className="border-red-500/50 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4 mr-1 text-red-600" />
                    Reject Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Dialog */}
        <BulkRejectTenantsDialog
          open={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleBulkReject}
          tenantCount={selectedTenants.length}
          isSubmitting={isBulkUpdating}
        />

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Search & Filters</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* District Filter */}
              <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {uniqueDistricts.sort().map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Agent Filter */}
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.sort().map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`flex-1 justify-start text-left font-normal ${!dateFrom && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd") : "From"}
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
                    <Button
                      variant="outline"
                      className={`flex-1 justify-start text-left font-normal ${!dateTo && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd") : "To"}
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
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filterDistrict !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    District: {filterDistrict}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => setFilterDistrict("all")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterAgent !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agent: {filterAgent}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => setFilterAgent("all")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    From: {format(dateFrom, "MMM dd, yyyy")}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => setDateFrom(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    To: {format(dateTo, "MMM dd, yyyy")}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => setDateTo(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Tenants Awaiting Review
            </CardTitle>
            <CardDescription>
              Click on status dropdown to approve, review, or keep as pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Results Summary and Page Size Selector */}
            {sortedTenants && sortedTenants.length > 0 && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                  <span className="font-medium text-foreground">{Math.min(endIndex, totalItems)}</span> of{" "}
                  <span className="font-medium text-foreground">{totalItems}</span> result(s)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
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
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : sortedTenants && sortedTenants.length > 0 ? (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTenants.length === paginatedTenants?.length && paginatedTenants?.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("name")}
                          className="hover:bg-accent/50 -ml-3"
                        >
                          Tenant Name
                          {getSortIcon("name")}
                        </Button>
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("location_district")}
                          className="hover:bg-accent/50 -ml-3"
                        >
                          District
                          {getSortIcon("location_district")}
                        </Button>
                      </TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("created_at")}
                          className="hover:bg-accent/50 -ml-3"
                        >
                          Date Added
                          {getSortIcon("created_at")}
                        </Button>
                      </TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead className="text-center">Change Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTenants?.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTenants.includes(tenant.id)}
                            onCheckedChange={() => toggleSelectTenant(tenant.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/tenant/${tenant.id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group"
                          >
                            <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-medium underline-offset-4 group-hover:underline">{tenant.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {tenant.contact}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {tenant.location_district || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{tenant.agent_name || "Unassigned"}</div>
                            {tenant.agent_phone && (
                              <div className="text-xs text-muted-foreground">{tenant.agent_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.created_at), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {tenant.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tenant.status}
                            onValueChange={(value) => handleStatusUpdate(tenant.id, value)}
                            disabled={updatingTenant === tenant.id}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span>Keep Pending</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="under_review">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span>Under Review</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span>Approve → Active</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/tenant/${tenant.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
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
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

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
                  
                  <span className="text-sm text-muted-foreground ml-4">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground mb-6">
                  No pending tenants at the moment. All tenants have been reviewed.
                </p>
                <Button onClick={() => navigate("/")}>
                  Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Status Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-600">Pending</p>
                  <p className="text-muted-foreground">
                    Newly added, awaiting initial review
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-600">Under Review</p>
                  <p className="text-muted-foreground">
                    Being verified, requires additional checks
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-600">Active</p>
                  <p className="text-muted-foreground">
                    Approved and fully operational
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingTenants;
