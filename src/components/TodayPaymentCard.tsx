import { Card, CardContent } from "@/components/ui/card";
import { useDailyPaymentComparison } from "@/hooks/useDailyPaymentComparison";
import { format, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const TodayPaymentCard = () => {
  const today = startOfDay(new Date());
  const { data: comparisons, isLoading } = useDailyPaymentComparison({
    from: today,
    to: today,
  });

  const todayData = comparisons?.[0];

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!todayData) {
    return null;
  }

  const isAbove = todayData.percentageOfExpected > 100;
  const isBelow = todayData.percentageOfExpected < 100 && todayData.percentageOfExpected > 0;
  const isOnTarget = todayData.percentageOfExpected === 100;

  return (
    <Card
      className={`border-2 transition-all ${
        isAbove
          ? "bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-500"
          : isBelow
          ? "bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-500"
          : isOnTarget
          ? "bg-blue-50 border-blue-500 dark:bg-blue-950/20 dark:border-blue-500"
          : "bg-muted border-border"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">Today's Performance</h3>
                <p className="text-sm text-muted-foreground">
                  {format(today, "EEEE, MMMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expected</p>
                <p className="text-2xl font-bold text-foreground">
                  UGX {todayData.expected.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Actual</p>
                <p className="text-2xl font-bold text-foreground">
                  UGX {todayData.actual.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Difference</p>
                <p
                  className={`text-2xl font-bold ${
                    todayData.difference >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {todayData.difference >= 0 ? "+" : ""}
                  UGX {todayData.difference.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center ml-8">
            {isAbove && <TrendingUp className="h-12 w-12 text-green-600 dark:text-green-400 mb-2" />}
            {isBelow && <TrendingDown className="h-12 w-12 text-red-600 dark:text-red-400 mb-2" />}
            {isOnTarget && <Minus className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-2" />}
            <p
              className={`text-5xl font-bold ${
                isAbove
                  ? "text-green-600 dark:text-green-400"
                  : isBelow
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {todayData.percentageOfExpected > 0
                ? `${todayData.percentageOfExpected.toFixed(0)}%`
                : "0%"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">of target</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
