import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Calendar as CalendarIcon, Filter, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--secondary))"];

const MonthlySummary = () => {
  const navigate = useNavigate();
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

      // Get payments (filtered by agent if selected)
      let paymentsQuery = supabase
        .from("daily_payments")
        .select("paid_amount, recorded_by")
        .eq("paid", true);

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

      // Get withdrawals
      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("status");

      setWithdrawalRequests(withdrawals?.length || 0);
      setPendingWithdrawals(withdrawals?.filter((w) => w.status === "pending").length || 0);
    };

    fetchData();
  }, [selectedAgent]);

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
    
    doc.setFontSize(20);
    doc.setTextColor(126, 58, 242);
    doc.text("Monthly Summary Report", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const statsData = [
      ["Total Tenants", totalTenants.toString()],
      ["Total Payments", `UGX ${totalPayments.toLocaleString()}`],
      ["Withdrawal Requests", `${withdrawalRequests} (${pendingWithdrawals} pending)`],
    ];

    autoTable(doc, {
      startY: 30,
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

    doc.save(`Monthly-Summary-${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
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
          
          <div className="flex gap-2">
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
