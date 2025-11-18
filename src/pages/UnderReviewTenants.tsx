import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { useUnderReviewTenants } from "@/hooks/useUnderReviewTenants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Search,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  User,
  CheckCircle,
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
  FileText,
  RotateCcw,
  DollarSign,
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";
import { RestoreTenantDialog } from "@/components/RestoreTenantDialog";

const UnderReviewTenants = () => {
  const navigate = useNavigate();
  const { data: tenants, isLoading } = useUnderReviewTenants();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTenant, setUpdatingTenant] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"name" | "rejected_at" | "location_district" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<{ id: string; name: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Get unique districts and rejection reasons for filters
  const uniqueDistricts = Array.from(new Set(tenants?.map(t => t.location_district).filter(Boolean))) as string[];
  const uniqueReasons = Array.from(new Set(tenants?.map(t => t.rejection_reason).filter(Boolean))) as string[];

  const filteredTenants = tenants?.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact.includes(searchTerm);
    
    const matchesDistrict = filterDistrict === "all" || tenant.location_district === filterDistrict;
    const matchesReason = filterReason === "all" || tenant.rejection_reason === filterReason;
    
    let matchesDateRange = true;
    if (tenant.rejected_at) {
      const tenantDate = new Date(tenant.rejected_at);
      if (dateFrom && isBefore(tenantDate, startOfDay(dateFrom))) {
        matchesDateRange = false;
      }
      if (dateTo && isAfter(tenantDate, endOfDay(dateTo))) {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesDistrict && matchesReason && matchesDateRange;
  });

  const sortedTenants = filteredTenants?.slice().sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    if (sortColumn === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortColumn === "rejected_at") {
      aValue = a.rejected_at ? new Date(a.rejected_at).getTime() : 0;
      bValue = b.rejected_at ? new Date(b.rejected_at).getTime() : 0;
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

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSort = (column: "name" | "rejected_at" | "location_district") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "name" | "rejected_at" | "location_district") => {
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

      queryClient.invalidateQueries({ queryKey: ["under-review-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["under-review-tenants-count"] });
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

  const handleRestoreTenant = (tenantId: string, tenantName: string) => {
    setSelectedTenant({ id: tenantId, name: tenantName });
    setShowRestoreDialog(true);
  };

  const handleRestoreConfirm = async (reason: string) => {
    if (!selectedTenant) return;

    setIsRestoring(true);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          status: "pending",
          rejection_notes: `${reason}\n\n[Previous notes: ${selectedTenant ? (tenants?.find(t => t.id === selectedTenant.id)?.rejection_notes || "None") : "None"}]`,
          edited_at: new Date().toISOString(),
          edited_by: "Admin"
        })
        .eq("id", selectedTenant.id);

      if (error) throw error;

      toast({
        title: "Tenant Restored",
        description: `${selectedTenant.name} has been restored to pending status`,
      });

      setShowRestoreDialog(false);
      setSelectedTenant(null);

      queryClient.invalidateQueries({ queryKey: ["under-review-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["under-review-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tenants-count"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error: any) {
      console.error("Error restoring tenant:", error);
      toast({
        title: "Restoration Failed",
        description: error.message || "Failed to restore tenant to pending",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const clearFilters = () => {
    setFilterDistrict("all");
    setFilterReason("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = filterDistrict !== "all" || filterReason !== "all" || dateFrom || dateTo;

  const exportToExcel = () => {
    if (!sortedTenants || sortedTenants.length === 0) {
      toast({
        title: "No Data",
        description: "No under review tenants to export",
        variant: "destructive",
      });
      return;
    }

    const excelData = sortedTenants.map(tenant => ({
      "Tenant Name": tenant.name,
      "Contact": tenant.contact,
      "District": tenant.location_district || "N/A",
      "Address": tenant.address,
      "Rejection Reason": tenant.rejection_reason || "N/A",
      "Rejection Notes": tenant.rejection_notes || "N/A",
      "Rejected By": tenant.rejected_by || "N/A",
      "Rejected At": tenant.rejected_at ? format(new Date(tenant.rejected_at), "MMM dd, yyyy HH:mm") : "N/A",
      "Agent Name": tenant.agent_name || "Unassigned",
      "Rent Amount": tenant.rent_amount,
      "Service Center": tenant.service_center || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Under Review");
    XLSX.writeFile(wb, `under-review-tenants-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Exported ${sortedTenants.length} tenant(s) to Excel`,
    });
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
            <AlertCircle className="h-10 w-10 text-yellow-600" />
            Under Review Tenants
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage tenants under review with rejection details
          </p>
        </div>

        <Card className="mb-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Under Review</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {tenants?.length || 0}
                </p>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Narrow down your results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
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
                <label className="text-sm font-medium">District</label>
                <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {uniqueDistricts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <Select value={filterReason} onValueChange={setFilterReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {uniqueReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                      />
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
              <CardTitle>Under Review Tenants</CardTitle>
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
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : paginatedTenants && paginatedTenants.length > 0 ? (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("name")}
                            className="flex items-center"
                          >
                            Tenant Info
                            {getSortIcon("name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("location_district")}
                            className="flex items-center"
                          >
                            Location
                            {getSortIcon("location_district")}
                          </Button>
                        </TableHead>
                        <TableHead>Rejection Details</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("rejected_at")}
                            className="flex items-center"
                          >
                            Rejected At
                            {getSortIcon("rejected_at")}
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{tenant.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{tenant.contact}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{tenant.location_district || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {tenant.rejection_reason?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "No reason"}
                              </Badge>
                              {tenant.rejection_notes && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {tenant.rejection_notes}
                                </p>
                              )}
                              {tenant.rejected_by && (
                                <p className="text-xs text-muted-foreground">
                                  By: {tenant.rejected_by}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {tenant.rejected_at
                                ? format(new Date(tenant.rejected_at), "MMM dd, yyyy HH:mm")
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/tenant/${tenant.id}`)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenant/${tenant.id}`)}
                                className="gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                                title="Record Payment"
                              >
                                <DollarSign className="h-4 w-4" />
                                Pay
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreTenant(tenant.id, tenant.name)}
                                disabled={isRestoring}
                                className="text-primary hover:bg-primary/10"
                                title="Restore to Pending"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </Button>
                              <Select
                                value={tenant.status}
                                onValueChange={(value) => handleStatusUpdate(tenant.id, value)}
                                disabled={updatingTenant === tenant.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="under_review">Under Review</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No tenants under review</p>
                <p className="text-sm text-muted-foreground">
                  Tenants marked for review will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RestoreTenantDialog
        open={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedTenant(null);
        }}
        onConfirm={handleRestoreConfirm}
        tenantName={selectedTenant?.name || ""}
        isSubmitting={isRestoring}
      />
    </div>
  );
};

export default UnderReviewTenants;
