import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, Plus, Trash2, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceGoal {
  id: string;
  agentName: string;
  metricType: 'payments' | 'amount' | 'earnings';
  targetValue: number;
  currentValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

export const PerformanceGoalsTracking = () => {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [selectedAgent, setSelectedAgent] = useState("");
  const [metricType, setMetricType] = useState<'payments' | 'amount' | 'earnings'>('payments');
  const [targetValue, setTargetValue] = useState("");
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    fetchGoals();
    fetchAgents();
  }, []);

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
    }
  };

  const fetchGoals = async () => {
    setLoadingGoals(true);
    try {
      // In a real app, these would be stored in a database table
      // For now, we'll calculate current values against sample goals
      const sampleGoals: PerformanceGoal[] = [
        {
          id: '1',
          agentName: 'John Doe',
          metricType: 'payments',
          targetValue: 50,
          currentValue: 0,
          period: 'monthly',
          createdAt: new Date().toISOString()
        }
      ];

      // Calculate current values for each goal
      const goalsWithData = await Promise.all(
        sampleGoals.map(async (goal) => {
          const currentValue = await calculateCurrentValue(goal);
          return { ...goal, currentValue };
        })
      );

      setGoals(goalsWithData);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const calculateCurrentValue = async (goal: PerformanceGoal): Promise<number> => {
    const now = new Date();
    let startDate: Date;

    switch (goal.period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    try {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('agent_name', goal.agentName);

      const tenantIds = tenants?.map(t => t.id) || [];

      if (goal.metricType === 'payments') {
        const { data: payments } = await supabase
          .from('daily_payments')
          .select('id')
          .in('tenant_id', tenantIds)
          .gte('date', startDate.toISOString().split('T')[0])
          .eq('recorded_by', goal.agentName);
        
        return payments?.length || 0;
      } else if (goal.metricType === 'amount') {
        const { data: payments } = await supabase
          .from('daily_payments')
          .select('paid_amount')
          .in('tenant_id', tenantIds)
          .gte('date', startDate.toISOString().split('T')[0])
          .eq('recorded_by', goal.agentName);
        
        return payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0;
      } else {
        const { data: earnings } = await supabase
          .from('agent_earnings')
          .select('amount')
          .eq('agent_name', goal.agentName)
          .gte('created_at', startDate.toISOString());
        
        return earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      }
    } catch (error) {
      console.error('Error calculating current value:', error);
      return 0;
    }
  };

  const addGoal = () => {
    if (!selectedAgent || !targetValue) {
      toast.error('Please fill in all fields');
      return;
    }

    const newGoal: PerformanceGoal = {
      id: Date.now().toString(),
      agentName: selectedAgent,
      metricType,
      targetValue: Number(targetValue),
      currentValue: 0,
      period,
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, newGoal]);
    toast.success('Goal added successfully!');
    
    // Reset form
    setSelectedAgent("");
    setTargetValue("");
    setShowAddForm(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'payments': return 'Payments';
      case 'amount': return 'Amount (UGX)';
      case 'earnings': return 'Earnings (UGX)';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Goals Tracking
              </CardTitle>
              <CardDescription>Set and track performance goals for agents</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        
        {showAddForm && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Metric Type</Label>
                  <Select value={metricType} onValueChange={(v: any) => setMetricType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payments">Payments Count</SelectItem>
                      <SelectItem value="amount">Payment Amount</SelectItem>
                      <SelectItem value="earnings">Earnings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="Enter target"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addGoal}>Add Goal</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Goals List */}
      {loadingGoals ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No goals set yet. Add your first goal to start tracking!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            const isAchieved = progress >= 100;

            return (
              <Card key={goal.id} className={cn(
                "border-2",
                isAchieved && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {goal.agentName}
                        {isAchieved && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{getMetricLabel(goal.metricType)}</Badge>
                        <Badge variant="outline">{goal.period}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={cn("font-bold", getProgressColor(progress))}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-bold">
                        {goal.metricType === 'amount' || goal.metricType === 'earnings' 
                          ? `UGX ${goal.currentValue.toLocaleString()}`
                          : goal.currentValue
                        }
                      </span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-muted-foreground">
                        {goal.metricType === 'amount' || goal.metricType === 'earnings'
                          ? `UGX ${goal.targetValue.toLocaleString()}`
                          : goal.targetValue
                        }
                      </span>
                    </span>
                    {isAchieved ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
