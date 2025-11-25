import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { processBulkUpdate } from "@/utils/processBulkUpdate";

export default function ProcessBulkUpdate() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const results = await processBulkUpdate('/All_Tenants_2025-11-25.xlsx');
      setResult(results);
      setComplete(true);
    } catch (error: any) {
      console.error('Error processing:', error);
      setResult({ 
        success: 0, 
        failed: 0, 
        notFound: 0, 
        errors: [error.message],
        notFoundTenants: []
      });
      setComplete(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Process Bulk Tenant Update</CardTitle>
          <CardDescription>
            Update tenant agent assignments from the uploaded Excel file (All_Tenants_2025-11-25.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!processing && !complete && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Click the button below to process the tenant updates from the Excel file.
              </p>
              <Button onClick={handleProcess} size="lg">
                Start Processing
              </Button>
            </div>
          )}

          {processing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg font-medium">Processing tenant updates...</span>
              </div>
              <Progress value={100} className="animate-pulse" />
            </div>
          )}

          {complete && result && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-bold text-2xl">{result.success}</p>
                    <p className="text-sm text-muted-foreground">Successfully Updated</p>
                  </div>
                </div>
                
                {result.notFound > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="font-bold text-2xl">{result.notFound}</p>
                      <p className="text-sm text-muted-foreground">Not Found</p>
                    </div>
                  </div>
                )}
                
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                    <div>
                      <p className="font-bold text-2xl">{result.failed}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                )}
              </div>

              {result.notFoundTenants.length > 0 && (
                <div className="space-y-2 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Tenants Not Found ({result.notFoundTenants.length})
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    These tenants couldn't be found in the database (phone number doesn't match):
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                    {result.notFoundTenants.slice(0, 20).map((name: string, i: number) => (
                      <p key={i} className="text-xs font-mono">
                        {name}
                      </p>
                    ))}
                    {result.notFoundTenants.length > 20 && (
                      <p className="text-xs text-muted-foreground italic">
                        ... and {result.notFoundTenants.length - 20} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-2 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({result.errors.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                    {result.errors.slice(0, 10).map((error: string, i: number) => (
                      <p key={i} className="text-xs font-mono">
                        {error}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground italic">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={() => navigate('/')} className="flex-1">
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setComplete(false);
                    setResult(null);
                  }}
                >
                  Process Another File
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
