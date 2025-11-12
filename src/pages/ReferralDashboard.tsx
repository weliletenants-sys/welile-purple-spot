import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackToHome } from "@/components/BackToHome";
import { WelileLogo } from "@/components/WelileLogo";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { useReferralStats } from "@/hooks/useReferralStats";
import {
  DollarSign,
  Users,
  TrendingUp,
  Trophy,
  Search,
  Phone,
  MapPin,
  Calendar,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

const ReferralDashboard = () => {
  const { data: referrers, isLoading } = useReferralStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);

  const filteredReferrers = referrers?.filter(
    (referrer) =>
      referrer.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referrer.referrerPhone.includes(searchTerm)
  );

  const totalEarnings = referrers?.reduce((sum, r) => sum + r.totalEarnings, 0) || 0;
  const totalTenants = referrers?.reduce((sum, r) => sum + r.totalTenants, 0) || 0;
  const totalReferrers = referrers?.length || 0;

  const shareUrl = `${window.location.origin}/add-pipeline`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackToHome />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <WelileLogo />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            Referral Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your referral earnings and see who's leading the pack!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total Earnings Distributed</CardDescription>
              <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                <DollarSign className="h-8 w-8" />
                UGX {totalEarnings.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {totalTenants} tenants referred in total
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total Referrers</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                <Users className="h-8 w-8" />
                {totalReferrers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active community members earning</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Average Earnings</CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-600 flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                UGX {totalReferrers > 0 ? Math.round(totalEarnings / totalReferrers).toLocaleString() : 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Per referrer</p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/30">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="h-6 w-6" />
                  Start Earning Today!
                </h3>
                <p className="text-muted-foreground">
                  Share the referral page and earn UGX 100 for every tenant added
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open("/add-pipeline", "_blank")}
                  size="lg"
                  className="gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  Add Tenant & Earn
                </Button>
                <WhatsAppShareButton
                  message={`🎉 EARN UGX 100 FOR EVERY TENANT YOU ADD! 💰

Join me on the Welile Referral Leaderboard!

✅ Add pipeline tenants from anywhere in Uganda
✅ Get paid UGX 100 instantly
✅ Track your earnings on the dashboard

Start earning now: ${shareUrl}`}
                  variant="outline"
                  size="lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Referrers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              All-time referral rankings. Click on a referrer to see their referred tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredReferrers && filteredReferrers.length > 0 ? (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredReferrers.map((referrer, index) => (
                    <Card
                      key={`${referrer.referrerName}-${referrer.referrerPhone}`}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        index === 0
                          ? "border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20"
                          : index === 1
                          ? "border-2 border-gray-400 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20"
                          : index === 2
                          ? "border-2 border-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() =>
                        setExpandedReferrer(
                          expandedReferrer === `${referrer.referrerName}-${referrer.referrerPhone}`
                            ? null
                            : `${referrer.referrerName}-${referrer.referrerPhone}`
                        )
                      }
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {index === 0 ? (
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl">
                                  🥇
                                </div>
                              ) : index === 1 ? (
                                <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xl">
                                  🥈
                                </div>
                              ) : index === 2 ? (
                                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                  🥉
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                                  #{index + 1}
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-lg">{referrer.referrerName}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {referrer.referrerPhone}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              UGX {referrer.totalEarnings.toLocaleString()}
                            </div>
                            <Badge variant="secondary" className="mt-2">
                              {referrer.totalTenants} tenant{referrer.totalTenants !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </div>

                        {/* Expanded Tenant Details */}
                        {expandedReferrer === `${referrer.referrerName}-${referrer.referrerPhone}` && (
                          <div className="mt-6 pt-6 border-t">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Referred Tenants ({referrer.totalTenants})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tenant Name</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>District</TableHead>
                                  <TableHead>Date Added</TableHead>
                                  <TableHead className="text-right">Earned</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {referrer.tenants.map((tenant) => (
                                  <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {tenant.contact}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {tenant.district}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(tenant.createdAt), "MMM dd, yyyy")}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                      UGX {tenant.earnings.toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Referrers Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to earn by referring pipeline tenants!
                </p>
                <Button onClick={() => window.open("/add-pipeline", "_blank")}>
                  Start Earning Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferralDashboard;
