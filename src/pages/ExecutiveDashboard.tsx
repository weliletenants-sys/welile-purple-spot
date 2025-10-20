import { StatsCard } from "@/components/StatsCard";
import { WelileLogo } from "@/components/WelileLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, TrendingUp, AlertCircle, Target, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useExecutiveStats } from "@/hooks/useExecutiveStats";
import { Skeleton } from "@/components/ui/skeleton";

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const stats = useExecutiveStats();

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

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Tenants"
            value={stats.numberOfTenants}
            icon={Users}
            description="Active tenant accounts"
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
            description="UGX 5,000 per tenant"
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
            description={`UGX ${stats.totalExpectedRevenue.toLocaleString()} expected`}
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
