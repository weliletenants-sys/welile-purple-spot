import { Card } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Users, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const ReportsSection = () => {
  const { data: dailyReports, isLoading: loadingDaily } = useReports('daily');
  const { data: weeklyReports, isLoading: loadingWeekly } = useReports('weekly');
  const { data: monthlyReports, isLoading: loadingMonthly } = useReports('monthly');

  const exportReportToCSV = (report: any) => {
    const csvData = [
      ['Metric', 'Value'],
      ['Report Type', report.report_type],
      ['Report Date', format(new Date(report.report_date), 'MMM dd, yyyy')],
      ['Period', `${report.data.period.startDate} to ${report.data.period.endDate}`],
      ['Total Tenants', report.data.totalTenants],
      ['Total Payments', `UGX ${report.data.totalPayments.toLocaleString()}`],
      ['Total Withdrawals', `UGX ${report.data.totalWithdrawals.toLocaleString()}`],
      ['Pending Withdrawals', report.data.pendingWithdrawals],
      [''],
      ['Top Agents'],
      ['Rank', 'Agent Name', 'Amount (UGX)'],
      ...report.data.topAgents.map((agent: any, idx: number) => [
        idx + 1,
        agent.name,
        agent.amount.toLocaleString()
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${report.report_type}-Report-${report.report_date}.csv`);
    toast.success('CSV exported successfully');
  };

  const exportReportToJSON = (report: any) => {
    const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_type}-Report-${report.report_date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  const renderReportCard = (report: any) => (
    <Card key={report.id} className="p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {format(new Date(report.report_date), 'MMM dd, yyyy')}
          </span>
        </div>
        <Badge variant="outline">{report.report_type}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Tenants</p>
            <p className="font-semibold">{report.data.totalTenants}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs text-muted-foreground">Payments</p>
            <p className="font-semibold">UGX {report.data.totalPayments.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-muted-foreground">Withdrawals</p>
            <p className="font-semibold">UGX {report.data.totalWithdrawals.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-600" />
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold">{report.data.pendingWithdrawals}</p>
          </div>
        </div>
      </div>

      {report.data.topAgents && report.data.topAgents.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Top Agents</p>
          <div className="space-y-1">
            {report.data.topAgents.slice(0, 3).map((agent: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>{agent.name}</span>
                <span className="font-medium">UGX {agent.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t flex gap-2">
        <Button onClick={() => exportReportToCSV(report)} variant="outline" size="sm" className="flex-1">
          <Download className="h-3 w-3 mr-1" />
          CSV
        </Button>
        <Button onClick={() => exportReportToJSON(report)} variant="outline" size="sm" className="flex-1">
          <Download className="h-3 w-3 mr-1" />
          JSON
        </Button>
      </div>
    </Card>
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Automated Reports</h2>
      
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          {loadingDaily ? (
            <Skeleton className="h-32 w-full" />
          ) : dailyReports && dailyReports.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {dailyReports.map(renderReportCard)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No daily reports available yet
            </p>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          {loadingWeekly ? (
            <Skeleton className="h-32 w-full" />
          ) : weeklyReports && weeklyReports.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {weeklyReports.map(renderReportCard)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No weekly reports available yet
            </p>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          {loadingMonthly ? (
            <Skeleton className="h-32 w-full" />
          ) : monthlyReports && monthlyReports.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {monthlyReports.map(renderReportCard)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No monthly reports available yet
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
