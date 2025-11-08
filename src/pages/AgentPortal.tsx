import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, TrendingUp, Users, DollarSign, Award, Download, Target, Trophy, History } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarningsNotifications } from "@/hooks/useEarningsNotifications";
import { EarningsNotificationDemo } from "@/components/EarningsNotificationDemo";

interface AgentStats {
  tenantsManaged: number;
  paymentsThisMonth: number;
  totalAmountThisMonth: number;
  earningsThisMonth: number;
  rank: number;
  totalAgents: number;
}

interface Certificate {
  month: string;
  rank: number;
  totalAmount: number;
}

const AgentPortal = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Enable real-time earnings notifications
  useEarningsNotifications({
    agentName,
    enabled: !!agentName,
  });

  useEffect(() => {
    // Check if agent is logged in
    const storedAgentName = sessionStorage.getItem('agentName');
    const storedAgentPhone = sessionStorage.getItem('agentPhone');

    if (!storedAgentName || !storedAgentPhone) {
      navigate('/agent-portal-login');
      return;
    }

    setAgentName(storedAgentName);
    fetchAgentData(storedAgentName);
  }, [navigate]);

  const fetchAgentData = async (name: string) => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch tenants managed by this agent
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('agent_name', name);

      const tenantIds = tenants?.map(t => t.id) || [];

      // Fetch payments this month
      const { data: payments } = await supabase
        .from('daily_payments')
        .select('*')
        .in('tenant_id', tenantIds)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('recorded_by', name);

      // Fetch earnings this month
      const { data: earnings } = await supabase
        .from('agent_earnings')
        .select('amount')
        .eq('agent_name', name)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate rank among all agents
      const { data: allPayments } = await supabase
        .from('daily_payments')
        .select('recorded_by, paid_amount')
        .gte('date', startDate)
        .lte('date', endDate);

      const agentTotals: Record<string, number> = {};
      allPayments?.forEach(p => {
        if (p.recorded_by) {
          agentTotals[p.recorded_by] = (agentTotals[p.recorded_by] || 0) + (Number(p.paid_amount) || 0);
        }
      });

      const sortedAgents = Object.entries(agentTotals)
        .sort(([, a], [, b]) => b - a);
      
      const myRank = sortedAgents.findIndex(([agent]) => agent === name) + 1;

      setStats({
        tenantsManaged: tenants?.length || 0,
        paymentsThisMonth: payments?.length || 0,
        totalAmountThisMonth: payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
        earningsThisMonth: earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        rank: myRank || 0,
        totalAgents: sortedAgents.length
      });

      // Check if agent has earned certificates (top 3 in any month)
      if (myRank <= 3) {
        setCertificates([{
          month: format(new Date(), 'MMMM yyyy'),
          rank: myRank,
          totalAmount: agentTotals[name] || 0
        }]);
      }

      // Mock goals for demo (in real app, fetch from database)
      setGoals([
        {
          title: 'Monthly Payments',
          target: 50,
          current: payments?.length || 0,
          metric: 'payments'
        },
        {
          title: 'Monthly Revenue',
          target: 5000000,
          current: payments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
          metric: 'amount'
        }
      ]);

      // Fetch payment history (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: historyData } = await supabase
        .from('agent_earnings')
        .select('*')
        .eq('agent_name', name)
        .gte('created_at', format(sixMonthsAgo, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      setPaymentHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('agentName');
    sessionStorage.removeItem('agentPhone');
    navigate('/agent-portal-login');
    toast.success('Logged out successfully');
  };

  const downloadCertificate = (cert: Certificate) => {
    toast.success('Certificate download started!');
    // In a real implementation, this would generate a PDF certificate
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Welcome, {agentName}! 👋</CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-2">
                  Your Performance Dashboard
                </CardDescription>
              </div>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {stats && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Tenants Managed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.tenantsManaged}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active tenants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Payments This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.paymentsThisMonth}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recorded payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Total Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">UGX {stats.totalAmountThisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    Your Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">UGX {stats.earningsThisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Commission earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Card */}
            <Card className={stats.rank <= 3 ? "border-2 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className={stats.rank === 1 ? "h-6 w-6 text-yellow-500" : "h-6 w-6 text-primary"} />
                  Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold">#{stats.rank}</p>
                    <p className="text-muted-foreground mt-1">out of {stats.totalAgents} agents</p>
                  </div>
                  {stats.rank <= 3 && (
                    <Badge variant="default" className="text-lg py-2 px-4">
                      Top {stats.rank === 1 ? '🥇' : stats.rank === 2 ? '🥈' : '🥉'} Performer
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Goals
                  </CardTitle>
                  <CardDescription>Track your progress towards monthly targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Demo for testing */}
                  {agentName && (
                    <EarningsNotificationDemo
                      agentName={agentName}
                      agentPhone={sessionStorage.getItem('agentPhone') || ''}
                    />
                  )}
                  
                  {goals.map((goal, index) => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {goal.metric === 'amount' 
                              ? `UGX ${goal.current.toLocaleString()}`
                              : goal.current
                            } / {goal.metric === 'amount' 
                              ? `UGX ${goal.target.toLocaleString()}`
                              : goal.target
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Your Certificates
                  </CardTitle>
                  <CardDescription>Recognition for outstanding performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {certificates.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg border-2 border-yellow-500/50"
                      >
                        <div>
                          <p className="font-bold text-lg">
                            {cert.rank === 1 ? '🥇 First Place' : cert.rank === 2 ? '🥈 Second Place' : '🥉 Third Place'}
                          </p>
                          <p className="text-sm text-muted-foreground">{cert.month}</p>
                          <p className="text-sm font-medium mt-1">
                            Total: UGX {cert.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <Button onClick={() => downloadCertificate(cert)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPortal;
