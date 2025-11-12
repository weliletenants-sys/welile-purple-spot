import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackToHome } from "@/components/BackToHome";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MissedPaymentTenant {
  id: string;
  name: string;
  contact: string;
  address: string;
  agent_name: string;
  agent_phone: string;
  rent_amount: number;
  missedDays: number;
}

const MissedPayments = () => {
  const navigate = useNavigate();

  // Keyboard shortcut: Escape to go home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const { data: missedTenants, isLoading } = useQuery({
    queryKey: ["missed-payments"],
    queryFn: async () => {
      // Get all active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, contact, address, agent_name, agent_phone, rent_amount, status")
        .eq("status", "active");

      if (tenantsError) throw tenantsError;
      if (!tenants || tenants.length === 0) return [];

      // Calculate date range (last 7 days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      // Get all payments for all tenants in ONE query
      const { data: allPayments, error: paymentsError } = await supabase
        .from("daily_payments")
        .select("tenant_id, date, paid")
        .in("tenant_id", tenants.map(t => t.id))
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Group payments by tenant_id
      const paymentsByTenant = (allPayments || []).reduce((acc, payment) => {
        if (!acc[payment.tenant_id]) acc[payment.tenant_id] = [];
        acc[payment.tenant_id].push(payment);
        return acc;
      }, {} as Record<string, typeof allPayments>);

      const tenantsWithMissedPayments: MissedPaymentTenant[] = [];

      for (const tenant of tenants) {
        const payments = paymentsByTenant[tenant.id] || [];
        
        // Count consecutive missed days from most recent
        let consecutiveMissedDays = 0;

        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split("T")[0];

          const payment = payments.find(p => p.date === dateStr);
          
          if (!payment || !payment.paid) {
            consecutiveMissedDays++;
          } else {
            break;
          }
        }

        // If missed 2 or more consecutive days, add to list
        if (consecutiveMissedDays >= 2) {
          tenantsWithMissedPayments.push({
            id: tenant.id,
            name: tenant.name,
            contact: tenant.contact,
            address: tenant.address,
            agent_name: tenant.agent_name,
            agent_phone: tenant.agent_phone,
            rent_amount: tenant.rent_amount,
            missedDays: consecutiveMissedDays,
          });
        }
      }

      return tenantsWithMissedPayments.sort((a, b) => b.missedDays - a.missedDays);
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <BackToHome />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-8 h-8" />
                  Missed Payments Alert
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Tenants who missed 2+ consecutive days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-destructive/10 border-2 border-destructive">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <span className="font-bold text-2xl text-destructive">
                {missedTenants?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive"></div>
          </div>
        )}

        {!isLoading && (!missedTenants || missedTenants.length === 0) && (
          <div className="text-center py-16">
            <AlertTriangle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Great News! 🎉
            </h3>
            <p className="text-muted-foreground">
              No tenants have missed 2 or more consecutive payments
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missedTenants?.map((tenant) => (
            <Card
              key={tenant.id}
              className="p-6 bg-gradient-to-br from-destructive/5 to-destructive/10 border-2 border-destructive hover:shadow-xl transition-all cursor-pointer"
              onClick={() => navigate(`/tenant/${tenant.id}`)}
            >
              {/* Alert Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive">
                  <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
                  <span className="font-bold text-destructive-foreground text-lg">
                    {tenant.missedDays} Days Missed
                  </span>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {tenant.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{tenant.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{tenant.address}</span>
                  </div>
                </div>

                {/* Rent Amount */}
                <div className="p-3 bg-card rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Rent Amount</div>
                  <div className="text-xl font-bold text-foreground">
                    UGX {tenant.rent_amount.toLocaleString()}
                  </div>
                </div>

                {/* Agent Info - PROMINENT */}
                <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border-2 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <div className="text-xs font-semibold text-primary">
                      RESPONSIBLE AGENT
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {tenant.agent_name}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-semibold">{tenant.agent_phone}</span>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <Button
                className="w-full mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tenant/${tenant.id}`);
                }}
              >
                VIEW PAYMENT DETAILS
              </Button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MissedPayments;
