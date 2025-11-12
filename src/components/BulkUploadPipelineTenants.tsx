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
        
        const name = row.name || row.Name || row.NAME || row["Tenant Name"] || "";
        const contact = normalizePhone(
          row.contact || row.Contact || row.CONTACT || row.phone || row.Phone || row.PHONE || ""
        );
        const district = row.district || row.District || row.DISTRICT || "";
        const address = row.address || row.Address || row.ADDRESS || row.location || "";
        const landlord = row.landlord || row.Landlord || row.LANDLORD || "";
        const landlord_contact = normalizePhone(
          row.landlord_contact || row["Landlord Contact"] || row.landlord_phone || ""
        );
        const rent_amount = parseFloat(row.rent_amount || row["Rent Amount"] || row.rent || "0");
        const agent_name = row.agent_name || row["Agent Name"] || row.agent || "";
        const agent_phone = normalizePhone(row.agent_phone || row["Agent Phone"] || "");
        const service_center = row.service_center || row["Service Center"] || "";
        const expected_conversion_date = row.expected_conversion_date || row["Expected Conversion Date"] || "";
        const notes = row.notes || row.Notes || row.comments || "";

        if (!name || !contact) {
          uploadResult.errors.push(`Row ${i + 2}: Missing name or contact`);
          uploadResult.failed++;
          continue;
        }

        parsedTenants.push({
          name,
          contact,
          address,
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
              address: tenant.address || "N/A",
              location_district: tenant.district || "",
              landlord: tenant.landlord || "N/A",
              landlord_contact: tenant.landlord_contact || "",
              rent_amount: tenant.rent_amount,
              repayment_days: 30,
              status: "pipeline",
              payment_status: "pending",
              agent_name: tenant.agent_name || "",
              agent_phone: tenant.agent_phone || "",
              service_center: tenant.service_center || "",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Pipeline Tenants</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) to add multiple pipeline tenants at once
          </DialogDescription>
        </DialogHeader>

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
              <li><strong>name</strong> or Name - Tenant name (required)</li>
              <li><strong>contact/phone</strong> - Phone number (required)</li>
              <li><strong>district</strong> - District location</li>
              <li><strong>address/location</strong> - Physical address</li>
              <li><strong>landlord</strong> - Landlord name</li>
              <li><strong>landlord_contact</strong> - Landlord phone</li>
              <li><strong>rent_amount/rent</strong> - Monthly rent amount</li>
              <li><strong>agent_name/agent</strong> - Agent name</li>
              <li><strong>agent_phone</strong> - Agent phone</li>
              <li><strong>service_center</strong> - Service center</li>
              <li><strong>expected_conversion_date</strong> - Target conversion date</li>
              <li><strong>notes/comments</strong> - Additional notes</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              All tenants will be added with "pipeline" status automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadPipelineTenants;
