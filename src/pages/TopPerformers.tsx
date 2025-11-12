import { WelileLogo } from "@/components/WelileLogo";
import { BackToHome } from "@/components/BackToHome";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AgentLeaderboard } from "@/components/AgentLeaderboard";
import { WeeklyRecordingLeaderboard } from "@/components/WeeklyRecordingLeaderboard";
import { MonthlyRecordingLeaderboard } from "@/components/MonthlyRecordingLeaderboard";
import { RecordingActivityChart } from "@/components/RecordingActivityChart";

const TopPerformers = () => {
  const navigate = useNavigate();

  // Keyboard shortcut: Escape to go home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <BackToHome />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <WelileLogo />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  🏆 Top Performers
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Agent Performance Leaderboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Recording Activity Trends Chart */}
        <RecordingActivityChart />
        
        {/* Weekly Recording Leaderboard */}
        <WeeklyRecordingLeaderboard />
        
        {/* Monthly Recording Leaderboard */}
        <MonthlyRecordingLeaderboard />
        
        {/* Agent Leaderboard */}
        <div className="space-y-4">
          <AgentLeaderboard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Welile Tenants Hub - Performance Monitoring Platform</p>
          <p className="text-sm mt-2">Powered by Lovable Cloud</p>
        </div>
      </footer>
    </div>
  );
};

export default TopPerformers;
