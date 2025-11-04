import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Play, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface AgentStats {
  agentName: string;
  paymentsRecorded: number;
  totalAmount: number;
  earnings: number;
  tenantsManaged: number;
}

export const MultiAgentComparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [agentsData, setAgentsData] = useState<AgentStats[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data: tenants } = await supabase
          .from('tenants')
          .select('agent_name')
          .not('agent_name', 'is', null);
        
        const uniqueAgents = Array.from(new Set(tenants?.map(t => t.agent_name).filter(Boolean) || [])) as string[];
        setAgents(uniqueAgents.sort());
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  const toggleAgent = (agentName: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentName) 
        ? prev.filter(a => a !== agentName)
        : [...prev, agentName]
    );
  };

  const compareAgents = async () => {
    if (selectedAgents.length < 2) {
      toast.error('Please select at least 2 agents');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    setIsComparing(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const statsPromises = selectedAgents.map(async (agentName) => {
        // Fetch agent's tenants
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('agent_name', agentName);

        const tenantIds = tenants?.map(t => t.id) || [];

        // Fetch payments
        const { data: payments } = await supabase
          .from('daily_payments')
          .select('*')
          .in('tenant_id', tenantIds)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('recorded_by', agentName);

        // Fetch earnings
        const { data: earnings } = await supabase
          .from('agent_earnings')
          .select('amount')
          .eq('agent_name', agentName)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        return {
          agentName,
          paymentsRecorded: payments?.length || 0,
          totalAmount: payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
          earnings: earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
          tenantsManaged: tenants?.length || 0
        };
      });

      const results = await Promise.all(statsPromises);
      setAgentsData(results);
      toast.success('Comparison generated successfully!');
    } catch (error) {
      console.error('Error comparing agents:', error);
      toast.error('Failed to generate comparison');
    } finally {
      setIsComparing(false);
    }
  };

  // Prepare chart data
  const barChartData = agentsData.map(agent => ({
    name: agent.agentName,
    'Payments': agent.paymentsRecorded,
    'Amount (K)': Math.round(agent.totalAmount / 1000),
    'Earnings (K)': Math.round(agent.earnings / 1000)
  }));

  // Prepare radar chart data (normalized to 0-100 scale)
  const maxValues = {
    payments: Math.max(...agentsData.map(a => a.paymentsRecorded), 1),
    amount: Math.max(...agentsData.map(a => a.totalAmount), 1),
    earnings: Math.max(...agentsData.map(a => a.earnings), 1),
    tenants: Math.max(...agentsData.map(a => a.tenantsManaged), 1)
  };

  const radarData = [
    {
      metric: 'Payments',
      ...Object.fromEntries(
        agentsData.map(a => [
          a.agentName,
          Math.round((a.paymentsRecorded / maxValues.payments) * 100)
        ])
      )
    },
    {
      metric: 'Amount',
      ...Object.fromEntries(
        agentsData.map(a => [
          a.agentName,
          Math.round((a.totalAmount / maxValues.amount) * 100)
        ])
      )
    },
    {
      metric: 'Earnings',
      ...Object.fromEntries(
        agentsData.map(a => [
          a.agentName,
          Math.round((a.earnings / maxValues.earnings) * 100)
        ])
      )
    },
    {
      metric: 'Tenants',
      ...Object.fromEntries(
        agentsData.map(a => [
          a.agentName,
          Math.round((a.tenantsManaged / maxValues.tenants) * 100)
        ])
      )
    }
  ];

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Agent Comparison
          </CardTitle>
          <CardDescription>Compare multiple agents simultaneously</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
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
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Agent Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Agents (minimum 2)</label>
            {loadingAgents ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                {agents.map((agent) => (
                  <div key={agent} className="flex items-center space-x-2">
                    <Checkbox
                      id={agent}
                      checked={selectedAgents.includes(agent)}
                      onCheckedChange={() => toggleAgent(agent)}
                    />
                    <label
                      htmlFor={agent}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {agent}
                    </label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          <Button onClick={compareAgents} disabled={isComparing || selectedAgents.length < 2} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isComparing ? 'Comparing...' : 'Compare Agents'}
          </Button>
        </CardContent>
      </Card>

      {agentsData.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentsData.map((agent, index) => (
              <Card key={agent.agentName} className="border-2" style={{ borderColor: colors[index % colors.length] }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm truncate">{agent.agentName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Payments</p>
                    <p className="text-xl font-bold">{agent.paymentsRecorded}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-sm font-semibold">UGX {agent.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="text-sm font-semibold">UGX {agent.earnings.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tenants</p>
                    <p className="text-sm font-semibold">{agent.tenantsManaged}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Payments" fill={colors[0]} />
                  <Bar dataKey="Amount (K)" fill={colors[1]} />
                  <Bar dataKey="Earnings (K)" fill={colors[2]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar</CardTitle>
              <CardDescription>Normalized comparison across all metrics (0-100 scale)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {agentsData.map((agent, index) => (
                    <Radar
                      key={agent.agentName}
                      name={agent.agentName}
                      dataKey={agent.agentName}
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
