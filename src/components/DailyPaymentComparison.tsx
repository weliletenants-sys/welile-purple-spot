import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyPaymentComparison } from "@/hooks/useDailyPaymentComparison";
import { format, parseISO, subDays } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const DailyPaymentComparison = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [filterStatus, setFilterStatus] = useState<"all" | "above" | "below" | "onTarget">("all");
  
  const { data: comparisons, isLoading } = useDailyPaymentComparison(dateRange);

  const filteredComparisons = comparisons?.filter(day => {
    if (filterStatus === "all") return true;
    if (filterStatus === "above") return day.percentageOfExpected > 100;
    if (filterStatus === "below") return day.percentageOfExpected < 100 && day.percentageOfExpected > 0;
    if (filterStatus === "onTarget") return day.percentageOfExpected === 100;
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Payment Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleQuickSelect = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days - 1),
      to: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <CardTitle>Daily Payment Comparison</CardTitle>
          
          {/* Filters and Date Selection */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Quick Select Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(14)}
              >
                Last 14 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(30)}
              >
                Last 30 Days
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {dateRange.from && dateRange.to && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="above">Above Target</SelectItem>
                <SelectItem value="onTarget">On Target</SelectItem>
                <SelectItem value="below">Below Target</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredComparisons?.map((day) => {
            const isAbove = day.percentageOfExpected > 100;
            const isBelow = day.percentageOfExpected < 100 && day.percentageOfExpected > 0;
            const isOnTarget = day.percentageOfExpected === 100;

            return (
              <div
                key={day.date}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isAbove
                    ? "bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-500"
                    : isBelow
                    ? "bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-500"
                    : isOnTarget
                    ? "bg-blue-50 border-blue-500 dark:bg-blue-950/20 dark:border-blue-500"
                    : "bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">
                        {format(parseISO(day.date), "MMM dd, yyyy")}
                      </span>
                      {isAbove && (
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {isBelow && (
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      {isOnTarget && (
                        <Minus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Expected</p>
                        <p className="font-semibold text-foreground">
                          UGX {day.expected.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual</p>
                        <p className="font-semibold text-foreground">
                          UGX {day.actual.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        isAbove
                          ? "text-green-600 dark:text-green-400"
                          : isBelow
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {day.percentageOfExpected > 0
                        ? `${day.percentageOfExpected.toFixed(0)}%`
                        : "0%"}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        day.difference >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {day.difference >= 0 ? "+" : ""}
                      UGX {day.difference.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
