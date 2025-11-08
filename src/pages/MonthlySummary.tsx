import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Calendar as CalendarIcon, Filter, Activity, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MonthOverMonthComparison } from "@/components/MonthOverMonthComparison";
import { supabase } from "@/integrations/supabase/client";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--secondary))"];

const MonthlySummary = () => {
  const navigate = useNavigate();
  const currentDate = new Date();

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(currentDate, 1),
    to: currentDate,
  });
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [agents, setAgents] = useState<string[]>([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [withdrawalRequests, setWithdrawalRequests] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const stats = useExecutiveStats();

  useEffect(() => {
    const fetchData = async () => {
      const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : format(subMonths(currentDate, 1), "yyyy-MM-dd");
      const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : format(currentDate, "yyyy-MM-dd");

      // Get all agents
      const { data: payments } = await supabase
        .from("daily_payments")
        .select("recorded_by")
        .not("recorded_by", "is", null);
      
      const uniqueAgents = Array.from(new Set(payments?.map(p => p.recorded_by) || []));
      setAgents(uniqueAgents.filter(agent => agent) as string[]);

      // Get total tenants
      const { count } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });
      
      setTotalTenants(count || 0);

      // Get payments (filtered by agent and date range)
      let paymentsQuery = supabase
        .from("daily_payments")
        .select("paid_amount, recorded_by, date")
        .eq("paid", true)
        .gte("date", startDate)
        .lte("date", endDate);

      if (selectedAgent !== "all") {
        paymentsQuery = paymentsQuery.eq("recorded_by", selectedAgent);
      }

      const { data: allPayments } = await paymentsQuery;
      const total = allPayments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
      setTotalPayments(total);

      // Calculate top agents
      const agentStats = new Map<string, { paymentsRecorded: number; totalAmount: number }>();
      allPayments?.forEach((payment) => {
        const agent = payment.recorded_by;
        if (!agent) return;
        const current = agentStats.get(agent) || { paymentsRecorded: 0, totalAmount: 0 };
        agentStats.set(agent, {
          paymentsRecorded: current.paymentsRecorded + 1,
          totalAmount: current.totalAmount + (payment.paid_amount || 0),
        });
      });

      const topAgentsList = Array.from(agentStats.entries())
        .map(([name, stats]) => ({
          name,
          paymentsRecorded: stats.paymentsRecorded,
          totalAmount: stats.totalAmount,
          earnings: Math.round(stats.totalAmount * 0.05),
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      setTopAgents(topAgentsList);

      // Get withdrawals (filtered by date range)
      const start = date?.from || subMonths(currentDate, 1);
      const end = date?.to || currentDate;

      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("status")
        .gte("requested_at", start.toISOString())
        .lte("requested_at", end.toISOString());

      setWithdrawalRequests(withdrawals?.length || 0);
      setPendingWithdrawals(withdrawals?.filter((w) => w.status === "pending").length || 0);
    };

    fetchData();
  }, [selectedAgent, date]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('realtime-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_payments' }, () => {
        setLastUpdate(new Date());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const dateRange = date?.from && date?.to 
      ? `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
      : "All Time";
    
    doc.setFontSize(20);
    doc.setTextColor(126, 58, 242);
    doc.text("Monthly Summary Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(dateRange, 14, 28);
    if (selectedAgent !== "all") {
      doc.text(`Agent: ${selectedAgent}`, 14, 34);
    }
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const statsData = [
      ["Total Tenants", totalTenants.toString()],
      ["Total Payments", `UGX ${totalPayments.toLocaleString()}`],
      ["Withdrawal Requests", `${withdrawalRequests} (${pendingWithdrawals} pending)`],
    ];

    autoTable(doc, {
      startY: selectedAgent !== "all" ? 40 : 35,
      head: [["Metric", "Value"]],
      body: statsData,
      theme: "grid",
      headStyles: { fillColor: [126, 58, 242] },
    });

    const agentData = topAgents.map((agent, index) => [
      `#${index + 1}`,
      agent.name,
      agent.paymentsRecorded.toString(),
      `UGX ${agent.totalAmount.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Rank", "Agent Name", "Payments", "Total Amount"]],
      body: agentData,
      theme: "striped",
      headStyles: { fillColor: [126, 58, 242] },
    });

    doc.save(`Monthly-Summary-${dateRange.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  };

  const handleExportToExcel = () => {
    const dateRange = date?.from && date?.to 
      ? `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
      : "All Time";

    // Summary Sheet
    const summaryData = [
      ["Monthly Summary Report"],
      ["Date Range:", dateRange],
      ["Agent Filter:", selectedAgent === "all" ? "All Agents" : selectedAgent],
      [],
      ["Metric", "Value"],
      ["Total Tenants", totalTenants],
      ["Total Payments", `UGX ${totalPayments.toLocaleString()}`],
      ["Withdrawal Requests", withdrawalRequests],
      ["Pending Withdrawals", pendingWithdrawals],
    ];

    // Agent Performance Sheet
    const agentData = [
      ["Agent Performance Report"],
      [],
      ["Rank", "Agent Name", "Payments Recorded", "Total Amount (UGX)", "Earnings (UGX)"],
      ...topAgents.map((agent, index) => [
        index + 1,
        agent.name,
        agent.paymentsRecorded,
        agent.totalAmount,
        agent.earnings,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    const agentWs = XLSX.utils.aoa_to_sheet(agentData);
    XLSX.utils.book_append_sheet(wb, agentWs, "Agent Performance");

    XLSX.writeFile(wb, `Monthly-Summary-${dateRange.replace(/[^a-z0-9]/gi, '-')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Real-time Metrics Widget */}
        {stats && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Metrics</CardTitle>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Total Tenants</span>
                  <p className="text-xl font-bold">{stats.numberOfTenants}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Payments Today</span>
                  <p className="text-xl font-bold">UGX {stats.totalRentPaid.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Collection Rate</span>
                  <p className="text-xl font-bold">{stats.collectionRate}%</p>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Outstanding</span>
                  <p className="text-xl font-bold">UGX {stats.outstandingBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Monthly Summary Report</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* Agent Filter */}
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>{selectedAgent === "all" ? "All Agents" : selectedAgent}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">Active tenants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">UGX {totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{withdrawalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">{pendingWithdrawals} pending</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.paymentsRecorded} payments recorded</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">UGX {agent.totalAmount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">UGX {agent.earnings.toLocaleString()} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month-over-Month Comparison */}
        <MonthOverMonthComparison />

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAgents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalAmount" fill="hsl(var(--primary))" name="Amount (UGX)" />
                  <Bar dataKey="earnings" fill="hsl(var(--accent))" name="Earnings (UGX)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending", value: pendingWithdrawals },
                      { name: "Processed", value: withdrawalRequests - pendingWithdrawals },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
