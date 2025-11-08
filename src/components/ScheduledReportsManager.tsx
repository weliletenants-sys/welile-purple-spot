import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Play, Trash2, Clock } from "lucide-react";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import { exportToPDF, exportToCSV } from "@/components/DashboardExport";

export const ScheduledReportsManager = () => {
  const { schedules, isLoading, toggleSchedule, createSchedule, deleteSchedule, generateNow } = useScheduledReports();
  const { data: recentReports } = useReports();

  const reportTypes: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

  const getScheduleInfo = (type: 'daily' | 'weekly' | 'monthly') => {
    return schedules?.find(s => s.report_type === type);
  };

  const handleExportReport = (report: any, format: 'pdf' | 'csv') => {
    const exportData = {
      title: `${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report - ${report.report_date}`,
      stats: [
        { label: 'Total Tenants', value: report.data.totalTenants },
        { label: 'Total Payments', value: `UGX ${report.data.totalPayments.toLocaleString()}` },
        { label: 'Total Withdrawals', value: `UGX ${report.data.totalWithdrawals.toLocaleString()}` },
        { label: 'Pending Withdrawals', value: report.data.pendingWithdrawals },
        { label: 'Period', value: `${report.data.period.startDate} to ${report.data.period.endDate}` },
      ],
      timestamp: report.data.generatedAt,
    };

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToCSV(exportData);
    }
  };

  const getScheduleDescription = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Generated every day at midnight';
      case 'weekly':
        return 'Generated every Monday at midnight';
      case 'monthly':
        return 'Generated on the 1st of each month';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Report Schedules</CardTitle>
          <CardDescription>
            Configure automatic report generation and access generated reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportTypes.map((type) => {
            const schedule = getScheduleInfo(type);
            const exists = !!schedule;

            return (
              <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium capitalize">{type} Reports</h4>
                    {exists && (
                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                        {schedule.is_active ? "Active" : "Paused"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getScheduleDescription(type)}
                  </p>
                  {schedule?.last_generated_at && (
                    <p className="text-xs text-muted-foreground">
                      Last generated: {format(new Date(schedule.last_generated_at), 'PPp')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {exists ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateNow.mutate(type)}
                        disabled={generateNow.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Generate Now
                      </Button>
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) =>
                          toggleSchedule.mutate({ id: schedule.id, is_active: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSchedule.mutate(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => createSchedule.mutate(type)}
                      disabled={createSchedule.isPending}
                    >
                      Enable Schedule
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            View and download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports?.slice(0, 15).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium capitalize">{report.report_type} Report</h4>
                    <Badge variant="outline">{report.report_date}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <span>{report.data.totalTenants} tenants</span>
                    <span>UGX {report.data.totalPayments.toLocaleString()} payments</span>
                    <span>UGX {report.data.totalWithdrawals.toLocaleString()} withdrawals</span>
                    <span>{report.data.pendingWithdrawals} pending</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated: {format(new Date(report.created_at), 'PPp')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportReport(report, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportReport(report, 'csv')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
            ))}
            {(!recentReports || recentReports.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No reports generated yet. Enable a schedule or generate one manually above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};