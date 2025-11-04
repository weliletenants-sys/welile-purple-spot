import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Award } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateProps {
  agentName: string;
  rank: number;
  period: string;
  totalAmount: number;
  paymentsCount: number;
}

export const PerformanceCertificate = ({ 
  agentName, 
  rank, 
  period, 
  totalAmount, 
  paymentsCount 
}: CertificateProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate-${agentName}-${period.replace(/\s+/g, '-')}.pdf`);
      
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', title: 'First Place', color: 'text-yellow-600' };
    if (rank === 2) return { emoji: '🥈', title: 'Second Place', color: 'text-gray-500' };
    if (rank === 3) return { emoji: '🥉', title: 'Third Place', color: 'text-amber-700' };
    return { emoji: '🏆', title: `#${rank} Position`, color: 'text-primary' };
  };

  const badge = getRankBadge(rank);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={downloadCertificate}>
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
      </div>

      <div
        ref={certificateRef}
        className="bg-white p-12 rounded-lg shadow-2xl border-8 border-double border-yellow-600"
        style={{ width: '297mm', maxWidth: '100%', aspectRatio: '1.414' }}
      >
        {/* Certificate Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Award className="h-24 w-24 text-yellow-600" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                {badge.emoji}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-gray-800 mb-2">
              Certificate of Excellence
            </h1>
            <p className="text-xl text-gray-600">
              Outstanding Performance Award
            </p>
          </div>

          <div className="my-8 border-t-2 border-b-2 border-yellow-600 py-6">
            <p className="text-2xl text-gray-700 mb-4">This certifies that</p>
            <h2 className="text-6xl font-bold text-primary mb-4">
              {agentName}
            </h2>
            <p className="text-2xl text-gray-700">
              has achieved
            </p>
          </div>

          {/* Achievement Details */}
          <div className="space-y-4 bg-gradient-to-r from-yellow-50 to-amber-50 p-8 rounded-lg">
            <div className="text-center">
              <p className={`text-5xl font-bold ${badge.color} mb-2`}>
                {badge.title}
              </p>
              <p className="text-xl text-gray-600">
                for the period of {period}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-yellow-300">
              <div>
                <p className="text-gray-600 text-lg">Total Collections</p>
                <p className="text-3xl font-bold text-gray-800">
                  UGX {totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-lg">Payments Recorded</p>
                <p className="text-3xl font-bold text-gray-800">
                  {paymentsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="border-t-2 border-gray-400 inline-block w-48 mb-2"></div>
                <p className="text-sm text-gray-600">Date Issued</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <div className="border-t-2 border-gray-400 inline-block w-48 mb-2"></div>
                <p className="text-sm text-gray-600">Management</p>
                <p className="font-semibold">Welile Management</p>
              </div>
              <div>
                <div className="border-t-2 border-gray-400 inline-block w-48 mb-2"></div>
                <p className="text-sm text-gray-600">Certificate ID</p>
                <p className="font-semibold">
                  {`WEL-${new Date().getFullYear()}-${String(rank).padStart(3, '0')}`}
                </p>
              </div>
            </div>
          </div>

          {/* Seal */}
          <div className="flex justify-center mt-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-700 shadow-lg">
                <Award className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                OFFICIAL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
