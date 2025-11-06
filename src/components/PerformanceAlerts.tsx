import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, X } from "lucide-react";
import { format, subDays } from "date-fns";

interface AlertRule {
  type: "low_performance" | "milestone" | "inactivity";
  threshold: number;
  period: number; // days
}

const ALERT_RULES: AlertRule[] = [
  { type: "low_performance", threshold: 5, period: 7 }, // Less than 5 payments in 7 days
  { type: "milestone", threshold: 100, period: 30 }, // 100 payments in 30 days
  { type: "inactivity", threshold: 0, period: 3 }, // No activity in 3 days
];

interface PerformanceAlert {
  id: string;
  serviceCenterName: string;
  type: "low_performance" | "milestone" | "inactivity" | "success";
  severity: "high" | "medium" | "low";
  message: string;
  value: number;
  date: string;
}

export const PerformanceAlerts = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissedAlerts");
    if (stored) {
      try {
        setDismissedAlerts(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Error loading dismissed alerts:", e);
      }
    }
  }, []);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["performanceAlerts"],
    queryFn: async () => {
      const alerts: PerformanceAlert[] = [];
      const today = new Date();

      // Fetch service centers
      const { data: centers, error: centersError } = await supabase
        .from("service_centers")
        .select("*")
        .eq("is_active", true);

      if (centersError) throw centersError;

      // For each service center, check alert rules
      for (const center of centers || []) {
        for (const rule of ALERT_RULES) {
          const startDate = format(subDays(today, rule.period), "yyyy-MM-dd");
          
          const { data: payments, error } = await supabase
            .from("daily_payments")
            .select("*")
            .eq("service_center", center.name)
            .eq("paid", true)
            .gte("recorded_at", startDate);

          if (error) {
            console.error("Error fetching payments:", error);
            continue;
          }

          const paymentCount = payments?.length || 0;

          if (rule.type === "low_performance" && paymentCount < rule.threshold) {
            alerts.push({
              id: `${center.id}-low-${rule.period}`,
              serviceCenterName: center.name,
              type: "low_performance",
              severity: "high",
              message: `Low performance: Only ${paymentCount} payments in the last ${rule.period} days (threshold: ${rule.threshold})`,
              value: paymentCount,
              date: format(today, "yyyy-MM-dd"),
            });
          }

          if (rule.type === "milestone" && paymentCount >= rule.threshold) {
            alerts.push({
              id: `${center.id}-milestone-${rule.period}`,
              serviceCenterName: center.name,
              type: "milestone",
              severity: "low",
              message: `Milestone reached: ${paymentCount} payments in ${rule.period} days! 🎉`,
              value: paymentCount,
              date: format(today, "yyyy-MM-dd"),
            });
          }

          if (rule.type === "inactivity" && paymentCount === 0) {
            alerts.push({
              id: `${center.id}-inactive-${rule.period}`,
              serviceCenterName: center.name,
              type: "inactivity",
              severity: "medium",
              message: `No activity recorded in the last ${rule.period} days`,
              value: 0,
              date: format(today, "yyyy-MM-dd"),
            });
          }
        }
      }

      return alerts;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissedAlerts", JSON.stringify(Array.from(newDismissed)));
  };

  const handleDismissAll = () => {
    if (!alerts) return;
    const allAlertIds = alerts.map(a => a.id);
    const newDismissed = new Set([...dismissedAlerts, ...allAlertIds]);
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissedAlerts", JSON.stringify(Array.from(newDismissed)));
  };

  const visibleAlerts = alerts?.filter(alert => !dismissedAlerts.has(alert.id)) || [];

  const highSeverityCount = visibleAlerts.filter(a => a.severity === "high").length;
  const mediumSeverityCount = visibleAlerts.filter(a => a.severity === "medium").length;
  const lowSeverityCount = visibleAlerts.filter(a => a.severity === "low").length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Performance Alerts
          </CardTitle>
          <CardDescription>Real-time monitoring of service center performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">All service centers are performing well!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Performance Alerts ({visibleAlerts.length})
            </CardTitle>
            <CardDescription>Real-time monitoring of service center performance</CardDescription>
          </div>
          {visibleAlerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDismissAll}>
              Dismiss All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex gap-2 flex-wrap">
          {highSeverityCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {highSeverityCount} High
            </Badge>
          )}
          {mediumSeverityCount > 0 && (
            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              {mediumSeverityCount} Medium
            </Badge>
          )}
          {lowSeverityCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {lowSeverityCount} Success
            </Badge>
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === "high" ? "destructive" : "default"}
              className={
                alert.type === "milestone"
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : alert.severity === "medium"
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                  : ""
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.type === "low_performance" && (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {alert.type === "milestone" && (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {alert.type === "inactivity" && (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle className="mb-0">{alert.serviceCenterName}</AlertTitle>
                    <Badge variant="outline" className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <AlertDescription>{alert.message}</AlertDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    Generated: {format(new Date(alert.date), "PPp")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(alert.id)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
