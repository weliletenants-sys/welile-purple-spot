import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export const LandlordGroupedExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all tenants
      const { data: tenants, error } = await supabase
        .from("tenants")
        .select("name, contact, address, landlord, landlord_contact, rent_amount, status, service_center")
        .order("landlord_contact");

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

      // Group tenants by landlord contact
      const landlordGroups = new Map<string, Array<typeof tenants[0]>>();
      
      tenants.forEach(tenant => {
        const landlordKey = tenant.landlord_contact || "No Contact";
        if (!landlordGroups.has(landlordKey)) {
          landlordGroups.set(landlordKey, []);
        }
        landlordGroups.get(landlordKey)!.push(tenant);
      });

      // Create summary data for landlords with multiple properties
      const summaryData: any[] = [];
      const detailedData: any[] = [];

      landlordGroups.forEach((tenantList, landlordContact) => {
        const landlordName = tenantList[0].landlord || "Unknown Landlord";
        const propertyCount = tenantList.length;
        const totalRent = tenantList.reduce((sum, t) => sum + (Number(t.rent_amount) || 0), 0);
        const activeTenants = tenantList.filter(t => t.status === "active").length;
        const serviceCenters = [...new Set(tenantList.map(t => t.service_center).filter(Boolean))].join(", ");

        // Add to summary if multiple properties
        if (propertyCount > 1) {
          summaryData.push({
            "Landlord Name": landlordName,
            "Landlord Contact": landlordContact,
            "Total Properties": propertyCount,
            "Active Tenants": activeTenants,
            "Total Monthly Rent (UGX)": totalRent.toLocaleString(),
            "Service Centers": serviceCenters || "N/A",
          });
        }

        // Add to detailed data
        tenantList.forEach((tenant, index) => {
          detailedData.push({
            "Landlord Name": landlordName,
            "Landlord Contact": landlordContact,
            "Property #": index + 1,
            "Tenant Name": tenant.name,
            "Tenant Contact": tenant.contact,
            "Address": tenant.address,
            "Monthly Rent (UGX)": Number(tenant.rent_amount).toLocaleString(),
            "Status": tenant.status,
            "Service Center": tenant.service_center || "N/A",
          });
        });
      });

      // Sort summary by property count (descending)
      summaryData.sort((a, b) => b["Total Properties"] - a["Total Properties"]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add summary sheet (landlords with multiple properties)
      if (summaryData.length > 0) {
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        
        // Set column widths
        summaryWs['!cols'] = [
          { wch: 25 }, // Landlord Name
          { wch: 15 }, // Landlord Contact
          { wch: 15 }, // Total Properties
          { wch: 15 }, // Active Tenants
          { wch: 20 }, // Total Monthly Rent
          { wch: 30 }, // Service Centers
        ];
        
        XLSX.utils.book_append_sheet(wb, summaryWs, "Multiple Properties");
      }

      // Add detailed sheet (all tenants grouped by landlord)
      const detailedWs = XLSX.utils.json_to_sheet(detailedData);
      
      // Set column widths
      detailedWs['!cols'] = [
        { wch: 25 }, // Landlord Name
        { wch: 15 }, // Landlord Contact
        { wch: 12 }, // Property #
        { wch: 25 }, // Tenant Name
        { wch: 15 }, // Tenant Contact
        { wch: 30 }, // Address
        { wch: 18 }, // Monthly Rent
        { wch: 12 }, // Status
        { wch: 20 }, // Service Center
      ];
      
      XLSX.utils.book_append_sheet(wb, detailedWs, "All Properties by Landlord");

      // Add statistics sheet
      const statsData = [
        { Metric: "Total Landlords", Value: landlordGroups.size },
        { Metric: "Landlords with Multiple Properties", Value: summaryData.length },
        { Metric: "Total Tenants", Value: tenants.length },
        { 
          Metric: "Average Properties per Landlord", 
          Value: (tenants.length / landlordGroups.size).toFixed(2) 
        },
        {
          Metric: "Most Properties by Single Landlord",
          Value: summaryData.length > 0 ? summaryData[0]["Total Properties"] : 0
        },
      ];
      
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      statsWs['!cols'] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, statsWs, "Statistics");

      // Export file
      const fileName = `Landlords_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Export Successful",
        description: `Exported ${landlordGroups.size} landlords and ${tenants.length} properties`,
      });
    } catch (error: any) {
      console.error("Error exporting landlord data:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export landlord data",
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
          Export Landlords Report
        </>
      )}
    </Button>
  );
};
