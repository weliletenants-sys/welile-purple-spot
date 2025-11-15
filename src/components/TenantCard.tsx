import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, TrendingUp, Calendar, DollarSign, Trash2, Wallet, UserCheck, Edit, MessageSquare, Send, CreditCard, Sparkles, ArrowLeftRight } from "lucide-react";
import { Tenant, calculateRepaymentDetails } from "@/data/tenants";
import { useNavigate } from "react-router-dom";
import { EditTenantForm } from "./EditTenantForm";
import { useTenants } from "@/hooks/useTenants";
import { useToast } from "@/hooks/use-toast";
import { ContactButtons } from "./ContactButtons";
import { usePayments } from "@/hooks/usePayments";
import { useTenantComments } from "@/hooks/useTenantComments";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransferTenantDialog } from "./TransferTenantDialog";
import { TenantTransferHistory } from "./TenantTransferHistory";
import { PriorityIndicator, PriorityLevel } from "@/components/PriorityIndicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TenantCardProps {
  tenant: Tenant;
  tenantNumber?: number;
  isFiltered?: boolean;
}

export const TenantCard = ({ tenant, tenantNumber, isFiltered = false }: TenantCardProps) => {
  const navigate = useNavigate();
  const { deleteTenant } = useTenants();
  const { toast } = useToast();
  const repaymentDetails = calculateRepaymentDetails(tenant.rentAmount, tenant.repaymentDays);
  const { payments } = usePayments(tenant.id);
  const { comments, totalComments, addComment, deleteComment, hasMore, loadMore, resetPage } = useTenantComments(tenant.id);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commenterName, setCommenterName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Calculate balance for this tenant
  const totalPaid = payments?.filter(p => p.paid).reduce((sum, p) => sum + (p.paidAmount || p.amount), 0) || 0;
  const totalExpected = tenant.rentAmount + (tenant.registrationFee || 0) + (tenant.accessFee || 0);
  const balance = totalExpected - totalPaid;

  const handleDelete = async () => {
    try {
      await deleteTenant(tenant.id);
      toast({
        title: "Success",
        description: "Tenant deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-500 border-2';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-500 border-2';
      case 'review': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-500 border-2';
      default: return 'bg-muted text-muted-foreground border-2';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-500 border-2';
      case 'cleared': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-500 border-2';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-500 border-2';
      case 'overdue': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-500 border-2';
      default: return 'bg-muted text-muted-foreground border-2';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 75) return 'text-primary';
    return 'text-amber-600 dark:text-amber-400';
  };

  // Determine priority level based on payment status and performance
  const getPriorityLevel = (): PriorityLevel => {
    if (tenant.paymentStatus === 'overdue') return 'critical';
    if (tenant.paymentStatus === 'pending' && tenant.performance < 60) return 'high';
    if (tenant.performance < 70) return 'medium';
    if (tenant.status === 'pending') return 'medium';
    return 'low';
  };

  const priorityLevel = getPriorityLevel();

  return (
    <Card 
      className={`group p-6 hover:shadow-[var(--shadow-purple)] transition-all duration-300 border-border hover:-translate-y-1 cursor-pointer ${
        isFiltered 
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30' 
          : 'bg-gradient-to-br from-card to-secondary/20'
      }`}
      onClick={() => navigate(`/tenant/${tenant.id}`)}
    >
      <div className="space-y-4">
        {/* Header with Name, Performance and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-lg shrink-0">
              {tenant.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {tenantNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold">
                    #{tenantNumber}
                  </span>
                )}
                <h3 className={`font-semibold text-lg group-hover:text-primary transition-colors truncate ${
                  (tenant.status as string) === 'pipeline' 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-foreground'
                }`}>
                  {tenant.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{tenant.contact}</span>
                <ContactButtons phoneNumber={tenant.contact} iconOnly />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`flex items-center gap-1 font-bold text-xl ${getPerformanceColor(tenant.performance)}`}>
              <TrendingUp className="w-5 h-5" />
              {tenant.performance}%
            </div>
            <div className="flex items-center gap-1">
              <EditTenantForm tenant={tenant}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Edit className="h-4 w-4 text-primary" />
                </Button>
              </EditTenantForm>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {tenant.name}'s record and all associated payment data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Status Badges with Priority Indicator */}
        <div className="flex gap-3 flex-wrap items-center">
          <PriorityIndicator 
            priority={priorityLevel} 
            size="sm"
            animate={priorityLevel === 'critical'}
            tooltip={
              priorityLevel === 'critical' ? 'Urgent attention required!' :
              priorityLevel === 'high' ? 'Needs attention soon' :
              priorityLevel === 'medium' ? 'Monitor closely' :
              'On track'
            }
          />
          <Badge variant="outline" className={`${getStatusColor(tenant.status)} px-4 py-2 text-base font-bold shadow-sm`}>
            {tenant.status === 'active' && '✅ '}
            {tenant.status === 'pending' && '⏳ '}
            {tenant.status === 'review' && '⚠️ '}
            {tenant.status.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={`${getPaymentColor(tenant.paymentStatus)} px-4 py-2 text-base font-bold shadow-sm`}>
            {tenant.paymentStatus === 'paid' && '✅ '}
            {tenant.paymentStatus === 'cleared' && '✅ '}
            {tenant.paymentStatus === 'pending' && '⏳ '}
            {tenant.paymentStatus === 'overdue' && '❌ '}
            {tenant.paymentStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">{tenant.address}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <User className="w-4 h-4 text-accent mt-0.5" />
            <div className="flex-1">
              <p className="text-foreground font-medium">{tenant.landlord}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-xs">{tenant.landlordContact}</p>
                <ContactButtons phoneNumber={tenant.landlordContact} iconOnly />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Agent</p>
              {tenant.agentName ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                    <p className="text-foreground font-bold text-base">{tenant.agentName}</p>
                  </div>
                  {tenant.agentPhone && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-muted-foreground text-xs">{tenant.agentPhone}</p>
                      <ContactButtons phoneNumber={tenant.agentPhone} iconOnly />
                    </div>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-dashed border-muted-foreground/30">
                  <p className="text-muted-foreground text-sm italic">No agent assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Balance - Prominent */}
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
                <p className="text-2xl font-bold text-foreground">UGX {balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Repayment Info */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Schedule:</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {tenant.repaymentDays} days
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Daily:</span>
            </div>
            <span className="font-bold text-foreground">UGX {repaymentDetails.dailyInstallment.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Expected:</span>
            <span className="font-bold text-primary">UGX {repaymentDetails.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-bold text-green-600 dark:text-green-400">UGX {totalPaid.toLocaleString()}</span>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="pt-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tenant.performance >= 90 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : tenant.performance >= 75 
                  ? 'bg-gradient-to-r from-primary to-accent'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
              style={{ width: `${tenant.performance}%` }}
            />
          </div>
        </div>

        {/* Edit History */}
        {tenant.editedBy && (
          <div className="pt-2 mt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last edited by <span className="font-medium text-foreground">{tenant.editedBy}</span>
              {tenant.editedAt && (
                <> on {new Date(tenant.editedAt).toLocaleDateString()} at {new Date(tenant.editedAt).toLocaleTimeString()}</>
              )}
            </p>
          </div>
        )}

        {/* Action Buttons - Prominent and Attractive */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
          {/* Record Payment Button */}
          <Button
            className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tenant/${tenant.id}`);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <CreditCard className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Pay</span>
            <Sparkles className="w-3 h-3 ml-1 group-hover:animate-pulse" />
          </Button>

          {/* Comments Button */}
          <Button
            className="relative overflow-hidden group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentsOpen(!isCommentsOpen);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <MessageSquare className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Notes</span>
            {totalComments > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold animate-pulse">
                {totalComments}
              </span>
            )}
          </Button>

          {/* Transfer Button */}
          <Button
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setIsTransferOpen(true);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <ArrowLeftRight className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-semibold">Move</span>
          </Button>
        </div>

        {/* Comments Section Collapsible */}
        <Collapsible 
          open={isCommentsOpen} 
          onOpenChange={(open) => {
            setIsCommentsOpen(open);
            if (!open) resetPage(); // Reset pagination when closing
          }}
        >
          <CollapsibleContent
            className="mt-3 space-y-3 animate-accordion-down"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Comment Form */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 space-y-3 animate-scale-in">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-foreground">Add Your Comment</h4>
              </div>
              <Input
                placeholder="Enter your name"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                className="text-sm border-purple-300 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-500"
              />
              <Textarea
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-sm min-h-[80px] border-purple-300 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-500"
              />
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  if (commenterName.trim() && commentText.trim()) {
                    addComment.mutate({
                      commenterName: commenterName.trim(),
                      commentText: commentText.trim(),
                    });
                    setCommenterName("");
                    setCommentText("");
                  }
                }}
                disabled={!commenterName.trim() || !commentText.trim() || addComment.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                <span className="font-semibold">Post Comment</span>
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-2">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.commenter_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()} at{" "}
                            {new Date(comment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {comment.comment_text}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComment.mutate(comment.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMore();
                  }}
                >
                  Load More Comments ({totalComments - comments.length} remaining)
                </Button>
              )}

              {/* Showing X of Y indicator */}
              {totalComments > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing {comments.length} of {totalComments} comment{totalComments !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Service Center Transfer History */}
        {tenant.serviceCenter && (
          <div className="pt-3 border-t border-border">
            <TenantTransferHistory tenantId={tenant.id} />
          </div>
        )}
      </div>

      {/* Transfer Tenant Dialog */}
      <TransferTenantDialog
        tenant={tenant}
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
      />
    </Card>
  );
};
