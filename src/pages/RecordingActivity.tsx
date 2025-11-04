import { useState } from "react";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Download, Calendar } from "lucide-react";
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
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const RecordingActivity = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: recordingActivity, isLoading } = useQuery({
    queryKey: ["recordingActivity"],
    queryFn: async () => {
      // Get all recording bonuses with tenant and payment details
      const { data: bonuses, error } = await supabase
        .from("agent_earnings")
        .select(`
          *,
          tenant:tenants(name, contact),
          payment:daily_payments(amount, paid_amount, date)
        `)
        .eq("earning_type", "recording_bonus")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recording activity:", error);
        throw error;
      }

      return bonuses || [];
    },
  });

  const filteredActivity = recordingActivity?.filter((record: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.agent_name?.toLowerCase().includes(searchLower) ||
      record.agent_phone?.toLowerCase().includes(searchLower) ||
      record.tenant?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    try {
      const exportData = filteredActivity?.map((record: any) => ({
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

  const totalRecordings = filteredActivity?.length || 0;
  const totalBonuses = filteredActivity?.reduce((sum: number, record: any) => sum + Number(record.amount), 0) || 0;

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
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
              variant="outline"
              disabled={!filteredActivity || filteredActivity.length === 0}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
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
                <Calendar className="w-6 h-6 text-accent" />
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

        {/* Search */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by recorder name, phone, or tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Activity Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredActivity && filteredActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Date & Time</TableHead>
                    <TableHead className="font-bold">Recorded By</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Tenant</TableHead>
                    <TableHead className="font-bold">Payment Date</TableHead>
                    <TableHead className="text-right font-bold">Payment Amount</TableHead>
                    <TableHead className="text-right font-bold bg-primary/10">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-4 h-4" />
                        Bonus (0.5%)
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivity.map((record: any) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Welile Tenants Hub - Performance Monitoring Platform</p>
          <p className="text-sm mt-2">Powered by Lovable Cloud</p>
        </div>
      </footer>
    </div>
  );
};

export default RecordingActivity;
