import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const AutoImportTenants = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    duplicates: number;
  } | null>(null);
  const navigate = useNavigate();

  const handleAutoImport = async () => {
    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Fetch the Excel file
      const response = await fetch("/ADEKE_ANNET_JUNE_12345-2.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse headers and data
      const headers = (jsonData[0] as any[]).map((h: any) =>
        String(h).toLowerCase().trim()
      );
      const dataRows = jsonData.slice(1);

      const tenantsToAdd = [];
      const existingContacts = new Set<string>();

      // Check existing contacts
      const { data: existingTenants } = await supabase
        .from("tenants")
        .select("contact");
      
      existingTenants?.forEach((t) => existingContacts.add(t.contact));

      // Process each row
      for (const row of dataRows) {
        const rowData = row as any[];
        if (!rowData || rowData.length === 0) continue;

        const tenant: any = {};
        headers.forEach((header, index) => {
          tenant[header] = rowData[index];
        });

        const name = tenant["tenants name"] || tenant["name"];
        const contact = String(tenant["tel no."] || tenant["contact"] || "").trim();
        const district = tenant["district"] || "KAMPALA";
        const cellVillage = tenant["cell/village"] || "";

        if (!name || !contact) continue;
        if (existingContacts.has(contact)) continue;

        tenantsToAdd.push({
          name,
          contact,
          address: cellVillage || district,
          status: "Active",
          payment_status: "Pending",
          performance: 80,
          landlord: "To be updated",
          landlord_contact: "0000000000",
          rent_amount: 0,
          registration_fee: 10000,
          access_fee: 0,
          repayment_days: 30,
          location_country: "Uganda",
          location_county: "",
          location_district: district,
          location_subcounty_or_ward: "",
          location_cell_or_village: cellVillage,
          agent_name: "ADEKE ANNET",
          agent_phone: "256000000000",
        });
      }

      setProgress(30);

      if (tenantsToAdd.length === 0) {
        toast.info("No new tenants to add");
        setResult({ success: 0, failed: 0, duplicates: dataRows.length });
        setImporting(false);
        return;
      }

      // Batch insert tenants
      const { data: insertedTenants, error: tenantsError } = await supabase
        .from("tenants")
        .insert(tenantsToAdd)
        .select("id");

      if (tenantsError) throw tenantsError;

      setProgress(60);

      // Create daily payments for each tenant
      const allPayments = [];
      const today = new Date();

      insertedTenants?.forEach((tenant, index) => {
        const tenantData = tenantsToAdd[index];
        const totalAmount =
          tenantData.rent_amount +
          tenantData.registration_fee +
          tenantData.access_fee;
        const dailyInstallment = Math.ceil(totalAmount / tenantData.repayment_days);

        for (let i = 0; i < tenantData.repayment_days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          allPayments.push({
            tenant_id: tenant.id,
            date: date.toISOString().split("T")[0],
            amount: dailyInstallment,
            paid: false,
          });
        }
      });

      const { error: paymentsError } = await supabase
        .from("daily_payments")
        .insert(allPayments);

      if (paymentsError) console.error("Payments error:", paymentsError);

      setProgress(80);

      // Create agent earnings
      const allEarnings = insertedTenants?.map((tenant, index) => ({
        agent_phone: tenantsToAdd[index].agent_phone,
        agent_name: tenantsToAdd[index].agent_name,
        tenant_id: tenant.id,
        amount: 5000,
        earning_type: "signup_bonus",
      }));

      const { error: earningsError } = await supabase
        .from("agent_earnings")
        .insert(allEarnings);

      if (earningsError) console.error("Earnings error:", earningsError);

      setProgress(100);

      setResult({
        success: insertedTenants?.length || 0,
        failed: 0,
        duplicates: dataRows.length - tenantsToAdd.length,
      });

      toast.success(
        `Successfully imported ${insertedTenants?.length || 0} tenants!`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import tenants");
      setResult({ success: 0, failed: 1, duplicates: 0 });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          ← Back to Dashboard
        </Button>

        <div className="bg-card rounded-lg border p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Auto Import Tenants</h1>
            <p className="text-muted-foreground">
              Import tenants from ADEKE_ANNET_JUNE_12345-2.xlsx
            </p>
          </div>

          {!result && (
            <Button
              onClick={handleAutoImport}
              disabled={importing}
              className="w-full"
              size="lg"
            >
              {importing ? `Importing... ${progress}%` : "Start Import"}
            </Button>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Processing tenants...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Successfully imported:</span>
                  <span className="font-semibold text-green-600">{result.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duplicates skipped:</span>
                  <span className="font-semibold text-yellow-600">{result.duplicates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-semibold text-red-600">{result.failed}</span>
                </div>
              </div>

              <Button onClick={() => navigate("/")} className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </div>
          )}

          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Import Details</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All tenants will be added with basic information</li>
              <li>• Missing fields (rent amount, landlord, etc.) set to defaults</li>
              <li>• Edit individual tenants to complete their information</li>
              <li>• Duplicates are automatically skipped</li>
              <li>• Agent: ADEKE ANNET</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoImportTenants;
