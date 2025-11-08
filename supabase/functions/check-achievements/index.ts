import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userIdentifier, action, metadata } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newBadges: string[] = [];

    // Check for badges based on action type
    switch (action) {
      case "tenant_added":
        await checkTenantMilestones(supabase, userIdentifier, newBadges);
        break;
      
      case "payment_recorded":
        await checkPaymentMilestones(supabase, userIdentifier, newBadges);
        await checkTimeBasedBadges(supabase, userIdentifier, metadata, newBadges);
        break;
      
      case "report_generated":
        await checkReportMilestones(supabase, userIdentifier, newBadges);
        break;
      
      case "onboarding_complete":
        await awardBadge(supabase, userIdentifier, "Welcome Aboard", newBadges);
        break;
      
      case "section_visited":
        await checkExplorerBadge(supabase, userIdentifier, metadata, newBadges);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, newBadges }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Achievement check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function checkTenantMilestones(supabase: any, userIdentifier: string, newBadges: string[]) {
  const { count } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .or(`agent_phone.eq.${userIdentifier},agent_name.eq.${userIdentifier}`);

  const milestones = [
    { count: 1, badge: "First Steps" },
    { count: 10, badge: "Team Builder" },
    { count: 50, badge: "Growth Expert" },
    { count: 100, badge: "Master Recruiter" },
  ];

  for (const milestone of milestones) {
    if (count >= milestone.count) {
      await awardBadge(supabase, userIdentifier, milestone.badge, newBadges);
    }
  }
}

async function checkPaymentMilestones(supabase: any, userIdentifier: string, newBadges: string[]) {
  const { count } = await supabase
    .from("daily_payments")
    .select("*", { count: "exact", head: true })
    .eq("recorded_by", userIdentifier)
    .eq("paid", true);

  const milestones = [
    { count: 1, badge: "Payment Pro" },
    { count: 100, badge: "Collection Champion" },
  ];

  for (const milestone of milestones) {
    if (count >= milestone.count) {
      await awardBadge(supabase, userIdentifier, milestone.badge, newBadges);
    }
  }
}

async function checkTimeBasedBadges(supabase: any, userIdentifier: string, metadata: any, newBadges: string[]) {
  if (!metadata?.recordedAt) return;

  const hour = new Date(metadata.recordedAt).getHours();
  
  if (hour < 9) {
    // Check for Early Bird badge
    const { count } = await supabase
      .from("daily_payments")
      .select("*", { count: "exact", head: true })
      .eq("recorded_by", userIdentifier);
    
    if (count >= 5) {
      await awardBadge(supabase, userIdentifier, "Early Bird", newBadges);
    }
  }
  
  if (hour >= 20) {
    // Check for Night Owl badge
    const { count } = await supabase
      .from("daily_payments")
      .select("*", { count: "exact", head: true })
      .eq("recorded_by", userIdentifier);
    
    if (count >= 5) {
      await awardBadge(supabase, userIdentifier, "Night Owl", newBadges);
    }
  }
}

async function checkReportMilestones(supabase: any, userIdentifier: string, newBadges: string[]) {
  const { count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true });

  const milestones = [
    { count: 1, badge: "Report Master" },
    { count: 10, badge: "Data Analyst" },
  ];

  for (const milestone of milestones) {
    if (count >= milestone.count) {
      await awardBadge(supabase, userIdentifier, milestone.badge, newBadges);
    }
  }
}

async function checkExplorerBadge(supabase: any, userIdentifier: string, metadata: any, newBadges: string[]) {
  const visitedSections = metadata?.visitedSections || [];
  
  if (visitedSections.length >= 8) {
    await awardBadge(supabase, userIdentifier, "Explorer", newBadges);
  }
}

async function awardBadge(supabase: any, userIdentifier: string, badgeName: string, newBadges: string[]) {
  const { data: awarded } = await supabase.rpc("check_and_award_badge", {
    p_user_identifier: userIdentifier,
    p_badge_name: badgeName
  });

  if (awarded) {
    newBadges.push(badgeName);
  }
}
