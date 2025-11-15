import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParsedPipelineTenant {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
  location?: string;
  district?: string;
  landlord?: string;
  landlord_contact?: string;
  rent_amount?: number;
  agent_name?: string;
  agent_phone?: string;
  service_center?: string;
  expected_conversion_date?: string;
  notes?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
  duplicateContacts: string[];
}

const BulkUploadPipelineTenants = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const normalizePhone = (phone: string): string => {
    if (!phone) return "";
    const cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.startsWith("256")) return cleaned;
    if (cleaned.startsWith("0")) return "256" + cleaned.slice(1);
    if (cleaned.length === 9) return "256" + cleaned;
    return cleaned;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    const uploadResult: UploadResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      duplicateContacts: [],
    };

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const totalRows = jsonData.length;
      const parsedTenants: ParsedPipelineTenant[] = [];

      // Parse all rows first
      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        
        // Support multiple column name formats
        const name = row["TENANTS NAME"] || row.name || row.Name || row.NAME || row["Tenant Name"] || "";
        const contact = normalizePhone(
          row["TEL NO."] || row.contact || row.Contact || row.CONTACT || row.phone || row.Phone || row.PHONE || ""
        );
        const district = row.DISTRICT || row.district || row.District || "";
        const location = row["CELL/VILLAGE"] || row.location || row.Location || row.address || row.Address || "";
        
        // Optional fields with defaults
        const landlord = row.landlord || row.Landlord || row.LANDLORD || "Unknown";
        const landlord_contact = normalizePhone(
          row.landlord_contact || row["Landlord Contact"] || row.landlord_phone || ""
        ) || "0000000000";
        const rent_amount = parseFloat(row.rent_amount || row["Rent Amount"] || row.rent || "0");
        const agent_name = row.agent_name || row["Agent Name"] || row.agent || "ADEKE ANNET";
        const agent_phone = normalizePhone(row.agent_phone || row["Agent Phone"] || "") || "256700000000";
        const service_center = row.service_center || row["Service Center"] || "";
        const expected_conversion_date = row.expected_conversion_date || row["Expected Conversion Date"] || "";
        const notes = row.notes || row.Notes || row.comments || "";

        // Only require name and contact, allow everything else to be missing
        if (!name || !contact) {
          uploadResult.errors.push(`Row ${i + 2}: Missing name or contact`);
          uploadResult.failed++;
          continue;
        }

        parsedTenants.push({
          name,
          contact,
          address: location || district, // Use location or fall back to district
          district,
          landlord,
          landlord_contact,
          rent_amount: rent_amount || 0,
          agent_name,
          agent_phone,
          service_center,
          expected_conversion_date,
          notes,
        });
      }

      // Check for duplicates
      const contacts = parsedTenants.map((t) => t.contact);
      const { data: existingTenants } = await supabase
        .from("tenants")
        .select("contact")
        .in("contact", contacts);

      const existingContacts = new Set(existingTenants?.map((t) => t.contact) || []);

      // Insert valid, non-duplicate tenants
      for (let i = 0; i < parsedTenants.length; i++) {
        const tenant = parsedTenants[i];
        setProgress(Math.round(((i + 1) / parsedTenants.length) * 100));

        if (existingContacts.has(tenant.contact)) {
          uploadResult.duplicates++;
          uploadResult.duplicateContacts.push(tenant.contact || "");
          continue;
        }

        try {
          const { data: newTenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
              name: tenant.name,
              contact: tenant.contact,
              address: tenant.address || "To be updated",
              location_district: tenant.district || "To be updated",
              location_cell_or_village: tenant.address,
              landlord: tenant.landlord || "To be updated",
              landlord_contact: tenant.landlord_contact || "0000000000",
              rent_amount: tenant.rent_amount || 0,
              repayment_days: 30,
              status: "pipeline",
              payment_status: "pending",
              agent_name: tenant.agent_name || "ADEKE ANNET",
              agent_phone: tenant.agent_phone || "256700000000",
              service_center: tenant.service_center || "To be assigned",
              registration_fee: 0,
              access_fee: 0,
              source: "bulk_upload_pipeline",
            })
            .select()
            .single();

          if (tenantError) throw tenantError;

          // Create initial daily_payments record
          const startDate = new Date();
          await supabase.from("daily_payments").insert({
            tenant_id: newTenant.id,
            date: startDate.toISOString().split("T")[0],
            amount: tenant.rent_amount / 30,
            paid: false,
            service_center: tenant.service_center || "",
          });

          uploadResult.success++;
        } catch (error: any) {
          uploadResult.failed++;
          uploadResult.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      setResult(uploadResult);

      if (uploadResult.success > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully added ${uploadResult.success} pipeline tenant(s)${
            uploadResult.duplicates > 0 ? `. Skipped ${uploadResult.duplicates} duplicate(s).` : ""
          }`,
        });
      }

      if (uploadResult.failed > 0) {
        toast({
          title: "Some uploads failed",
          description: `${uploadResult.failed} tenant(s) failed to upload. Check details below.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
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
        <Button className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Bulk Upload Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Pipeline Tenants</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) to add multiple pipeline tenants at once
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="pipeline-file-upload"
            />
            <label
              htmlFor="pipeline-file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploading ? "Uploading..." : "Click to upload Excel file"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx and .xls files
              </p>
            </label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processing: {progress}%
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Upload Summary:</p>
                    <p className="text-sm">✅ Successfully added: {result.success}</p>
                    {result.duplicates > 0 && (
                      <p className="text-sm">⚠️ Skipped duplicates: {result.duplicates}</p>
                    )}
                    {result.failed > 0 && (
                      <p className="text-sm text-destructive">❌ Failed: {result.failed}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-medium mb-2">Errors:</p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {result.duplicateContacts.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <p className="font-medium mb-2">Duplicate contacts skipped:</p>
                    <p className="text-xs max-h-32 overflow-y-auto">
                      {result.duplicateContacts.join(", ")}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
            <p className="font-medium">Expected Excel columns:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>TENANTS NAME</strong> or name - Tenant name (required)</li>
              <li><strong>TEL NO.</strong> or contact/phone - Phone number (required)</li>
              <li><strong>DISTRICT</strong> - District location (optional)</li>
              <li><strong>CELL/VILLAGE</strong> or location - Cell or village (optional)</li>
              <li>landlord - Landlord name (optional, defaults to "To be updated")</li>
              <li>landlord_contact - Landlord phone (optional)</li>
              <li>rent_amount/rent - Monthly rent amount (optional)</li>
              <li>agent_name/agent - Agent name (optional, defaults to "ADEKE ANNET")</li>
              <li>agent_phone - Agent phone (optional)</li>
              <li>service_center - Service center (optional)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong>Note:</strong> All tenants will be added as editable pipeline tenants. Missing information can be filled in later by editing each tenant.
            </p>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadPipelineTenants;
