import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, TrendingUp, Calendar, DollarSign, Trash2, Wallet, UserCheck, Edit, MessageSquare, Send } from "lucide-react";
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
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'review': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-accent/10 text-accent border-accent/20';
      case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600 dark:text-green-400';
    if (performance >= 75) return 'text-primary';
    return 'text-amber-600 dark:text-amber-400';
  };

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
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
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

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={getStatusColor(tenant.status)}>
            {tenant.status}
          </Badge>
          <Badge variant="outline" className={getPaymentColor(tenant.paymentStatus)}>
            {tenant.paymentStatus}
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

        {/* Comments Section */}
        <Collapsible 
          open={isCommentsOpen} 
          onOpenChange={(open) => {
            setIsCommentsOpen(open);
            if (!open) resetPage(); // Reset pagination when closing
          }}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments ({totalComments})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent
            className="mt-3 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Comment Form */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <Input
                placeholder="Your name"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button
                size="sm"
                className="w-full"
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
                Add Comment
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
      </div>
    </Card>
  );
};
