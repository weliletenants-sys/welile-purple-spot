import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign, Calendar, Target, Zap, Info } from "lucide-react";
import { BackToHome } from "@/components/BackToHome";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Recording bonus structure (adjust these based on your actual bonus structure)
const BONUS_STRUCTURE = {
  perRecording: 1000, // UGX per payment recorded
  dailyTarget: 10, // recordings
  weeklyTarget: 50,
  monthlyTarget: 200,
  bonusMultipliers: {
    meetDailyTarget: 1.2, // 20% bonus
    meetWeeklyTarget: 1.5, // 50% bonus
    meetMonthlyTarget: 2.0, // 100% bonus
  },
};

interface ScenarioResult {
  period: string;
  recordings: number;
  baseEarnings: number;
  bonusEarnings: number;
  totalEarnings: number;
  targetMet: string;
}

export default function RecordingBonusCalculator() {
  const [dailyRecordings, setDailyRecordings] = useState<number>(5);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState<number>(6);
  const [bonusRate, setBonusRate] = useState<number>(BONUS_STRUCTURE.perRecording);
  const [targetType, setTargetType] = useState<string>("standard");

  const calculateEarnings = (): ScenarioResult[] => {
    const weeklyRecordings = dailyRecordings * workingDaysPerWeek;
    const monthlyRecordings = weeklyRecordings * 4;

    // Daily calculation
    const dailyBase = dailyRecordings * bonusRate;
    const dailyMultiplier =
      dailyRecordings >= BONUS_STRUCTURE.dailyTarget
        ? BONUS_STRUCTURE.bonusMultipliers.meetDailyTarget
        : 1;
    const dailyBonus = dailyBase * (dailyMultiplier - 1);
    const dailyTotal = dailyBase + dailyBonus;

    // Weekly calculation
    const weeklyBase = weeklyRecordings * bonusRate;
    const weeklyMultiplier =
      weeklyRecordings >= BONUS_STRUCTURE.weeklyTarget
        ? BONUS_STRUCTURE.bonusMultipliers.meetWeeklyTarget
        : 1;
    const weeklyBonus = weeklyBase * (weeklyMultiplier - 1);
    const weeklyTotal = weeklyBase + weeklyBonus;

    // Monthly calculation
    const monthlyBase = monthlyRecordings * bonusRate;
    const monthlyMultiplier =
      monthlyRecordings >= BONUS_STRUCTURE.monthlyTarget
        ? BONUS_STRUCTURE.bonusMultipliers.meetMonthlyTarget
        : 1;
    const monthlyBonus = monthlyBase * (monthlyMultiplier - 1);
    const monthlyTotal = monthlyBase + monthlyBonus;

    return [
      {
        period: "Daily",
        recordings: dailyRecordings,
        baseEarnings: dailyBase,
        bonusEarnings: dailyBonus,
        totalEarnings: dailyTotal,
        targetMet: dailyRecordings >= BONUS_STRUCTURE.dailyTarget ? "Yes" : "No",
      },
      {
        period: "Weekly",
        recordings: weeklyRecordings,
        baseEarnings: weeklyBase,
        bonusEarnings: weeklyBonus,
        totalEarnings: weeklyTotal,
        targetMet: weeklyRecordings >= BONUS_STRUCTURE.weeklyTarget ? "Yes" : "No",
      },
      {
        period: "Monthly",
        recordings: monthlyRecordings,
        baseEarnings: monthlyBase,
        bonusEarnings: monthlyBonus,
        totalEarnings: monthlyTotal,
        targetMet: monthlyRecordings >= BONUS_STRUCTURE.monthlyTarget ? "Yes" : "No",
      },
    ];
  };

  const scenarios = calculateEarnings();

  // Comparison scenarios
  const comparisonData = [
    { scenario: "5/day", earnings: 5 * workingDaysPerWeek * 4 * bonusRate },
    { scenario: "10/day", earnings: 10 * workingDaysPerWeek * 4 * bonusRate * 1.2 },
    { scenario: "15/day", earnings: 15 * workingDaysPerWeek * 4 * bonusRate * 1.5 },
    { scenario: "20/day", earnings: 20 * workingDaysPerWeek * 4 * bonusRate * 2.0 },
  ];

  // Projection over time
  const projectionData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const recordings = dailyRecordings * workingDaysPerWeek * 4 * month;
    const multiplier =
      dailyRecordings * workingDaysPerWeek * 4 >= BONUS_STRUCTURE.monthlyTarget
        ? BONUS_STRUCTURE.bonusMultipliers.meetMonthlyTarget
        : 1;
    return {
      month: `Month ${month}`,
      earnings: recordings * bonusRate * multiplier,
    };
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackToHome />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="w-8 h-8 text-primary" />
              Recording Bonus Calculator
            </h1>
            <p className="text-muted-foreground">Calculate your potential earnings based on recording activity</p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            This calculator shows estimated earnings based on the current bonus structure. Actual earnings may vary
            based on payment verification and bonus adjustments.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Your Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dailyRecordings">Daily Recordings</Label>
                <Input
                  id="dailyRecordings"
                  type="number"
                  min="0"
                  value={dailyRecordings}
                  onChange={(e) => setDailyRecordings(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many payments do you record per day?
                </p>
              </div>

              <div>
                <Label htmlFor="workingDays">Working Days per Week</Label>
                <Select value={workingDaysPerWeek.toString()} onValueChange={(v) => setWorkingDaysPerWeek(Number(v))}>
                  <SelectTrigger id="workingDays" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bonusRate">Bonus per Recording (UGX)</Label>
                <Input
                  id="bonusRate"
                  type="number"
                  min="0"
                  step="100"
                  value={bonusRate}
                  onChange={(e) => setBonusRate(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Base amount earned per payment recorded
                </p>
              </div>

              <div>
                <Label>Performance Targets</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Daily Target:</span>
                    <Badge variant="outline">{BONUS_STRUCTURE.dailyTarget} recordings</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Weekly Target:</span>
                    <Badge variant="outline">{BONUS_STRUCTURE.weeklyTarget} recordings</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly Target:</span>
                    <Badge variant="outline">{BONUS_STRUCTURE.monthlyTarget} recordings</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Bonus Multipliers</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Daily Target:</span>
                    <Badge className="bg-chart-1">+20% bonus</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Weekly Target:</span>
                    <Badge className="bg-chart-2">+50% bonus</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly Target:</span>
                    <Badge className="bg-chart-3">+100% bonus</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <Card
                  key={scenario.period}
                  className={`p-6 ${
                    scenario.targetMet === "Yes"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{scenario.period}</h4>
                    {scenario.targetMet === "Yes" && (
                      <Badge className="bg-primary">Target Met!</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recordings:</span>
                      <span className="font-medium">{scenario.recordings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base:</span>
                      <span>UGX {scenario.baseEarnings.toLocaleString()}</span>
                    </div>
                    {scenario.bonusEarnings > 0 && (
                      <div className="flex justify-between text-chart-2">
                        <span>Bonus:</span>
                        <span className="font-medium">+UGX {scenario.bonusEarnings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t text-lg font-bold text-primary">
                      <span>Total:</span>
                      <span>UGX {scenario.totalEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tabs for detailed view */}
            <Tabs defaultValue="scenarios" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
                <TabsTrigger value="projection">12-Month Projection</TabsTrigger>
              </TabsList>

              <TabsContent value="scenarios">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Compare Different Recording Levels</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="scenario"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        label={{
                          value: "Monthly Earnings (UGX)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "hsl(var(--muted-foreground))" },
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="earnings" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="projection">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Cumulative Earnings Over 12 Months</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        label={{
                          value: "Cumulative Earnings (UGX)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "hsl(var(--muted-foreground))" },
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => `UGX ${value.toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="earnings"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Tips */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-chart-2/5">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Tips to Maximize Your Earnings
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Meet Daily Targets:</strong> Recording {BONUS_STRUCTURE.dailyTarget}+ payments per day
                    unlocks a 20% bonus multiplier
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Consistency Pays:</strong> Maintain steady recording activity throughout the week to reach
                    weekly targets
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Monthly Goals:</strong> Recording {BONUS_STRUCTURE.monthlyTarget}+ payments per month
                    doubles your earnings!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Early Recording:</strong> Record payments as soon as they're received to avoid missing
                    deadlines
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
