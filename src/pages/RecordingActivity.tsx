import { useState } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Download, Calendar as CalendarIcon, ArrowUpDown, Eye, CheckSquare, Square, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, subDays, startOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SortField = "created_at" | "agent_name" | "amount" | "payment_amount";
type SortOrder = "asc" | "desc";

const RecordingActivity = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Get total count for pagination
  const { data: totalCount } = useQuery({
    queryKey: ["recordingActivityCount", searchTerm, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("agent_earnings")
        .select("*", { count: "exact", head: true })
        .eq("earning_type", "recording_bonus");

      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,agent_phone.ilike.%${searchTerm}%`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error fetching count:", error);
        throw error;
      }

      return count || 0;
    },
  });

  const { data: recordingActivity, isLoading } = useQuery({
    queryKey: ["recordingActivity", currentPage, searchTerm, itemsPerPage, sortField, sortOrder, startDate, endDate],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("agent_earnings")
        .select(`
          *,
          tenant:tenants(name, contact, address),
          payment:daily_payments(amount, paid_amount, date, paid)
        `)
        .eq("earning_type", "recording_bonus");

      // Apply date range filter
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      // Apply sorting
      if (sortField === "payment_amount") {
        // For payment amount, we need to handle it differently
        query = query.order("created_at", { ascending: sortOrder === "asc" });
      } else {
        query = query.order(sortField, { ascending: sortOrder === "asc" });
      }
      
      query = query.range(from, to);

      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,agent_phone.ilike.%${searchTerm}%`);
      }

      const { data: bonuses, error } = await query;

      if (error) {
        console.error("Error fetching recording activity:", error);
        throw error;
      }

      // Client-side sort for payment_amount if needed
      if (sortField === "payment_amount" && bonuses) {
        bonuses.sort((a: any, b: any) => {
          const amountA = Number(a.payment?.paid_amount || 0);
          const amountB = Number(b.payment?.paid_amount || 0);
          return sortOrder === "asc" ? amountA - amountB : amountB - amountA;
        });
      }

      return bonuses || [];
    },
  });

  // Get total summary (not filtered by pagination)
  const { data: summaryData } = useQuery({
    queryKey: ["recordingActivitySummary", searchTerm, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("agent_earnings")
        .select("amount")
        .eq("earning_type", "recording_bonus");

      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,agent_phone.ilike.%${searchTerm}%`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching summary:", error);
        throw error;
      }

      return data || [];
    },
  });

  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;
  const totalRecordings = totalCount || 0;
  const totalBonuses = summaryData?.reduce((sum: number, record: any) => sum + Number(record.amount), 0) || 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const setPresetDateRange = (preset: 'today' | 'last7days' | 'last30days' | 'thisMonth') => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'last7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
    }
    
    setCurrentPage(1);
  };

  const hasDateFilters = startDate || endDate;

  const toggleSelectAll = () => {
    if (selectedRecords.size === recordingActivity?.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(recordingActivity?.map((r: any) => r.id) || []));
    }
  };

  const toggleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleExportSelected = () => {
    try {
      const recordsToExport = recordingActivity?.filter((r: any) => selectedRecords.has(r.id)) || [];
      
      if (recordsToExport.length === 0) {
        toast.error("No records selected for export");
        return;
      }

      const exportData = recordsToExport.map((record: any) => ({
        "Date & Time": format(new Date(record.created_at), "yyyy-MM-dd HH:mm:ss"),
        "Recorded By": record.agent_name,
        "Phone": record.agent_phone,
        "Tenant Name": record.tenant?.name || "-",
        "Tenant Contact": record.tenant?.contact || "-",
        "Payment Date": record.payment?.date || "-",
        "Payment Amount": record.payment?.paid_amount || 0,
        "Recording Bonus (0.5%)": record.amount,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Selected Records");

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Selected_Recordings_${date}.xlsx`);
      
      toast.success(`${recordsToExport.length} records exported successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export selected records");
    }
  };

  const handleExport = () => {
    try {
      const exportData = recordingActivity?.map((record: any) => ({
        "Date & Time": format(new Date(record.created_at), "yyyy-MM-dd HH:mm:ss"),
        "Recorded By": record.agent_name,
        "Phone": record.agent_phone,
        "Tenant Name": record.tenant?.name || "-",
        "Tenant Contact": record.tenant?.contact || "-",
        "Payment Date": record.payment?.date || "-",
        "Payment Amount": record.payment?.paid_amount || 0,
        "Recording Bonus (0.5%)": record.amount,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData || []);
      ws['!cols'] = [
        { wch: 20 }, // Date & Time
        { wch: 25 }, // Recorded By
        { wch: 15 }, // Phone
        { wch: 25 }, // Tenant Name
        { wch: 15 }, // Tenant Contact
        { wch: 12 }, // Payment Date
        { wch: 15 }, // Payment Amount
        { wch: 18 }, // Recording Bonus
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recording Activity");

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Recording_Activity_${date}.xlsx`);
      
      toast.success("Recording activity exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export recording activity");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <WelileLogo />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  ⭐ Payment Recording Activity
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Track who's recording payments and earning bonuses</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedRecords.size > 0 && (
                <Button
                  onClick={handleExportSelected}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Download className="w-4 h-4" />
                  Export Selected ({selectedRecords.size})
                </Button>
              )}
              <Button
                onClick={handleExport}
                className="flex items-center gap-2"
                variant="outline"
                disabled={!recordingActivity || recordingActivity.length === 0}
              >
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalRecordings}</div>
                <div className="text-sm text-muted-foreground">Total Recordings</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
            <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">UGX {totalBonuses.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Bonuses Paid</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {totalRecordings > 0 ? Math.round(totalBonuses / totalRecordings) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Bonus per Recording</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Search by recorder name or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md"
            />
            
            {/* Date Range Presets */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDateRange('today')}
                className="h-9"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDateRange('last7days')}
                className="h-9"
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDateRange('last30days')}
                className="h-9"
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDateRange('thisMonth')}
                className="h-9"
              >
                This Month
              </Button>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setCurrentPage(1);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setCurrentPage(1);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {hasDateFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearDateFilters}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {recordingActivity?.length || 0} of {totalRecordings}
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : recordingActivity && recordingActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecords.size === recordingActivity?.length && recordingActivity?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-bold cursor-pointer" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">
                        Date & Time
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold cursor-pointer" onClick={() => handleSort("agent_name")}>
                      <div className="flex items-center gap-1">
                        Recorded By
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Tenant</TableHead>
                    <TableHead className="font-bold">Payment Date</TableHead>
                    <TableHead className="text-right font-bold cursor-pointer" onClick={() => handleSort("payment_amount")}>
                      <div className="flex items-center justify-end gap-1">
                        Payment Amount
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-bold bg-primary/10 cursor-pointer" onClick={() => handleSort("amount")}>
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-4 h-4" />
                        Bonus (0.5%)
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordingActivity.map((record: any) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={() => toggleSelectRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(record.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-semibold">{record.agent_name}</TableCell>
                      <TableCell className="text-muted-foreground">{record.agent_phone}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.tenant?.name || "-"}</div>
                          <div className="text-xs text-muted-foreground">{record.tenant?.contact || ""}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.payment?.date ? format(new Date(record.payment.date), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        UGX {Number(record.payment?.paid_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary bg-primary/5">
                        UGX {Number(record.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailRecord(record)}
                          className="h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No recording activity found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search" : "Recording bonuses will appear here as payments are recorded"}
              </p>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
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
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Welile Tenants Hub - Performance Monitoring Platform</p>
          <p className="text-sm mt-2">Powered by Lovable Cloud</p>
        </div>
      </footer>

      {/* Detail View Dialog */}
      <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Recording Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment recording
            </DialogDescription>
          </DialogHeader>
          
          {detailRecord && (
            <div className="space-y-6">
              {/* Recording Information */}
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Recording Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Recorded By</div>
                    <div className="font-medium">{detailRecord.agent_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{detailRecord.agent_phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Recording Date & Time</div>
                    <div className="font-medium">
                      {format(new Date(detailRecord.created_at), "MMMM dd, yyyy 'at' HH:mm")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Recording Bonus</div>
                    <div className="font-bold text-primary text-lg">
                      UGX {Number(detailRecord.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3">Tenant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tenant Name</div>
                    <div className="font-medium">{detailRecord.tenant?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact</div>
                    <div className="font-medium">{detailRecord.tenant?.contact || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">{detailRecord.tenant?.address || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-accent" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Date</div>
                    <div className="font-medium">
                      {detailRecord.payment?.date 
                        ? format(new Date(detailRecord.payment.date), "MMMM dd, yyyy")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Status</div>
                    <div className="font-medium">
                      {detailRecord.payment?.paid ? (
                        <span className="text-green-600 font-semibold">Paid</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Amount</div>
                    <div className="font-bold text-lg">
                      UGX {Number(detailRecord.payment?.paid_amount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bonus Rate</div>
                    <div className="font-medium">0.5%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordingActivity;
