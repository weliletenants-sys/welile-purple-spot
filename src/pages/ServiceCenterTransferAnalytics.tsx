import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransferAnalytics } from "@/hooks/useTransferAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, TrendingUp, ArrowLeftRight, Users, UserCheck, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function ServiceCenterTransferAnalytics() {
  const [monthsBack, setMonthsBack] = useState(6);
  const { data: analytics, isLoading } = useTransferAnalytics(monthsBack);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const percentageChange = analytics.lastMonthTransfers > 0
    ? ((analytics.thisMonthTransfers - analytics.lastMonthTransfers) / analytics.lastMonthTransfers) * 100
    : 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Center Transfer Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track tenant migrations and transfer patterns across service centers
          </p>
        </div>
        <Select value={monthsBack.toString()} onValueChange={(v) => setMonthsBack(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransfers}</div>
            <p className="text-xs text-muted-foreground">
              Last {monthsBack} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonthTransfers}</div>
            <div className="flex items-center text-xs">
              {percentageChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={percentageChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(percentageChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Patterns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.migrationPatterns.length}</div>
            <p className="text-xs text-muted-foreground">
              Migration routes identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Trends</CardTitle>
          <CardDescription>Monthly transfer volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertDescription>No transfer data available for the selected period.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Transfer Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Top Transfer Reasons</CardTitle>
            <CardDescription>Most common reasons for tenant transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topReasons.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.topReasons.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ reason, percentage }) => `${reason.substring(0, 15)}... (${percentage.toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.topReasons.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.topReasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-foreground">{reason.reason}</span>
                      </div>
                      <Badge variant="outline">
                        {reason.count} ({reason.percentage.toFixed(1)}%)
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>No transfer reasons recorded yet.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Migration Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Patterns</CardTitle>
            <CardDescription>Most common transfer routes between centers</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.migrationPatterns.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.migrationPatterns.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="from" 
                    type="category" 
                    width={100}
                    className="text-xs"
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name, props) => [
                      `${value} transfers`,
                      `${props.payload.from} → ${props.payload.to}`
                    ]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert>
                <AlertDescription>No migration patterns identified yet.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Transferred Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Frequently Transferred Tenants
            </CardTitle>
            <CardDescription>Tenants with multiple service center changes</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topTransferredTenants.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTransferredTenants.map((tenant, index) => (
                  <div 
                    key={tenant.tenantId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        #{index + 1}
                      </div>
                      <span className="font-medium text-foreground">{tenant.tenantName}</span>
                    </div>
                    <Badge variant="secondary">
                      {tenant.transferCount} transfers
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No tenants with multiple transfers found.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Most Active Recorders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Most Active Recorders
            </CardTitle>
            <CardDescription>Staff members who processed the most transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.mostActiveRecorders.length > 0 ? (
              <div className="space-y-3">
                {analytics.mostActiveRecorders.map((recorder, index) => (
                  <div 
                    key={recorder.recorder}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        #{index + 1}
                      </div>
                      <span className="font-medium text-foreground">{recorder.recorder}</span>
                    </div>
                    <Badge variant="outline">
                      {recorder.count} transfers
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No recorder data available.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
