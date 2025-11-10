import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WelileLogo } from "@/components/WelileLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Building2, Phone, MapPin, DollarSign, TrendingUp, Users, Calendar, CheckCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

export default function LandlordProfile() {
  const navigate = useNavigate();
  const { landlordContact } = useParams<{ landlordContact: string }>();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6); // months

  // Fetch landlord's tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ["landlord-tenants", landlordContact],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("landlord_contact", landlordContact);

      if (error) throw error;
      return data || [];
    },
    enabled: !!landlordContact,
  });

  // Fetch payment history for all tenants
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["landlord-payments", landlordContact, selectedPeriod],
    queryFn: async () => {
      if (!tenants || tenants.length === 0) return [];

      const tenantIds = tenants.map((t) => t.id);
      const startDate = format(
        startOfMonth(subMonths(new Date(), selectedPeriod)),
        "yyyy-MM-dd"
      );

      const { data, error } = await supabase
        .from("daily_payments")
        .select("*")
        .in("tenant_id", tenantIds)
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenants && tenants.length > 0,
  });

  // Calculate landlord data
  const landlordData = useMemo(() => {
    if (!tenants || tenants.length === 0) return null;

    const landlord = tenants[0];
    const totalProperties = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === "active").length;
    const pipelineTenants = tenants.filter((t) => t.status === "pipeline").length;
    const pendingTenants = tenants.filter((t) => t.status === "pending").length;
    const atRiskTenants = tenants.filter((t) => t.status === "overdue" || t.status === "review").length;
    const totalMonthlyRent = tenants.reduce((sum, t) => sum + Number(t.rent_amount || 0), 0);
    const serviceCenters = [...new Set(tenants.map((t) => t.service_center).filter(Boolean))];

    return {
      landlordName: landlord.landlord,
      landlordContact: landlord.landlord_contact,
      totalProperties,
      activeTenants,
      pipelineTenants,
      pendingTenants,
      atRiskTenants,
      totalMonthlyRent,
      serviceCenters,
    };
  }, [tenants]);

  // Calculate collection trends
  const collectionTrends = useMemo(() => {
    if (!payments || !tenants) return [];

    // Group payments by month
    const monthlyData = new Map<string, { expected: number; collected: number }>();

    // Calculate expected rent per month based on tenants' rent amounts
    const now = new Date();
    for (let i = 0; i < selectedPeriod; i++) {
      const month = format(subMonths(now, i), "MMM yyyy");
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      // Get tenants that existed in this month
      const monthTenants = tenants.filter((t) => {
        const createdAt = new Date(t.created_at);
        return createdAt <= monthEnd;
      });

      const expectedRent = monthTenants.reduce((sum, t) => sum + Number(t.rent_amount || 0), 0);

      monthlyData.set(month, { expected: expectedRent, collected: 0 });
    }

    // Sum up collected payments by month
    payments.forEach((payment) => {
      if (payment.paid && payment.paid_amount) {
        const month = format(new Date(payment.date), "MMM yyyy");
        const data = monthlyData.get(month);
        if (data) {
          data.collected += Number(payment.paid_amount);
        }
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        expected: data.expected,
        collected: data.collected,
        collectionRate: data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0,
      }))
      .reverse();
  }, [payments, tenants, selectedPeriod]);

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        totalExpected: 0,
        totalCollected: 0,
        collectionRate: 0,
        onTimePayments: 0,
        latePayments: 0,
        missedPayments: 0,
      };
    }

    const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalCollected = payments
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const onTimePayments = payments.filter((p) => p.paid && new Date(p.recorded_at || p.date) <= new Date(p.date)).length;
    const latePayments = payments.filter((p) => p.paid && new Date(p.recorded_at || p.date) > new Date(p.date)).length;
    const missedPayments = payments.filter((p) => !p.paid).length;

    return {
      totalExpected,
      totalCollected,
      collectionRate,
      onTimePayments,
      latePayments,
      missedPayments,
    };
  }, [payments]);

  // Property performance by tenant
  const propertyPerformance = useMemo(() => {
    if (!tenants || !payments) return [];

    return tenants.map((tenant) => {
      const tenantPayments = payments.filter((p) => p.tenant_id === tenant.id);
      const expected = tenantPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const collected = tenantPayments
        .filter((p) => p.paid)
        .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
      const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

      return {
        tenantName: tenant.name,
        address: tenant.address,
        status: tenant.status,
        rentAmount: Number(tenant.rent_amount || 0),
        expected,
        collected,
        collectionRate,
        serviceCenter: tenant.service_center || "N/A",
      };
    }).sort((a, b) => b.collectionRate - a.collectionRate);
  }, [tenants, payments]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    if (!tenants) return [];

    const statusCounts = {
      active: tenants.filter((t) => t.status === "active").length,
      pending: tenants.filter((t) => t.status === "pending").length,
      pipeline: tenants.filter((t) => t.status === "pipeline").length,
      atRisk: tenants.filter((t) => t.status === "overdue" || t.status === "review").length,
    };

    return [
      { name: "Active", value: statusCounts.active, color: "#10b981" },
      { name: "Pending", value: statusCounts.pending, color: "#6b7280" },
      { name: "Pipeline", value: statusCounts.pipeline, color: "#3b82f6" },
      { name: "At Risk", value: statusCounts.atRisk, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  }, [tenants]);

  const handleExport = () => {
    if (!landlordData || !propertyPerformance) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Landlord Profile Report"],
      ["Generated on:", new Date().toLocaleString()],
      [""],
      ["Landlord Name", landlordData.landlordName],
      ["Contact", landlordData.landlordContact],
      ["Total Properties", landlordData.totalProperties],
      ["Active Tenants", landlordData.activeTenants],
      ["Total Monthly Rent", `UGX ${landlordData.totalMonthlyRent.toLocaleString()}`],
      ["Collection Rate", `${paymentStats.collectionRate}%`],
      ["Total Collected", `UGX ${paymentStats.totalCollected.toLocaleString()}`],
      ["Service Centers", landlordData.serviceCenters.join(", ")],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Property performance sheet
    const performanceWs = XLSX.utils.json_to_sheet(
      propertyPerformance.map((p) => ({
        "Tenant Name": p.tenantName,
        Address: p.address,
        Status: p.status,
        "Monthly Rent": p.rentAmount,
        "Total Expected": p.expected,
        "Total Collected": p.collected,
        "Collection Rate": `${p.collectionRate}%`,
        "Service Center": p.serviceCenter,
      }))
    );
    XLSX.utils.book_append_sheet(wb, performanceWs, "Property Performance");

    // Collection trends sheet
    const trendsWs = XLSX.utils.json_to_sheet(
      collectionTrends.map((t) => ({
        Month: t.month,
        "Expected Rent": t.expected,
        "Collected Rent": t.collected,
        "Collection Rate": `${t.collectionRate}%`,
      }))
    );
    XLSX.utils.book_append_sheet(wb, trendsWs, "Collection Trends");

    XLSX.writeFile(wb, `Landlord_${landlordData.landlordName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  if (tenantsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!landlordData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" size="icon" onClick={() => navigate("/landlord-management")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Landlord Not Found</h2>
            <p className="text-muted-foreground">No landlord found with this contact number.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/landlord-management")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <WelileLogo />
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-8 w-8 text-primary" />
                  {landlordData.landlordName}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {landlordData.landlordContact}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{landlordData.totalProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {landlordData.activeTenants} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Monthly Rent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                UGX {landlordData.totalMonthlyRent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Expected per month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.collectionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last {selectedPeriod} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                Service Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{landlordData.serviceCenters.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {landlordData.serviceCenters.slice(0, 2).join(", ")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Collection Trends</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Status Distribution</CardTitle>
                  <CardDescription>Current status of all properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Statistics</CardTitle>
                  <CardDescription>Last {selectedPeriod} months</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">On-Time Payments</span>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {paymentStats.onTimePayments}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Late Payments</span>
                    </div>
                    <Badge variant="secondary">{paymentStats.latePayments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Missed Payments</span>
                    </div>
                    <Badge variant="destructive">{paymentStats.missedPayments}</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Total Collected</span>
                      <span className="text-sm font-bold">
                        UGX {paymentStats.totalCollected.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="text-sm">Expected</span>
                      <span className="text-sm">
                        UGX {paymentStats.totalExpected.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collection Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Trends</CardTitle>
                <CardDescription>
                  Expected vs collected rent over time
                  <div className="flex gap-2 mt-2">
                    {[3, 6, 12].map((months) => (
                      <Button
                        key={months}
                        variant={selectedPeriod === months ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPeriod(months)}
                      >
                        {months} months
                      </Button>
                    ))}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={collectionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Expected Rent"
                    />
                    <Line
                      type="monotone"
                      dataKey="collected"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Collected Rent"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Collection Rate by Month</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={collectionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="collectionRate" fill="#8b5cf6" name="Collection Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>
                  Collection rates for each property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Monthly Rent</TableHead>
                        <TableHead className="text-right">Total Expected</TableHead>
                        <TableHead className="text-right">Total Collected</TableHead>
                        <TableHead className="text-center">Collection Rate</TableHead>
                        <TableHead>Service Center</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {propertyPerformance.map((property, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{property.tenantName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {property.address}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                property.status === "active"
                                  ? "default"
                                  : property.status === "pipeline"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {property.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            UGX {property.rentAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            UGX {property.expected.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            UGX {property.collected.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                property.collectionRate >= 80
                                  ? "default"
                                  : property.collectionRate >= 50
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {property.collectionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{property.serviceCenter}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payment History</CardTitle>
                <CardDescription>
                  Last 50 payment records across all properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <Skeleton className="h-96" />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead className="text-right">Amount Due</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recorded By</TableHead>
                          <TableHead>Recorded At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments && payments.length > 0 ? (
                          payments.slice(0, 50).map((payment) => {
                            const tenant = tenants?.find((t) => t.id === payment.tenant_id);
                            return (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {format(new Date(payment.date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {tenant?.name || "Unknown"}
                                </TableCell>
                                <TableCell className="text-right">
                                  UGX {Number(payment.amount || 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {payment.paid
                                    ? `UGX ${Number(payment.paid_amount || 0).toLocaleString()}`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={payment.paid ? "default" : "destructive"}
                                  >
                                    {payment.paid ? "Paid" : "Unpaid"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {payment.recorded_by || "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {payment.recorded_at
                                    ? format(new Date(payment.recorded_at), "MMM dd, HH:mm")
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              No payment history available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
