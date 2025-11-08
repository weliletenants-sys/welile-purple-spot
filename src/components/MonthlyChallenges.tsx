import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle2, Clock } from "lucide-react";
import { useUserChallenges } from "@/hooks/useChallenges";
import { format } from "date-fns";

interface MonthlyChallengesProps {
  userIdentifier: string;
}

export const MonthlyChallenges = ({ userIdentifier }: MonthlyChallengesProps) => {
  const { challenges, completedCount, totalPoints } = useUserChallenges(userIdentifier);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Monthly Challenges</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {completedCount}/{challenges.length} Complete
            </Badge>
            <Badge variant="outline">{totalPoints} pts earned</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No active challenges this month
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge: any) => (
              <div
                key={challenge.id}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{challenge.title}</h4>
                      {challenge.completed && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {challenge.description}
                    </p>
                  </div>
                  <Badge
                    variant={challenge.completed ? "default" : "outline"}
                    className="shrink-0"
                  >
                    +{challenge.points_reward} pts
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {challenge.current_value} / {challenge.target_value}
                    </span>
                    <span className="font-medium">
                      {Math.round(challenge.progress_percentage)}%
                    </span>
                  </div>
                  <Progress value={challenge.progress_percentage} className="h-2" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Ends {format(new Date(challenge.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {challenge.completed && challenge.completed_at && (
                    <span className="text-green-500">
                      ✓ Completed{" "}
                      {format(new Date(challenge.completed_at), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};