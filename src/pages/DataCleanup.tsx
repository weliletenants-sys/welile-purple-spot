import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DataCleanup = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    tenantsUpdated: number;
    agentsUpdated: number;
  } | null>(null);
  const { toast } = useToast();

  const standardizePhoneNumbers = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      // Update tenants table - remove spaces from agent_phone
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, agent_phone")
        .like("agent_phone", "% %");

      if (tenantsError) throw tenantsError;

      let tenantsUpdated = 0;
      if (tenantsData && tenantsData.length > 0) {
        for (const tenant of tenantsData) {
          const cleanPhone = tenant.agent_phone?.replace(/\s/g, "") || "";
          const { error } = await supabase
            .from("tenants")
            .update({ agent_phone: cleanPhone })
            .eq("id", tenant.id);

          if (!error) tenantsUpdated++;
        }
      }

      // Update agents table - remove spaces from phone
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("id, phone")
        .like("phone", "% %");

      if (agentsError) throw agentsError;

      let agentsUpdated = 0;
      if (agentsData && agentsData.length > 0) {
        for (const agent of agentsData) {
          const cleanPhone = agent.phone?.replace(/\s/g, "") || "";
          const { error } = await supabase
            .from("agents")
            .update({ phone: cleanPhone })
            .eq("id", agent.id);

          if (!error) agentsUpdated++;
        }
      }

      setResults({
        tenantsUpdated,
        agentsUpdated,
      });

      toast({
        title: "Phone Numbers Standardized",
        description: `Updated ${tenantsUpdated} tenant records and ${agentsUpdated} agent records.`,
      });
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to standardize phone numbers",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Data Cleanup Tools</h1>
        <p className="text-muted-foreground">
          Maintain data consistency and quality across the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Standardize Phone Numbers</CardTitle>
          </div>
          <CardDescription>
            Remove all spaces from phone numbers in the agents and tenants tables to ensure consistent formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will update all phone numbers by removing spaces. For example: "0743 668441" will become "0743668441"
            </AlertDescription>
          </Alert>

          {results && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Cleanup Complete:</strong>
                <ul className="mt-2 list-disc list-inside">
                  <li>Tenant records updated: {results.tenantsUpdated}</li>
                  <li>Agent records updated: {results.agentsUpdated}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={standardizePhoneNumbers}
            disabled={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run Phone Number Cleanup
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataCleanup;
