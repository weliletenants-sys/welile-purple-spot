import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

const ACCESS_CODE = "Mypart@welile";

export default function WithdrawalHistory() {
  const navigate = useNavigate();
  const { requests, isLoading } = useWithdrawalRequests();
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem("withdrawal_history_unlocked") === "true";
  });
  const [accessCode, setAccessCode] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === ACCESS_CODE) {
      setIsUnlocked(true);
      sessionStorage.setItem("withdrawal_history_unlocked", "true");
      toast({
        title: "Access Granted",
        description: "Welcome to withdrawal history",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid access code",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false;
    if (searchTerm && !request.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !request.agent_phone.includes(searchTerm)) return false;
    if (dateFrom && new Date(request.requested_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(request.requested_at) > new Date(dateTo)) return false;
    return true;
  });

  const exportToExcel = () => {
    const exportData = filteredRequests.map((request) => ({
      "Agent Name": request.agent_name,
      "Agent Phone": request.agent_phone,
      "Amount": request.amount,
      "Status": request.status,
      "Requested At": format(new Date(request.requested_at), "PPpp"),
      "Processed At": request.processed_at ? format(new Date(request.processed_at), "PPpp") : "N/A",
      "Notes": request.notes || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Withdrawal History");
    XLSX.writeFile(wb, `withdrawal_history_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredRequests.length} records`,
    });
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Protected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Unlock
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Withdrawal History</h1>
          </div>
          <Button onClick={exportToExcel} disabled={filteredRequests.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by agent name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(searchTerm || statusFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {filteredRequests.length} {filteredRequests.length === 1 ? "Transaction" : "Transactions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filteredRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Processed At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.agent_name}</TableCell>
                        <TableCell>{request.agent_phone}</TableCell>
                        <TableCell>UGX {request.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(request.requested_at), "PPp")}</TableCell>
                        <TableCell>
                          {request.processed_at ? format(new Date(request.processed_at), "PPp") : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.notes || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
