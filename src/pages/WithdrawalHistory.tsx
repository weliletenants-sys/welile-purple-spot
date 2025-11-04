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
import { ArrowLeft, Download, Lock, TrendingUp, Clock, CheckCircle, XCircle, FileText, Award } from "lucide-react";
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // Time-series data for trends
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
      .slice(-30); // Last 30 days
  }, [requests]);

  // Top agents analytics
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
      .slice(0, 10); // Top 10 agents
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

  const exportToPDF = async () => {
    const element = document.getElementById("withdrawal-report");
    if (!element) return;

    toast({
      title: "Generating PDF...",
      description: "Please wait while we create your report",
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`withdrawal_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast({
        title: "PDF Export Successful",
        description: "Your report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const exportToHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Withdrawal History Report - ${format(new Date(), "PPP")}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-title { font-size: 14px; color: #666; margin-bottom: 10px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #333; }
          .stat-subtitle { font-size: 12px; color: #999; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f0f0f0; font-weight: bold; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .badge-approved { background: #d4edda; color: #155724; }
          .badge-pending { background: #fff3cd; color: #856404; }
          .badge-rejected { background: #f8d7da; color: #721c24; }
          .top-agents { background: white; padding: 20px; border-radius: 8px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Withdrawal History Report</h1>
          <p>Generated on ${format(new Date(), "PPP")}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-title">Total Withdrawals</div>
            <div class="stat-value">UGX ${statistics.totalAmount.toLocaleString()}</div>
            <div class="stat-subtitle">${statistics.totalRequests} total requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Pending Amount</div>
            <div class="stat-value">UGX ${statistics.pendingAmount.toLocaleString()}</div>
            <div class="stat-subtitle">${statistics.pendingCount} pending requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Approved Amount</div>
            <div class="stat-value">UGX ${statistics.approvedAmount.toLocaleString()}</div>
            <div class="stat-subtitle">${statistics.approvedCount} approved (${statistics.approvalRate}%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Rejection Rate</div>
            <div class="stat-value">${statistics.rejectionRate}%</div>
            <div class="stat-subtitle">${statistics.rejectedCount} rejected requests</div>
          </div>
        </div>

        <div class="top-agents">
          <h2>Top 10 Agents</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Agent Name</th>
                <th>Phone</th>
                <th>Total Amount</th>
                <th>Requests</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              ${topAgents
                .map(
                  (agent, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${agent.name}</td>
                  <td>${agent.phone}</td>
                  <td>UGX ${agent.totalAmount.toLocaleString()}</td>
                  <td>${agent.requestCount}</td>
                  <td>${agent.approvedCount}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <h2 style="margin-top: 40px;">All Withdrawal Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Agent Name</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Processed At</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequests
              .map(
                (request) => `
              <tr>
                <td>${request.agent_name}</td>
                <td>${request.agent_phone}</td>
                <td>UGX ${request.amount.toLocaleString()}</td>
                <td><span class="badge badge-${request.status}">${request.status}</span></td>
                <td>${format(new Date(request.requested_at), "PPp")}</td>
                <td>${request.processed_at ? format(new Date(request.processed_at), "PPp") : "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawal_report_${format(new Date(), "yyyy-MM-dd")}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "HTML Export Successful",
      description: "Your report has been downloaded",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Withdrawal History</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToExcel} disabled={filteredRequests.length === 0} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button onClick={exportToPDF} disabled={filteredRequests.length === 0} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={exportToHTML} disabled={filteredRequests.length === 0} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              HTML
            </Button>
          </div>
        </div>

        <div id="withdrawal-report">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
          <Card className="mt-6">
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
          <Card className="mt-6">
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
