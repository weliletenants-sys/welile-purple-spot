import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Lock, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

  const statistics = useMemo(() => {
    const totalAmount = requests.reduce((sum, req) => sum + Number(req.amount), 0);
    const pendingAmount = requests
      .filter(req => req.status === "pending")
      .reduce((sum, req) => sum + Number(req.amount), 0);
    const approvedAmount = requests
      .filter(req => req.status === "approved")
      .reduce((sum, req) => sum + Number(req.amount), 0);
    const rejectedAmount = requests
      .filter(req => req.status === "rejected")
      .reduce((sum, req) => sum + Number(req.amount), 0);
    
    const totalRequests = requests.length;
    const pendingCount = requests.filter(req => req.status === "pending").length;
    const approvedCount = requests.filter(req => req.status === "approved").length;
    const rejectedCount = requests.filter(req => req.status === "rejected").length;
    
    const rejectionRate = totalRequests > 0 ? ((rejectedCount / totalRequests) * 100).toFixed(1) : "0";
    const approvalRate = totalRequests > 0 ? ((approvedCount / totalRequests) * 100).toFixed(1) : "0";

    return {
      totalAmount,
      pendingAmount,
      approvedAmount,
      rejectedAmount,
      totalRequests,
      pendingCount,
      approvedCount,
      rejectedCount,
      rejectionRate,
      approvalRate,
    };
  }, [requests]);

  const pieChartData = [
    { name: "Approved", value: statistics.approvedCount, color: "hsl(var(--chart-1))" },
    { name: "Pending", value: statistics.pendingCount, color: "hsl(var(--chart-2))" },
    { name: "Rejected", value: statistics.rejectedCount, color: "hsl(var(--chart-3))" },
  ].filter(item => item.value > 0);

  const barChartData = [
    { name: "Approved", amount: statistics.approvedAmount, fill: "hsl(var(--chart-1))" },
    { name: "Pending", amount: statistics.pendingAmount, fill: "hsl(var(--chart-2))" },
    { name: "Rejected", amount: statistics.rejectedAmount, fill: "hsl(var(--chart-3))" },
  ];

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

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">UGX {statistics.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.totalRequests} total requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">UGX {statistics.pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.pendingCount} pending requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">UGX {statistics.approvedAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.approvedCount} approved ({statistics.approvalRate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
              <XCircle className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{statistics.rejectionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.rejectedCount} rejected requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amount by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
