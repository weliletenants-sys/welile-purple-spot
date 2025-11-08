import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Play, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";
import { useReportTemplates } from "@/hooks/useReportTemplates";

export const ReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [lastGeneratedReport, setLastGeneratedReport] = useState<any>(null);
  const { templates } = useReportTemplates();

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const body: any = { reportType };
      
      if (selectedTemplateId) {
        const template = templates?.find(t => t.id === selectedTemplateId);
        if (template) {
          body.template = {
            metrics: template.metrics,
            filters: template.filters,
            view_options: template.view_options
          };
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-reports', {
        body
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
          <CardDescription>Generate standard reports instantly with optional templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => {
                setReportType(value);
                setSelectedTemplateId(null);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template (Optional)</label>
              <Select value={selectedTemplateId || 'none'} onValueChange={(value) => setSelectedTemplateId(value === 'none' ? null : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Default (No Template)
                    </span>
                  </SelectItem>
                  {templates?.filter(t => t.report_type === reportType || t.report_type === 'custom').map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <span className="flex items-center gap-2">
                        {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                        {template.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplateId && templates?.find(t => t.id === selectedTemplateId) && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                {templates.find(t => t.id === selectedTemplateId)?.description}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {templates.find(t => t.id === selectedTemplateId)?.metrics.length} metrics
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Object.values(templates.find(t => t.id === selectedTemplateId)?.view_options || {}).filter(Boolean).length} view options
                </Badge>
              </div>
            </div>
          )}
            
          <Button onClick={generateReport} disabled={isGenerating} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
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
