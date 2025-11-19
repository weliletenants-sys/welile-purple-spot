import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyPaymentComparison } from "@/hooks/useDailyPaymentComparison";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const DailyPaymentComparison = () => {
  const { data: comparisons, isLoading } = useDailyPaymentComparison(7);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Payment Comparison (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {comparisons?.map((day) => {
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
