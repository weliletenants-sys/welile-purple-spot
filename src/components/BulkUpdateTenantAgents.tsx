import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useAgents } from "@/hooks/useAgents";

interface UpdateResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
  notFoundTenants: string[];
}

export const BulkUpdateTenantAgents = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const { toast } = useToast();
  const { data: agents } = useAgents();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "Empty file",
          description: "The uploaded file contains no data",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const updateResult: UpdateResult = {
        success: 0,
        failed: 0,
        notFound: 0,
        errors: [],
        notFoundTenants: [],
      };

      // Create agent lookup map
      const agentMap = new Map<string, { id: string; phone: string }>();
      agents?.forEach(agent => {
        agentMap.set(agent.name.toUpperCase(), { id: agent.id, phone: agent.phone || "" });
      });

      const updates = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        setProgress(Math.round(((i + 1) / jsonData.length) * 50));

        try {
          const contact = row["Contact"] || row["contact"];
          const tenantName = row["Tenant Name"] || row["tenant_name"] || row["name"];
          const agentName = row["Agent Name"] || row["agent_name"];
          const agentPhone = row["Agent Phone"] || row["agent_phone"];

          if (!contact) {
            updateResult.errors.push(`Row ${i + 2}: Missing contact/phone number`);
            continue;
          }

          if (!agentName) {
            updateResult.errors.push(`Row ${i + 2}: Missing agent name`);
            continue;
          }

          // Find tenant by contact
          const { data: tenant, error: findError } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("contact", String(contact))
            .maybeSingle();

          if (findError) {
            updateResult.errors.push(`Row ${i + 2}: Database error - ${findError.message}`);
            continue;
          }

          if (!tenant) {
            updateResult.notFound++;
            updateResult.notFoundTenants.push(`${tenantName || contact}`);
            continue;
          }

          // Get agent details
          const agentInfo = agentMap.get(String(agentName).toUpperCase());
          const agentId = agentInfo?.id || null;
          const finalAgentPhone = agentPhone || agentInfo?.phone || "";

          updates.push({
            id: tenant.id,
            agent_name: String(agentName),
            agent_phone: finalAgentPhone,
            agent_id: agentId,
          });

        } catch (error: any) {
          updateResult.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      setProgress(60);

      // Batch update tenants
      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i += 100) {
          const batch = updates.slice(i, i + 100);
          
          for (const update of batch) {
            const { error: updateError } = await supabase
              .from("tenants")
              .update({
                agent_name: update.agent_name,
                agent_phone: update.agent_phone,
                agent_id: update.agent_id,
                edited_by: "Bulk Agent Update",
                edited_at: new Date().toISOString(),
              })
              .eq("id", update.id);

            if (updateError) {
              updateResult.failed++;
              updateResult.errors.push(`Failed to update tenant ID ${update.id}: ${updateError.message}`);
            } else {
              updateResult.success++;
            }
          }

          setProgress(60 + Math.round(((i + batch.length) / updates.length) * 40));
        }
      }

      setProgress(100);
      setResult(updateResult);

      if (updateResult.success > 0) {
        toast({
          title: "✅ Update Successful!",
          description: `Updated ${updateResult.success} tenant(s)${updateResult.notFound > 0 ? `. ${updateResult.notFound} not found` : ""}${updateResult.failed > 0 ? `. ${updateResult.failed} failed` : ""}`,
        });
      } else {
        toast({
          title: "Update failed",
          description: "No tenants were updated. Check the error details below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("File processing failed:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Upload className="mr-2 h-4 w-4" />
          Import Agent Assignments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Tenant Agent Assignments</DialogTitle>
          <DialogDescription>
            Upload the exported Excel file with updated agent assignments. 
            Tenants will be matched by phone number (Contact column).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="agent-file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                Click to upload
              </span>
              <span className="text-sm text-muted-foreground"> or drag and drop</span>
              <input
                id="agent-file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Excel format (.xlsx, .xls)
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <div className="space-y-4 border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">{result.success} updated</span>
                </div>
                {result.notFound > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{result.notFound} not found</span>
                  </div>
                )}
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium">{result.failed} failed</span>
                  </div>
                )}
              </div>

              {result.notFoundTenants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                    Tenants Not Found (phone number doesn't match):
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.notFoundTenants.map((name, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <h4 className="font-medium">How it works:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Export all tenants using "Export All Tenants" button</li>
              <li>Edit the "Agent Name" and "Agent Phone" columns in Excel</li>
              <li>Upload the edited file here to update assignments</li>
              <li>Tenants are matched by their phone number (Contact column)</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Make sure agent names match exactly with existing agents in the system
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
