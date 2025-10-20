import { useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, TrendingUp, AlertCircle, Target, Percent, Wallet, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import { Skeleton } from "@/components/ui/skeleton";

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stats = useExecutiveStats();

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["executiveStats"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(intervalId);
  }, [queryClient]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <WelileLogo />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
                <p className="text-sm text-muted-foreground">Real-time business insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding Balance - Prominent Card */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 shadow-[0_8px_30px_rgb(126,58,242,0.15)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_12px_40px_rgb(126,58,242,0.25)]">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Outstanding Balance</p>
                <p className="text-5xl font-bold text-foreground">UGX {stats.outstandingBalance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Total remaining from {stats.numberOfTenants} tenant{stats.numberOfTenants !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-6 shadow-lg">
                <Wallet className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-6 flex gap-4 border-t border-primary/10 pt-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className="text-lg font-semibold text-foreground">UGX {stats.totalExpectedRevenue.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-semibold text-primary">UGX {stats.totalRentPaid.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="text-lg font-semibold text-accent">{stats.collectionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Tenants"
            value={stats.numberOfTenants}
            icon={Users}
            description="Active tenant accounts"
          />

          <StatsCard
            title="Total Rent Amounts"
            value={`UGX ${stats.totalRentAmounts.toLocaleString()}`}
            icon={Home}
            description="Sum of all tenant rents"
          />
          
          <StatsCard
            title="Total Access Fees"
            value={`UGX ${stats.totalAccessFees.toLocaleString()}`}
            icon={DollarSign}
            description="33% of rent amounts"
          />

          <StatsCard
            title="Total Registration Fees"
            value={`UGX ${stats.totalRegistrationFees.toLocaleString()}`}
            icon={Target}
            description="One-time per tenant"
          />

          <StatsCard
            title="Total Payments Collected"
            value={`UGX ${stats.totalRentPaid.toLocaleString()}`}
            icon={TrendingUp}
            description="All payments received"
          />

          <StatsCard
            title="Overdue Payments"
            value={`UGX ${stats.overduePayments.toLocaleString()}`}
            icon={AlertCircle}
            description="Payments past due date"
          />

          <StatsCard
            title="Collection Rate"
            value={`${stats.collectionRate}%`}
            icon={Percent}
            description="Payment completion rate"
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 Welile Tenants Hub. All rights reserved.</p>
          <p className="mt-1">Data updates in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
