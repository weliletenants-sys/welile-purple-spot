import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Play, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";

export const ReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [date, setDate] = useState<DateRange | undefined>();
  const [lastGeneratedReport, setLastGeneratedReport] = useState<any>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-reports', {
        body: { reportType }
      });

      if (error) throw error;

      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
      setLastGeneratedReport(data.data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomReport = async () => {
    if (!date?.from || !date?.to) {
      toast.error('Please select a date range');
      return;
    }

    setIsGenerating(true);
    try {
      const startDate = format(date.from, 'yyyy-MM-dd');
      const endDate = format(date.to, 'yyyy-MM-dd');

      // Fetch data for custom date range
      const { data: tenants } = await supabase.from('tenants').select('*');
      
      const { data: payments } = await supabase
        .from('daily_payments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate statistics
      const totalTenants = tenants?.length || 0;
      const totalPayments = payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;

      // Agent performance
      const agentStats: Record<string, number> = {};
      for (const payment of payments || []) {
        const tenant = tenants?.find(t => t.id === payment.tenant_id);
        if (tenant?.agent_name) {
          agentStats[tenant.agent_name] = (agentStats[tenant.agent_name] || 0) + (Number(payment.paid_amount) || 0);
        }
      }

      const topAgents = Object.entries(agentStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, amount]) => ({ name, amount }));

      const customReport = {
        period: { startDate, endDate },
        totalTenants,
        totalPayments,
        totalWithdrawals,
        pendingWithdrawals,
        topAgents,
        generatedAt: new Date().toISOString()
      };

      setLastGeneratedReport(customReport);
      toast.success('Custom report generated!');
    } catch (error) {
      console.error('Error generating custom report:', error);
      toast.error('Failed to generate custom report');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!lastGeneratedReport) {
      toast.error('Generate a report first');
      return;
    }

    const csvData = [
      ['Metric', 'Value'],
      ['Report Period', `${lastGeneratedReport.period.startDate} to ${lastGeneratedReport.period.endDate}`],
      ['Total Tenants', lastGeneratedReport.totalTenants],
      ['Total Payments', `UGX ${lastGeneratedReport.totalPayments.toLocaleString()}`],
      ['Total Withdrawals', `UGX ${lastGeneratedReport.totalWithdrawals.toLocaleString()}`],
      ['Pending Withdrawals', lastGeneratedReport.pendingWithdrawals],
      [''],
      ['Top Agents'],
      ['Rank', 'Agent Name', 'Amount (UGX)'],
      ...lastGeneratedReport.topAgents.map((agent: any, idx: number) => [
        idx + 1,
        agent.name,
        agent.amount.toLocaleString()
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Custom-Report-${Date.now()}.csv`);
    toast.success('CSV exported successfully');
  };

  const exportToJSON = () => {
    if (!lastGeneratedReport) {
      toast.error('Generate a report first');
      return;
    }

    const blob = new Blob([JSON.stringify(lastGeneratedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Custom-Report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Quick Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Generation</CardTitle>
          <CardDescription>Generate standard reports instantly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={generateReport} disabled={isGenerating}>
              <Play className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>Build reports with custom date ranges and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={generateCustomReport} disabled={isGenerating}>
              <Play className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Custom Report'}
            </Button>
          </div>

          {lastGeneratedReport && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-semibold">Report Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tenants</p>
                  <p className="font-bold">{lastGeneratedReport.totalTenants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payments</p>
                  <p className="font-bold">UGX {lastGeneratedReport.totalPayments.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Withdrawals</p>
                  <p className="font-bold">UGX {lastGeneratedReport.totalWithdrawals.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-bold">{lastGeneratedReport.pendingWithdrawals}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={exportToJSON} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
