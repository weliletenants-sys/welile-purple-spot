import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity, 
  DollarSign, 
  Trophy, 
  Star, 
  UserPlus, 
  Mic, 
  TrendingUp,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTeamActivities } from "@/hooks/useTeamActivities";

interface TeamActivityFeedProps {
  teamId: string;
}

const activityIcons: Record<string, any> = {
  recording: Mic,
  earnings: DollarSign,
  milestone: Trophy,
  achievement: Star,
  joined: UserPlus,
  bonus: TrendingUp,
};

const activityColors: Record<string, string> = {
  recording: "text-blue-500",
  earnings: "text-green-500",
  milestone: "text-yellow-500",
  achievement: "text-purple-500",
  joined: "text-cyan-500",
  bonus: "text-orange-500",
};

export function TeamActivityFeed({ teamId }: TeamActivityFeedProps) {
  const { activities, isLoading } = useTeamActivities(teamId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Team Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Team Activity Feed
          <Badge variant="secondary" className="ml-auto text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] sm:h-[600px]">
          <div className="px-3 sm:px-6 py-4 space-y-3 sm:space-y-4">
            {activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No activities yet. Start working together!
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || Activity;
                const iconColor = activityColors[activity.activity_type] || "text-muted-foreground";

                return (
                  <div
                    key={activity.id}
                    className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex-shrink-0 ${iconColor}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {activity.user_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-xs sm:text-sm">
                              {activity.user_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {activity.activity_type}
                            </Badge>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {activity.metadata.amount && (
                                <Badge variant="secondary" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {new Intl.NumberFormat("en-UG", {
                                    style: "currency",
                                    currency: "UGX",
                                    minimumFractionDigits: 0,
                                  }).format(activity.metadata.amount)}
                                </Badge>
                              )}
                              {activity.metadata.count && (
                                <Badge variant="secondary" className="text-xs">
                                  {activity.metadata.count} recordings
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true 
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
