import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportData {
  title: string;
  stats: Array<{ label: string; value: string | number }>;
  timestamp: string;
}

export const exportToPDF = (data: ExportData) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(data.title, 14, 20);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${data.timestamp}`, 14, 30);
    
    // Add stats table
    const tableData = data.stats.map(stat => [stat.label, String(stat.value)]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [126, 58, 242] },
      styles: { fontSize: 10 },
    });
    
    // Save the PDF
    doc.save(`${data.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    
    toast.success("PDF exported successfully!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export PDF");
  }
};

export const exportToCSV = (data: ExportData) => {
  try {
    // Create CSV content
    let csv = `${data.title}\n`;
    csv += `Generated: ${data.timestamp}\n\n`;
    csv += "Metric,Value\n";
    
    data.stats.forEach(stat => {
      csv += `"${stat.label}","${stat.value}"\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${data.title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported successfully!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export CSV");
  }
};

export const ExportButtons = ({ 
  data,
  variant = "outline"
}: { 
  data: ExportData;
  variant?: "outline" | "default" | "ghost" | "destructive" | "secondary" | "link";
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size="sm"
        onClick={() => exportToPDF(data)}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      <Button
        variant={variant}
        size="sm"
        onClick={() => exportToCSV(data)}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
};
