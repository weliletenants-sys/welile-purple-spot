import { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
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

interface ParsedTenant {
  name: string;
  contact: string;
  address: string;
  landlord: string;
  landlord_contact: string;
  rent_amount: number;
  repayment_days: number;
  agent_name: string;
  agent_phone: string;
  registration_fee?: number;
  access_fee?: number;
  guarantor1_name?: string;
  guarantor1_contact?: string;
  guarantor2_name?: string;
  guarantor2_contact?: string;
  location_country?: string;
  location_county?: string;
  location_district?: string;
  location_subcounty_or_ward?: string;
  location_cell_or_village?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
  duplicateContacts: string[];
}

export const BulkUploadTenants = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

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

      const uploadResult: UploadResult = {
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [],
        duplicateContacts: [],
      };

      // Process tenants in batches
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        setProgress(Math.round(((i + 1) / jsonData.length) * 100));

        try {
          const tenant: ParsedTenant = {
            name: row.name || row.Name || row.NAME,
            contact: row.contact || row.Contact || row.CONTACT || row.phone || row.Phone,
            address: row.address || row.Address || row.ADDRESS,
            landlord: row.landlord || row.Landlord || row.LANDLORD,
            landlord_contact: row.landlord_contact || row["Landlord Contact"] || row.landlord_phone,
            rent_amount: parseFloat(row.rent_amount || row["Rent Amount"] || row.rent || 0),
            repayment_days: parseInt(row.repayment_days || row["Repayment Days"] || 30),
            agent_name: row.agent_name || row["Agent Name"] || row.agent || "",
            agent_phone: row.agent_phone || row["Agent Phone"] || row.agent_contact || "",
            registration_fee: parseFloat(row.registration_fee || row["Registration Fee"] || 10000),
            access_fee: parseFloat(row.access_fee || row["Access Fee"] || 0),
            guarantor1_name: row.guarantor1_name || row["Guarantor 1 Name"],
            guarantor1_contact: row.guarantor1_contact || row["Guarantor 1 Contact"],
            guarantor2_name: row.guarantor2_name || row["Guarantor 2 Name"],
            guarantor2_contact: row.guarantor2_contact || row["Guarantor 2 Contact"],
            location_country: row.location_country || row["Country"],
            location_county: row.location_county || row["County"],
            location_district: row.location_district || row["District"],
            location_subcounty_or_ward: row.location_subcounty_or_ward || row["Subcounty/Ward"],
            location_cell_or_village: row.location_cell_or_village || row["Cell/Village"],
          };

          // Validate required fields
          if (!tenant.name || !tenant.contact || !tenant.address || !tenant.rent_amount) {
            uploadResult.failed++;
            uploadResult.errors.push(`Row ${i + 1}: Missing required fields (name, contact, address, or rent amount)`);
            continue;
          }

          // Check for duplicate phone number
          const { data: existingTenant, error: checkError } = await supabase
            .from("tenants")
            .select("id, name, contact")
            .eq("contact", tenant.contact)
            .maybeSingle();

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existingTenant) {
            uploadResult.duplicates++;
            uploadResult.duplicateContacts.push(`${tenant.name} (${tenant.contact})`);
            continue;
          }

          // Insert tenant
          const { data: newTenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
              ...tenant,
              status: "active",
              payment_status: "pending",
              performance: 80,
              edited_by: "Bulk Upload",
              edited_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (tenantError) throw tenantError;

          // Create daily payment records
          const payments = [];
          const today = new Date();
          for (let day = 0; day < tenant.repayment_days; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() + day);
            payments.push({
              tenant_id: newTenant.id,
              date: date.toISOString().split("T")[0],
              amount: tenant.rent_amount / tenant.repayment_days,
              paid: false,
            });
          }

          const { error: paymentsError } = await supabase
            .from("daily_payments")
            .insert(payments);

          if (paymentsError) throw paymentsError;

          // Create agent earnings record
          if (tenant.agent_name && tenant.agent_phone) {
            await supabase.from("agent_earnings").insert({
              agent_name: tenant.agent_name,
              agent_phone: tenant.agent_phone,
              tenant_id: newTenant.id,
              earning_type: "signup_bonus",
              amount: 5000,
            });
          }

          uploadResult.success++;
        } catch (error: any) {
          uploadResult.failed++;
          uploadResult.errors.push(`Row ${i + 1}: ${error.message || "Unknown error"}`);
        }
      }

      setResult(uploadResult);

      if (uploadResult.success > 0) {
        toast({
          title: "Upload completed",
          description: `Successfully added ${uploadResult.success} tenant(s)${uploadResult.duplicates > 0 ? `, ${uploadResult.duplicates} duplicates skipped` : ""}${uploadResult.failed > 0 ? `, ${uploadResult.failed} failed` : ""}`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: "No tenants were added. Check the error details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
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
          Import from Google Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Tenants</DialogTitle>
          <DialogDescription>
            Upload a Google Sheets file (.xlsx, .xls) with tenant information.
            Required columns: name, contact, address, rent_amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                Click to upload
              </span>
              <span className="text-sm text-muted-foreground"> or drag and drop</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Excel or Google Sheets format (.xlsx, .xls)
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
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
                  <span className="font-medium">{result.success} successful</span>
                </div>
                {result.duplicates > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{result.duplicates} duplicates</span>
                  </div>
                )}
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium">{result.failed} failed</span>
                  </div>
                )}
              </div>

              {result.duplicateContacts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Duplicates Skipped (Phone Already Exists):</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.duplicateContacts.map((contact, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {contact}
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
            <h4 className="font-medium">Expected columns:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>name</strong> (required)</li>
              <li><strong>contact</strong> (required)</li>
              <li><strong>address</strong> (required)</li>
              <li><strong>rent_amount</strong> (required)</li>
              <li>landlord, landlord_contact</li>
              <li>agent_name, agent_phone</li>
              <li>repayment_days (default: 30)</li>
              <li>registration_fee (default: 10000)</li>
              <li>guarantor1_name, guarantor1_contact, guarantor2_name, guarantor2_contact</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
