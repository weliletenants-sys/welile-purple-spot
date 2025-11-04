import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMonthlyReport } from "@/hooks/useMonthlyReport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MonthlySummaryReport = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );

  const { data: report, isLoading } = useMonthlyReport(selectedMonth);

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const date = new Date(selectedMonth);
    const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(126, 58, 242);
    doc.text("Monthly Summary Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(monthName, 14, 28);

    // Summary Stats
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let yPos = 40;
    
    const stats = [
      ["Total Tenants", report.totalTenants.toString()],
      ["Total Payments", `UGX ${report.totalPayments.toLocaleString()}`],
      ["Withdrawal Requests", `${report.withdrawalRequests} (${report.pendingWithdrawals} pending)`],
      ["Active Agents", report.activeAgents.toString()],
      ["Payment Rate", `${report.paymentRate}%`],
      ["Total Earnings", `UGX ${report.totalEarnings.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: stats,
      theme: "grid",
      headStyles: { fillColor: [126, 58, 242] },
      margin: { left: 14, right: 14 },
    });

    // Top Performing Agents
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(126, 58, 242);
    doc.text("Top Performing Agents", 14, yPos);

    const agentData = report.topAgents.map((agent, index) => [
      `#${index + 1}`,
      agent.name,
      agent.paymentsRecorded.toString(),
      `UGX ${agent.totalAmount.toLocaleString()}`,
      `UGX ${agent.earnings.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Rank", "Agent Name", "Payments", "Total Amount", "Earnings"]],
      body: agentData,
      theme: "striped",
      headStyles: { fillColor: [126, 58, 242] },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`Monthly-Summary-${monthName.replace(" ", "-")}.pdf`);
  };

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ value, label });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Monthly Summary Report</h1>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading report...</div>
        ) : report ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.totalTenants}</div>
                <p className="text-xs text-muted-foreground mt-1">Active tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">UGX {report.totalPayments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Collected this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.withdrawalRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">{report.pendingWithdrawals} pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.activeAgents}</div>
                <p className="text-xs text-muted-foreground mt-1">Recording payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.paymentRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">On-time payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">UGX {report.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Agent earnings</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Top Performing Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.topAgents.map((agent, index) => (
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
        ) : (
          <div className="text-center py-12 text-muted-foreground">No data available for this month</div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummaryReport;
