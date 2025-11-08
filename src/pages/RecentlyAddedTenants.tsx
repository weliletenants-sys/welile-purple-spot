import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import { ArrowLeft, UserPlus, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";

export default function RecentlyAddedTenants() {
  const oneWeekAgo = subDays(new Date(), 7);

  const { data: recentTenants, isLoading } = useQuery({
    queryKey: ["recently-added-tenants"],
    queryFn: async () => {
      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .gte("created_at", oneWeekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch payment data for each tenant
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          const { data: payments } = await supabase
            .from("daily_payments")
            .select("*")
            .eq("tenant_id", tenant.id)
            .gte("date", format(parseISO(tenant.created_at), "yyyy-MM-dd"))
            .lte("date", format(new Date(), "yyyy-MM-dd"));

          const totalDue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          const totalPaid = payments?.filter(p => p.paid).reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;
          const paidCount = payments?.filter(p => p.paid).length || 0;
          const totalCount = payments?.length || 0;

          return {
            ...tenant,
            totalDue,
            totalPaid,
            paidCount,
            totalCount,
            collectionRate: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
          };
        })
      );

      return tenantsWithStats;
    },
  });

  const totalStats = {
    totalTenants: recentTenants?.length || 0,
    totalExpected: recentTenants?.reduce((sum, t) => sum + t.totalDue, 0) || 0,
    totalCollected: recentTenants?.reduce((sum, t) => sum + t.totalPaid, 0) || 0,
    avgCollectionRate: recentTenants?.length 
      ? recentTenants.reduce((sum, t) => sum + t.collectionRate, 0) / recentTenants.length 
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Recently Added Tenants</h1>
              <p className="text-muted-foreground">New tenants from the last 7 days</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="New Tenants"
            value={totalStats.totalTenants}
            icon={UserPlus}
            description="Added this week"
          />
          <StatsCard
            title="Expected Amount"
            value={`UGX ${totalStats.totalExpected.toLocaleString()}`}
            icon={DollarSign}
            description="Total due this week"
          />
          <StatsCard
            title="Collected"
            value={`UGX ${totalStats.totalCollected.toLocaleString()}`}
            icon={CheckCircle}
            description="Total collected"
          />
          <StatsCard
            title="Avg Collection Rate"
            value={`${totalStats.avgCollectionRate.toFixed(1)}%`}
            icon={TrendingUp}
            description="Performance metric"
          />
        </div>

        {/* Tenants List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Individual Tenant Stats</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading tenants...</p>
            </div>
          ) : recentTenants && recentTenants.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentTenants.map((tenant) => (
                <Card key={tenant.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.contact}</p>
                        <p className="text-sm text-muted-foreground">{tenant.address}</p>
                      </div>
                      <Link to={`/tenant/${tenant.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Added {format(parseISO(tenant.created_at), "MMM dd, yyyy")}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Agent</p>
                        <p className="text-sm font-medium text-foreground">{tenant.agent_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Service Center</p>
                        <p className="text-sm font-medium text-foreground">{tenant.service_center || "N/A"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <p className="text-sm font-semibold text-foreground">
                          {tenant.totalDue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Collected</p>
                        <p className="text-sm font-semibold text-primary">
                          {tenant.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="text-sm font-semibold text-accent">
                          {tenant.collectionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {tenant.paidCount} of {tenant.totalCount} payments
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tenant.collectionRate >= 80 
                          ? "bg-primary/10 text-primary" 
                          : tenant.collectionRate >= 50
                          ? "bg-accent/10 text-accent"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {tenant.collectionRate >= 80 ? "Excellent" : tenant.collectionRate >= 50 ? "Good" : "Needs Attention"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No tenants added in the last 7 days</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
