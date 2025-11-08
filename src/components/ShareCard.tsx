import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Award, TrendingUp } from "lucide-react";
import { WelileLogo } from "./WelileLogo";
import html2canvas from "html2canvas";

interface ShareCardProps {
  type: "achievement" | "leaderboard" | "challenge";
  data: {
    title: string;
    subtitle?: string;
    rank?: number;
    points?: number;
    badgeCount?: number;
    userName: string;
  };
}

export const ShareCard = ({ type, data }: ShareCardProps) => {
  const getIcon = () => {
    switch (type) {
      case "achievement":
        return <Award className="h-16 w-16 text-yellow-500" />;
      case "leaderboard":
        return <Trophy className="h-16 w-16 text-yellow-500" />;
      case "challenge":
        return <TrendingUp className="h-16 w-16 text-green-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case "achievement":
        return "from-yellow-500/20 to-orange-500/20";
      case "leaderboard":
        return "from-blue-500/20 to-purple-500/20";
      case "challenge":
        return "from-green-500/20 to-emerald-500/20";
    }
  };

  return (
    <Card className={`w-[600px] bg-gradient-to-br ${getGradient()} border-2`}>
      <CardContent className="p-8 space-y-6">
        {/* Header with logo */}
        <div className="flex items-center justify-between">
          <div className="h-8">
            <WelileLogo />
          </div>
          <div className="text-sm text-muted-foreground">Welile Tenants Hub</div>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {getIcon()}
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{data.title}</h2>
            {data.subtitle && (
              <p className="text-lg text-muted-foreground">{data.subtitle}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center pt-4">
            {data.rank && (
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">#{data.rank}</div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
            )}
            {data.points !== undefined && (
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {data.points.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
            )}
            {data.badgeCount !== undefined && (
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{data.badgeCount}</div>
                <div className="text-sm text-muted-foreground">Badges</div>
              </div>
            )}
          </div>

          {/* User name */}
          <div className="pt-4 border-t w-full">
            <p className="text-xl font-semibold">{data.userName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Utility function to generate and download image
export const generateShareImage = async (
  elementId: string,
  fileName: string
): Promise<string> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found");

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
  });

  return canvas.toDataURL("image/png");
};