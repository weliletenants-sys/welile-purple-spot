import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export const AllTenantsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all tenants
      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!tenants || tenants.length === 0) {
        toast({
          title: "No Data",
          description: "No tenants found to export.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // Format data for export
      const exportData = tenants.map((tenant) => ({
        "Tenant Name": tenant.name,
        "Contact": tenant.contact,
        "Address": tenant.address,
        "Landlord": tenant.landlord,
        "Landlord Contact": tenant.landlord_contact,
        "Agent Name": tenant.agent_name,
        "Agent Phone": tenant.agent_phone,
        "Status": tenant.status,
        "Payment Status": tenant.payment_status,
        "Monthly Rent (UGX)": Number(tenant.rent_amount).toLocaleString(),
        "Registration Fee (UGX)": Number(tenant.registration_fee).toLocaleString(),
        "Access Fee (UGX)": Number(tenant.access_fee).toLocaleString(),
        "Repayment Days": tenant.repayment_days,
        "Service Center": tenant.service_center || "N/A",
        "District": tenant.location_district || "N/A",
        "County": tenant.location_county || "N/A",
        "Subcounty/Ward": tenant.location_subcounty_or_ward || "N/A",
        "Village/Cell": tenant.location_cell_or_village || "N/A",
        "Guarantor 1 Name": tenant.guarantor1_name || "N/A",
        "Guarantor 1 Contact": tenant.guarantor1_contact || "N/A",
        "Guarantor 2 Name": tenant.guarantor2_name || "N/A",
        "Guarantor 2 Contact": tenant.guarantor2_contact || "N/A",
        "Source": tenant.source || "manual",
        "Created At": new Date(tenant.created_at).toLocaleDateString(),
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // Tenant Name
        { wch: 15 }, // Contact
        { wch: 35 }, // Address
        { wch: 25 }, // Landlord
        { wch: 15 }, // Landlord Contact
        { wch: 20 }, // Agent Name
        { wch: 15 }, // Agent Phone
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 18 }, // Monthly Rent
        { wch: 18 }, // Registration Fee
        { wch: 15 }, // Access Fee
        { wch: 15 }, // Repayment Days
        { wch: 20 }, // Service Center
        { wch: 15 }, // District
        { wch: 15 }, // County
        { wch: 18 }, // Subcounty/Ward
        { wch: 15 }, // Village/Cell
        { wch: 20 }, // Guarantor 1 Name
        { wch: 15 }, // Guarantor 1 Contact
        { wch: 20 }, // Guarantor 2 Name
        { wch: 15 }, // Guarantor 2 Contact
        { wch: 12 }, // Source
        { wch: 15 }, // Created At
      ];

      XLSX.utils.book_append_sheet(wb, ws, "All Tenants");

      // Export file
      const fileName = `All_Tenants_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Export Successful",
        description: `Exported ${tenants.length} tenants to Excel`,
      });
    } catch (error: any) {
      console.error("Error exporting tenant data:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export tenant data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
      variant="outline"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export All Tenants
        </>
      )}
    </Button>
  );
};
