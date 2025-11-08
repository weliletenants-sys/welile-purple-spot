import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, TrendingUp, Clock, CheckCircle, XCircle, FileText, Award, Home } from "lucide-react";
import { format, startOfDay, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function WithdrawalHistory() {
  const navigate = useNavigate();
  const { requests, isLoading } = useWithdrawalRequests();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false;
    if (
      searchTerm &&
      !request.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !request.agent_phone.includes(searchTerm)
    )
      return false;
    if (dateFrom && new Date(request.requested_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(request.requested_at) > new Date(dateTo)) return false;
    return true;
  });

  const statistics = useMemo(() => {
    const totalAmount = requests.reduce((sum, req) => sum + Number(req.amount), 0);
    const pendingAmount = requests
      .filter((req) => req.status === "pending")
      .reduce((sum, req) => sum + Number(req.amount), 0);
    const approvedAmount = requests
      .filter((req) => req.status === "approved")
      .reduce((sum, req) => sum + Number(req.amount), 0);
    const rejectedAmount = requests
      .filter((req) => req.status === "rejected")
      .reduce((sum, req) => sum + Number(req.amount), 0);

    const totalRequests = requests.length;
    const pendingCount = requests.filter((req) => req.status === "pending").length;
    const approvedCount = requests.filter((req) => req.status === "approved").length;
    const rejectedCount = requests.filter((req) => req.status === "rejected").length;

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
  ].filter((item) => item.value > 0);

  const barChartData = [
    { name: "Approved", amount: statistics.approvedAmount, fill: "hsl(var(--chart-1))" },
    { name: "Pending", amount: statistics.pendingAmount, fill: "hsl(var(--chart-2))" },
    { name: "Rejected", amount: statistics.rejectedAmount, fill: "hsl(var(--chart-3))" },
  ];

  const trendsData = useMemo(() => {
    const dateMap = new Map<string, { approved: number; pending: number; rejected: number }>();

    requests.forEach((request) => {
      const dateKey = format(startOfDay(parseISO(request.requested_at)), "MMM dd");
      const existing = dateMap.get(dateKey) || { approved: 0, pending: 0, rejected: 0 };

      if (request.status === "approved") existing.approved += Number(request.amount);
      else if (request.status === "pending") existing.pending += Number(request.amount);
      else if (request.status === "rejected") existing.rejected += Number(request.amount);

      dateMap.set(dateKey, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => {
        const dateA = new Date(a.date + ", 2024");
        const dateB = new Date(b.date + ", 2024");
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-30);
  }, [requests]);

  const topAgents = useMemo(() => {
    const agentMap = new Map<
      string,
      { name: string; phone: string; totalAmount: number; requestCount: number; approvedCount: number }
    >();

    requests.forEach((request) => {
      const key = request.agent_phone;
      const existing = agentMap.get(key) || {
        name: request.agent_name,
        phone: request.agent_phone,
        totalAmount: 0,
        requestCount: 0,
        approvedCount: 0,
      };

      existing.totalAmount += Number(request.amount);
      existing.requestCount += 1;
      if (request.status === "approved") existing.approvedCount += 1;

      agentMap.set(key, existing);
    });

    return Array.from(agentMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [requests]);

  const exportToExcel = () => {
    const exportData = filteredRequests.map((request) => ({
      "Agent Name": request.agent_name,
      "Agent Phone": request.agent_phone,
      Amount: request.amount,
      Status: request.status,
      "Requested At": format(new Date(request.requested_at), "PPpp"),
      "Processed At": request.processed_at ? format(new Date(request.processed_at), "PPpp") : "N/A",
      Notes: request.notes || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Withdrawal History");
    XLSX.writeFile(wb, `withdrawal_history_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredRequests.length} records to Excel`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">Withdrawal History</h1>
          </div>
          <Button onClick={exportToExcel} disabled={filteredRequests.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
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
              <p className="text-xs text-muted-foreground mt-1">{statistics.totalRequests} total requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">UGX {statistics.pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{statistics.pendingCount} pending requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">
                UGX {statistics.approvedAmount.toLocaleString()}
              </div>
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
              <p className="text-xs text-muted-foreground mt-1">{statistics.rejectedCount} rejected requests</p>
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
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
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
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => `UGX ${value.toLocaleString()}`} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => `UGX ${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Approved"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Pending"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Agents Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Top 10 Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Requests</TableHead>
                    <TableHead className="text-center">Approved</TableHead>
                    <TableHead className="text-center">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAgents.length > 0 ? (
                    topAgents.map((agent, index) => (
                      <TableRow key={agent.phone}>
                        <TableCell className="font-bold">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                        </TableCell>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.phone}</TableCell>
                        <TableCell className="text-right font-semibold">
                          UGX {agent.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">{agent.requestCount}</TableCell>
                        <TableCell className="text-center">{agent.approvedCount}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              agent.approvedCount / agent.requestCount >= 0.8
                                ? "default"
                                : agent.approvedCount / agent.requestCount >= 0.5
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {((agent.approvedCount / agent.requestCount) * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No agent data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Filters */}
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
              <Input type="date" placeholder="To date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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

        {/* Transactions Table */}
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
                        <TableCell className="font-semibold">UGX {request.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(request.requested_at), "PP p")}</TableCell>
                        <TableCell>
                          {request.processed_at ? format(new Date(request.processed_at), "PP p") : "N/A"}
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
