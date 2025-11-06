import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  TrendingUp, 
  Users, 
  DollarSign,
  Building2,
  CalendarIcon,
  X,
  BarChart3
} from "lucide-react";
import { 
  useServiceCenterAnalytics, 
  useServiceCenterRegions,
  useServiceCenterDistricts 
} from "@/hooks/useServiceCenterAnalytics";
import { format, subDays, startOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PerformanceAlerts } from "@/components/PerformanceAlerts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

export default function ServiceCenterAnalytics() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: regions } = useServiceCenterRegions();
  const { data: districts } = useServiceCenterDistricts(selectedRegion);
  
  const { data: analytics, isLoading } = useServiceCenterAnalytics(
    startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    selectedRegion,
    selectedDistrict
  );

  const handlePresetDateRange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setStartDate(today);
        setEndDate(today);
        break;
      case "week":
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case "month":
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case "thisMonth":
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedRegion("");
    setSelectedDistrict("");
    setSearchQuery("");
  };

  // Filter analytics by search query
  const filteredAnalytics = analytics?.filter(stat => 
    stat.serviceCenterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stat.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stat.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalPayments = filteredAnalytics?.reduce((sum, stat) => sum + stat.totalPayments, 0) || 0;
  const totalAmount = filteredAnalytics?.reduce((sum, stat) => sum + stat.totalAmount, 0) || 0;
  const totalTenants = filteredAnalytics?.reduce((sum, stat) => sum + stat.uniqueTenants, 0) || 0;
  const totalServiceCenters = filteredAnalytics?.length || 0;

  // Prepare chart data
  const topCentersData = filteredAnalytics?.slice(0, 10).map(stat => ({
    name: stat.serviceCenterName,
    amount: stat.totalAmount,
    payments: stat.totalPayments,
  }));

  const regionData = filteredAnalytics?.reduce((acc, stat) => {
    const existing = acc.find(item => item.name === stat.region);
    if (existing) {
      existing.value += stat.totalAmount;
      existing.payments += stat.totalPayments;
    } else {
      acc.push({
        name: stat.region,
        value: stat.totalAmount,
        payments: stat.totalPayments,
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; payments: number }>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  Service Center Analytics
                </h1>
                <p className="text-sm text-muted-foreground">Track performance across all locations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter analytics by date range, region, district, or search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Regions</SelectItem>
                    {regions?.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Districts</SelectItem>
                    {districts?.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handlePresetDateRange("today")}>
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={() => handlePresetDateRange("week")}>
                Last 7 Days
              </Button>
              <Button size="sm" variant="outline" onClick={() => handlePresetDateRange("month")}>
                Last 30 Days
              </Button>
              <Button size="sm" variant="outline" onClick={() => handlePresetDateRange("thisMonth")}>
                This Month
              </Button>
              {(startDate || endDate || selectedRegion || selectedDistrict) && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Service Centers</label>
              <Input
                placeholder="Search by name, district, or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Service Centers</p>
                  <p className="text-2xl font-bold">{totalServiceCenters}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{totalPayments.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">UGX {totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Tenants</p>
                  <p className="text-2xl font-bold">{totalTenants.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        <PerformanceAlerts />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Service Centers Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Service Centers by Revenue</CardTitle>
              <CardDescription>Highest performing locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCentersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#8b5cf6" name="Total Amount (UGX)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Region</CardTitle>
              <CardDescription>Distribution across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {regionData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `UGX ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Service Center Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Center Performance Details</CardTitle>
            <CardDescription>Detailed metrics for each service center</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Service Center</th>
                    <th className="text-left py-3 px-4 font-semibold">District</th>
                    <th className="text-left py-3 px-4 font-semibold">Region</th>
                    <th className="text-right py-3 px-4 font-semibold">Payments</th>
                    <th className="text-right py-3 px-4 font-semibold">Total Amount</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg Payment</th>
                    <th className="text-right py-3 px-4 font-semibold">Tenants</th>
                    <th className="text-right py-3 px-4 font-semibold">Recorders</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnalytics?.map((stat, index) => (
                    <tr key={stat.serviceCenterName} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{stat.serviceCenterName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{stat.district}</td>
                      <td className="py-3 px-4">
                        <Badge>{stat.region}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{stat.totalPayments}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        UGX {stat.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        UGX {Math.round(stat.averagePaymentAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">{stat.uniqueTenants}</td>
                      <td className="py-3 px-4 text-right">{stat.recordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAnalytics?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No service center data found for the selected filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
