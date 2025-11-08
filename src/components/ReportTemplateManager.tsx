import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Copy, Star } from "lucide-react";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";

const AVAILABLE_METRICS = [
  { id: 'totalTenants', label: 'Total Tenants', category: 'Basic' },
  { id: 'activeTenants', label: 'Active Tenants', category: 'Basic' },
  { id: 'pipelineTenants', label: 'Pipeline Tenants', category: 'Basic' },
  { id: 'totalPayments', label: 'Total Payments', category: 'Financial' },
  { id: 'totalWithdrawals', label: 'Total Withdrawals', category: 'Financial' },
  { id: 'pendingWithdrawals', label: 'Pending Withdrawals', category: 'Financial' },
  { id: 'collectionRate', label: 'Collection Rate', category: 'Performance' },
  { id: 'outstandingBalance', label: 'Outstanding Balance', category: 'Financial' },
  { id: 'topAgents', label: 'Top Agents', category: 'Agents' },
  { id: 'agentEarnings', label: 'Agent Earnings', category: 'Agents' },
  { id: 'totalAgents', label: 'Total Agents', category: 'Agents' },
  { id: 'serviceCenterStats', label: 'Service Center Statistics', category: 'Operations' },
  { id: 'tenantsAtRisk', label: 'Tenants at Risk', category: 'Risk' },
  { id: 'defaultRate', label: 'Default Rate', category: 'Risk' },
];

const VIEW_OPTIONS = [
  { id: 'includeCharts', label: 'Include Charts' },
  { id: 'includeAgentBreakdown', label: 'Include Agent Breakdown' },
  { id: 'includeServiceCenterStats', label: 'Include Service Center Stats' },
  { id: 'includeTrendAnalysis', label: 'Include Trend Analysis' },
  { id: 'includeComparisons', label: 'Include Period Comparisons' },
];

export const ReportTemplateManager = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useReportTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    metrics: [] as string[],
    filters: {},
    view_options: {} as Record<string, boolean>,
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      report_type: 'daily',
      metrics: [],
      filters: {},
      view_options: {},
      is_default: false,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      report_type: template.report_type,
      metrics: template.metrics,
      filters: template.filters,
      view_options: template.view_options,
      is_default: template.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      await createTemplate.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const toggleMetric = (metricId: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const toggleViewOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      view_options: {
        ...prev.view_options,
        [optionId]: !prev.view_options[optionId]
      }
    }));
  };

  const metricsByCategory = AVAILABLE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_METRICS>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Create and manage custom report templates with specific metrics and views
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                  <DialogDescription>
                    Configure the metrics, filters, and view options for your report template
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Monthly Executive Summary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this template"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report_type">Report Type</Label>
                      <Select value={formData.report_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, report_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Metrics to Include</Label>
                      {Object.entries(metricsByCategory).map(([category, metrics]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {metrics.map((metric) => (
                              <div key={metric.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={metric.id}
                                  checked={formData.metrics.includes(metric.id)}
                                  onCheckedChange={() => toggleMetric(metric.id)}
                                />
                                <label htmlFor={metric.id} className="text-sm cursor-pointer">
                                  {metric.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>View Options</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {VIEW_OPTIONS.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={formData.view_options[option.id] || false}
                              onCheckedChange={() => toggleViewOption(option.id)}
                            />
                            <label htmlFor={option.id} className="text-sm cursor-pointer">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_default"
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
                      />
                      <label htmlFor="is_default" className="text-sm cursor-pointer font-medium">
                        Set as default template for {formData.report_type} reports
                      </label>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.name || formData.metrics.length === 0}>
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates?.map((template) => (
              <div key={template.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.is_default && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {template.report_type}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">{template.metrics.length} metrics</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {Object.values(template.view_options).filter(Boolean).length} view options
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicateTemplate.mutate(template.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this template?')) {
                        deleteTemplate.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!templates || templates.length === 0) && !isLoading && (
              <p className="text-center text-muted-foreground py-8">
                No templates created yet. Create your first template to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};