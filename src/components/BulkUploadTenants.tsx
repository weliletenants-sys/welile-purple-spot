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

      console.log("Uploaded file data:", jsonData);

      if (jsonData.length === 0) {
        toast({
          title: "Empty file",
          description: "The uploaded file contains no data",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Show first row column names for debugging
      if (jsonData.length > 0) {
        console.log("Available columns:", Object.keys(jsonData[0]));
      }

      const uploadResult: UploadResult = {
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [],
        duplicateContacts: [],
      };

      // Parse all tenants first
      const parsedTenants: ParsedTenant[] = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        setProgress(Math.round(((i + 1) / jsonData.length) * 50)); // First 50% for parsing

        try {
          const normalizedRow: Record<string, any> = {};
          Object.entries(row).forEach(([k, v]) => {
            const key = String(k).toLowerCase().trim().replace(/\s+|\/+|-/g, "_");
            normalizedRow[key] = v;
          });

          const get = (...keys: string[]) =>
            keys
              .map((k) => normalizedRow[k])
              .find((v) => v !== undefined && v !== null && String(v).trim() !== "");

          const looksLikePhone = (val: any) => {
            const digits = String(val).replace(/\D/g, "");
            return digits.length >= 9 && digits.length <= 12;
          };

          const normalizePhone = (val: any) => {
            let digits = String(val).replace(/\D/g, "");
            if (digits.startsWith("256") && digits.length === 12) {
              digits = "0" + digits.slice(3);
            }
            if (digits.length === 9) {
              digits = "0" + digits;
            }
            return digits;
          };

          const looksLikeName = (val: any) => /[A-Za-z]/.test(String(val));

          let nameVal = get("name", "tenant", "tenant_name", "tenants_name", "contact_name", "full_name", "fullname", "client_name", "names");
          if (!nameVal && normalizedRow["contact"] && !looksLikePhone(normalizedRow["contact"]) && looksLikeName(normalizedRow["contact"])) {
            nameVal = normalizedRow["contact"];
          }

          let phoneCandidate = get("contact", "phone", "phone_number", "telephone", "tel", "tel_no", "tel_no_", "mobile", "msisdn", "contact_number", "contact_no");

          if (!phoneCandidate || !looksLikePhone(phoneCandidate)) {
            phoneCandidate = undefined;
            const possiblePhoneKeys = ["contact", "phone", "phone_number", "telephone", "tel", "mobile", "msisdn", "contact_number", "contact_no", "address", "landlord_contact", "landlord_phone", "landlord_details", "landload_details"];
            for (const k of possiblePhoneKeys) {
              const v = normalizedRow[k];
              if (v && looksLikePhone(v)) {
                phoneCandidate = v;
                break;
              }
            }
            if (!phoneCandidate) {
              for (const v of Object.values(normalizedRow)) {
                if (v && looksLikePhone(v)) {
                  phoneCandidate = v;
                  break;
                }
              }
            }
          }

          let phoneVal = phoneCandidate ? normalizePhone(phoneCandidate) : undefined;

          const tenant: ParsedTenant = {
            name: nameVal ? String(nameVal).trim() : "Unknown",
            contact: phoneVal ? String(phoneVal) : `temp_${Date.now()}_${i}`,
            address: (get("address", "location", "area", "cell_village", "cell", "village") as string) || "Not provided",
            landlord: (get("landlord", "landlord_name") as string) || "Not provided",
            landlord_contact: (get("landlord_contact", "landlord_phone") as string) || "Not provided",
            rent_amount: Number(get("rent_amount", "rent")) || 0,
            repayment_days: Number(get("repayment_days", "days")) || 30,
            agent_name: (get("agent_name", "agent") as string) || "ADEKE ANNET",
            agent_phone: (get("agent_phone", "agent_contact", "agent_phone_number") as string) || "",
            registration_fee: Number(get("registration_fee", "reg_fee")) || 10000,
            access_fee: Number(get("access_fee")) || 0,
            guarantor1_name: get("guarantor1_name", "guarantor_name", "guarantor") as string | undefined,
            guarantor1_contact: get("guarantor1_contact", "guarantor_phone") as string | undefined,
            guarantor2_name: get("guarantor2_name") as string | undefined,
            guarantor2_contact: get("guarantor2_contact") as string | undefined,
            location_country: get("location_country", "country") as string | undefined,
            location_county: get("location_county", "county") as string | undefined,
            location_district: get("location_district", "district") as string | undefined,
            location_subcounty_or_ward: get("location_subcounty_or_ward", "subcounty", "ward") as string | undefined,
            location_cell_or_village: get("location_cell_or_village", "cell_village", "cell", "village") as string | undefined,
          };

          parsedTenants.push(tenant);
        } catch (error: any) {
          uploadResult.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Check for duplicates in batch
      const contacts = parsedTenants.map(t => t.contact);
      const { data: existingTenants } = await supabase
        .from("tenants")
        .select("contact")
        .in("contact", contacts);

      const existingContacts = new Set(existingTenants?.map(t => t.contact) || []);
      
      const tenantsToInsert = parsedTenants.filter(tenant => {
        if (existingContacts.has(tenant.contact)) {
          uploadResult.duplicates++;
          uploadResult.duplicateContacts.push(`${tenant.name} (${tenant.contact})`);
          return false;
        }
        return true;
      });

      setProgress(60);

      // Batch insert all tenants
      if (tenantsToInsert.length > 0) {
        const { data: insertedTenants, error: batchError } = await supabase
          .from("tenants")
          .insert(
            tenantsToInsert.map(tenant => ({
              ...tenant,
              status: "active",
              payment_status: "pending",
              performance: 80,
              source: "bulk_upload",
              edited_by: "Bulk Upload",
              edited_at: new Date().toISOString(),
            }))
          )
          .select();

        if (batchError) {
          uploadResult.errors.push(`Batch insert failed: ${batchError.message}`);
          uploadResult.failed = tenantsToInsert.length;
        } else {
          uploadResult.success = insertedTenants?.length || 0;
          
          setProgress(80);

          // Batch insert payments and earnings
          if (insertedTenants && insertedTenants.length > 0) {
            const allPayments = [];
            const allEarnings = [];
            const today = new Date();

            for (const newTenant of insertedTenants) {
              const originalTenant = tenantsToInsert.find(t => t.contact === newTenant.contact);
              if (!originalTenant) continue;

              // Create payments
              for (let day = 0; day < originalTenant.repayment_days; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                allPayments.push({
                  tenant_id: newTenant.id,
                  date: date.toISOString().split("T")[0],
                  amount: originalTenant.rent_amount / originalTenant.repayment_days,
                  paid: false,
                });
              }

              // Create earnings
              if (originalTenant.agent_name && originalTenant.agent_phone) {
                allEarnings.push({
                  agent_name: originalTenant.agent_name,
                  agent_phone: originalTenant.agent_phone,
                  tenant_id: newTenant.id,
                  earning_type: "signup_bonus",
                  amount: 5000,
                });
              }
            }

            // Batch insert payments
            if (allPayments.length > 0) {
              try {
                await supabase.from("daily_payments").insert(allPayments);
              } catch (e) {
                // Ignore payment errors
              }
            }

            // Batch insert earnings
            if (allEarnings.length > 0) {
              try {
                await supabase.from("agent_earnings").insert(allEarnings);
              } catch (e) {
                // Ignore earnings errors
              }
            }
          }
        }
      }

      setProgress(100);

      setResult(uploadResult);

      console.log("Upload complete:", uploadResult);
      
      if (uploadResult.success > 0) {
        toast({
          title: "✅ Upload Successful!",
          description: `Added ${uploadResult.success} new tenant(s)${uploadResult.duplicates > 0 ? `. Skipped ${uploadResult.duplicates} duplicates` : ""}${uploadResult.failed > 0 ? `. ${uploadResult.failed} failed` : ""}`,
        });
      } else if (uploadResult.duplicates > 0) {
        toast({
          title: "⚠️ All Duplicates",
          description: `All ${uploadResult.duplicates} phone numbers already exist in the system.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "No tenants were added. Check the error details below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("File processing failed:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process file. Check console for details.",
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
            All columns are optional - just upload any data you have and fill in the rest later.
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
            <h4 className="font-medium">Supported columns (all optional):</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>name, contact (phone number)</li>
              <li>address, rent_amount, repayment_days</li>
              <li>landlord, landlord_contact</li>
              <li>agent_name, agent_phone</li>
              <li>registration_fee, access_fee</li>
              <li>guarantor1_name, guarantor1_contact, guarantor2_name, guarantor2_contact</li>
              <li>location fields (country, county, district, subcounty, cell/village)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Missing data will be auto-filled with defaults - you can edit later!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
