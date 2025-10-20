import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { calculateRepaymentDetails } from "@/data/tenants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Edit2, Check, X, Trash2 } from "lucide-react";
import { WelileLogo } from "@/components/WelileLogo";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import { usePayments } from "@/hooks/usePayments";
import { EditTenantForm } from "@/components/EditTenantForm";

const ITEMS_PER_PAGE = 10;

export default function RepaymentSchedule() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenants } = useTenants();
  const tenant = tenants.find(t => t.id === tenantId);
  const { payments, updatePayment } = usePayments(tenantId || "");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [recordedByName, setRecordedByName] = useState<string>("");
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState<number | null>(null);
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Tenant not found</h1>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const repaymentDetails = calculateRepaymentDetails(
    tenant?.rentAmount || 0, 
    tenant?.repaymentDays || 30
  );
  const totalPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayments = payments.slice(startIndex, endIndex);
  
  const paidPayments = payments.filter(p => p.paid).length;
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const progressPercentage = (totalPaid / repaymentDetails.totalAmount) * 100;

  const handleRecordPayment = async (index: number) => {
    const actualIndex = startIndex + index;
    const amount = parseFloat(paymentAmount);
    const payment = payments[actualIndex] as any;
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (!recordedByName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePayment({
        paymentId: payment._id,
        updates: {
          paid: true,
          paidAmount: amount,
          recordedBy: recordedByName.trim(),
          recordedAt: new Date().toISOString(),
        },
      });

      setPaymentAmount("");
      setRecordedByName("");
      setSelectedPaymentIndex(null);
      
      toast({
        title: "Payment Recorded",
        description: `UGX ${amount.toLocaleString()} recorded by ${recordedByName}`,
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleEditPayment = (index: number) => {
    const actualIndex = startIndex + index;
    const payment = payments[actualIndex];
    setPaymentAmount((payment.paidAmount || 0).toString());
    setRecordedByName("");
    setEditingPaymentIndex(index);
  };

  const handleUpdatePayment = async (index: number) => {
    const actualIndex = startIndex + index;
    const amount = parseFloat(paymentAmount);
    const payment = payments[actualIndex] as any;
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (!recordedByName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePayment({
        paymentId: payment._id,
        updates: {
          paid: true,
          paidAmount: amount,
          modifiedBy: recordedByName.trim(),
          modifiedAt: new Date().toISOString(),
        },
      });

      setPaymentAmount("");
      setRecordedByName("");
      setEditingPaymentIndex(null);
      
      toast({
        title: "Payment Updated",
        description: `Updated by ${recordedByName}`,
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (index: number) => {
    const actualIndex = startIndex + index;
    const payment = payments[actualIndex] as any;
    
    if (!recordedByName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to delete this payment",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePayment({
        paymentId: payment._id,
        updates: {
          paid: false,
          paidAmount: 0,
          modifiedBy: recordedByName.trim(),
          modifiedAt: new Date().toISOString(),
        },
      });

      setEditingPaymentIndex(null);
      setPaymentAmount("");
      setRecordedByName("");
      
      toast({
        title: "Payment Deleted",
        description: `Deleted by ${recordedByName.trim()}`,
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <WelileLogo />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Tenant Info Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-secondary/20">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
                <p className="text-muted-foreground">{tenant.contact}</p>
                <p className="text-sm text-muted-foreground mt-1">{tenant.address}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="mb-2">
                  {tenant.status}
                </Badge>
                <p className="text-sm text-muted-foreground">Landlord: {tenant.landlord}</p>
                <EditTenantForm tenant={tenant} />
              </div>
            </div>
          </div>
        </Card>

        {/* Repayment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rent Amount</p>
                <p className="text-xl font-bold">UGX {tenant.rentAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registration Fee</p>
                <p className="text-xl font-bold">UGX {repaymentDetails.registrationFee.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Fees (33%)</p>
                <p className="text-xl font-bold">UGX {repaymentDetails.accessFees.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-primary">UGX {repaymentDetails.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Repayment Schedule</h2>
              <p className="text-sm text-muted-foreground">
                {`${repaymentDetails.repaymentDays} days - UGX ${repaymentDetails.dailyInstallment.toLocaleString()} per day`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{paidPayments} / {payments.length} days paid</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">UGX {totalPaid.toLocaleString()} paid</span>
              <span className="font-medium text-primary">{progressPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        {/* Daily Payments Table */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Daily Installments</h3>
          <div className="space-y-2">
            {currentPayments.map((payment, index) => (
              <div 
                key={startIndex + index}
                className={`p-4 rounded-lg border ${
                  payment.paid 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-card border-border'
                } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    payment.paid ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {payment.paid ? <Check className="w-4 h-4" /> : startIndex + index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{payment.date}</p>
                    <p className="text-sm text-muted-foreground">
                      Day {startIndex + index + 1} - UGX {payment.amount.toLocaleString()}
                    </p>
                    {payment.recordedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Recorded by: <span className="font-medium text-foreground">{payment.recordedBy}</span>
                        {payment.recordedAt && (
                          <span className="ml-1">
                            on {new Date(payment.recordedAt).toLocaleString()}
                          </span>
                        )}
                      </p>
                    )}
                    {payment.modifiedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Modified by: <span className="font-medium text-foreground">{payment.modifiedBy}</span>
                        {payment.modifiedAt && (
                          <span className="ml-1">
                            on {new Date(payment.modifiedAt).toLocaleString()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {payment.paid ? (
                    editingPaymentIndex === index ? (
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full sm:w-32"
                          />
                          <Input
                            type="text"
                            placeholder="Your name"
                            value={recordedByName}
                            onChange={(e) => setRecordedByName(e.target.value)}
                            className="w-full sm:w-40"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdatePayment(index)} className="flex-1">
                            <Check className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeletePayment(index)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditingPaymentIndex(null);
                              setPaymentAmount("");
                              setRecordedByName("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Paid: UGX {(payment.paidAmount || 0).toLocaleString()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditPayment(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  ) : selectedPaymentIndex === index ? (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full sm:w-32"
                        />
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={recordedByName}
                          onChange={(e) => setRecordedByName(e.target.value)}
                          className="w-full sm:w-40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRecordPayment(index)} className="flex-1">
                          Record
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setSelectedPaymentIndex(null);
                            setPaymentAmount("");
                            setRecordedByName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setSelectedPaymentIndex(index)}>
                      Record Payment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
