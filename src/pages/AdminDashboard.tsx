import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { ReportsSection } from "@/components/ReportsSection";
import { ReportGenerator } from "@/components/ReportGenerator";
import { ReportComparison } from "@/components/ReportComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, LogOut, Clock, FileText, LineChart, GitCompare } from "lucide-react";
import { format } from "date-fns";

const ADMIN_ACCESS_CODE = "Mypart@welile";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { requests, isLoading, updateRequest } = useWithdrawalRequests();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const accessCode = sessionStorage.getItem("adminAccessCode");
    if (accessCode !== ADMIN_ACCESS_CODE) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleApprove = async (id: string) => {
    await updateRequest({ id, status: 'approved', notes });
    setSelectedRequest(null);
    setNotes("");
  };

  const handleReject = async (id: string) => {
    await updateRequest({ id, status: 'rejected', notes });
    setSelectedRequest(null);
    setNotes("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAccessCode");
    navigate('/admin-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage withdrawal requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/monthly-summary')}>
              <FileText className="h-4 w-4 mr-2" />
              Monthly Summary
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Withdrawal Requests</TabsTrigger>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            <TabsTrigger value="generator">
              <LineChart className="h-4 w-4 mr-2" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <GitCompare className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {/* Pending Requests */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              Review and approve agent commission withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending withdrawal requests
              </p>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{request.agent_name}</h3>
                          <p className="text-sm text-muted-foreground">{request.agent_phone}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {format(new Date(request.requested_at), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            UGX {request.amount.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {request.status}
                          </Badge>
                        </div>
                      </div>

                      {selectedRequest === request.id && (
                        <div className="space-y-3 pt-2">
                          <Separator />
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Notes (optional)</label>
                            <Textarea
                              placeholder="Add any notes about this request..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {selectedRequest === request.id ? (
                          <>
                            <Button
                              onClick={() => handleApprove(request.id)}
                              className="flex-1"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Approval
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              className="flex-1"
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Confirm Rejection
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedRequest(null);
                                setNotes("");
                              }}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => setSelectedRequest(request.id)}
                              className="flex-1"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => setSelectedRequest(request.id)}
                              className="flex-1"
                              variant="outline"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
              <CardDescription>Recently approved or rejected requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {processedRequests.map((request) => (
                <Card key={request.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{request.agent_name}</h4>
                        <p className="text-sm text-muted-foreground">{request.agent_phone}</p>
                        <p className="text-xs text-muted-foreground">
                          Processed: {request.processed_at ? format(new Date(request.processed_at), 'PPp') : 'N/A'}
                        </p>
                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Note: {request.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xl font-semibold">
                          UGX {request.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={request.status === 'approved' ? 'default' : 'destructive'}
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="reports">
            <ReportsSection />
          </TabsContent>

          <TabsContent value="generator">
            <ReportGenerator />
          </TabsContent>

          <TabsContent value="comparison">
            <ReportComparison />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;