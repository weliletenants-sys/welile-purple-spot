import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePipelineForecast, PipelineForecast as ForecastData } from "@/hooks/usePipelineForecast";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Users,
  Building2,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PipelineForecastProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    serviceCenter?: string;
    agentName?: string;
  };
}

export const PipelineForecast = ({ filters }: PipelineForecastProps) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  
  const generateForecast = usePipelineForecast();

  const handleGenerate = async () => {
    try {
      const result = await generateForecast.mutateAsync(filters);
      setForecast(result.forecast);
      setGeneratedAt(result.generatedAt);
    } catch (error) {
      console.error('Forecast generation failed:', error);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'bg-green-500/10 text-green-600 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      low: 'bg-red-500/10 text-red-600 border-red-500/20'
    };
    return (
      <Badge variant="outline" className={variants[confidence]}>
        {confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI-Powered Pipeline Forecast</CardTitle>
                <CardDescription>
                  Generate intelligent predictions based on historical data
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateForecast.isPending}
              className="gap-2"
            >
              {generateForecast.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error State */}
      {generateForecast.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {generateForecast.error instanceof Error 
              ? generateForecast.error.message 
              : 'Failed to generate forecast. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {generateForecast.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      )}

      {/* Forecast Results */}
      {forecast && !generateForecast.isPending && (
        <div className="space-y-6">
          {/* Timestamp */}
          {generatedAt && (
            <p className="text-sm text-muted-foreground text-center">
              Generated on {format(new Date(generatedAt), "PPpp")}
            </p>
          )}

          {/* Overall Forecast */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Overall 30-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Expected Conversion Rate</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {forecast.overallForecast.expectedConversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Projected Conversions</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {forecast.overallForecast.projectedConversions}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                {getConfidenceBadge(forecast.overallForecast.confidence)}
                <p className="text-sm text-muted-foreground flex-1">
                  {forecast.overallForecast.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agent Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Agent Performance Forecasts
              </CardTitle>
              <CardDescription>
                Predicted performance for top agents over the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.agentForecasts.map((agent, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{agent.agentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Expected: <span className="font-semibold text-primary">
                            {agent.expectedConversions} conversions
                          </span>
                        </p>
                      </div>
                      {getConfidenceBadge(agent.confidence)}
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Center Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Service Center Trends
              </CardTitle>
              <CardDescription>
                Predicted trends for service centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.serviceCenterForecasts.map((center, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(center.trend)}
                        <div>
                          <p className="font-semibold">{center.centerName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            Trend: <span className="font-semibold">{center.trend}</span>
                          </p>
                        </div>
                      </div>
                      {getConfidenceBadge(center.confidence)}
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">{center.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="border-2 border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                Key Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 border border-purple-500/20 rounded-lg bg-card"
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(insight.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{insight.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {insight.priority}
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                              ACTIONABLE
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
