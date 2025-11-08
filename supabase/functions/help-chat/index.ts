import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create contextual system prompt based on the current page
    const getContextualPrompt = (page: string) => {
      const basePrompt = "You are a helpful assistant for a tenant management application. You help users understand features, navigate the app, and solve common problems. Be concise and friendly.";
      
      const pageContext: Record<string, string> = {
        "/": "The user is on the home page where they can search tenants, view stats, and access quick actions.",
        "/executive-dashboard": "The user is viewing the executive dashboard with high-level analytics and performance metrics.",
        "/admin-dashboard": "The user is on the admin dashboard where they can manage reports, templates, and system settings.",
        "/missed-payments": "The user is viewing tenants with missed payments. Help them understand payment tracking and follow-up actions.",
        "/top-performers": "The user is viewing top performing tenants and agents. Explain performance metrics and rankings.",
        "/agent-dashboard": "The user is on the agent dashboard. Help with agent-specific features and earnings tracking.",
        "/monthly-summary": "The user is viewing monthly summaries. Explain financial reports and monthly statistics.",
        "/pipeline-tenants": "The user is viewing pipeline conversion tracking. Help with tenant lifecycle management.",
        "/risk-dashboard": "The user is on the risk dashboard. Explain risk indicators and alert systems.",
      };

      const context = pageContext[page] || "The user is navigating the tenant management application.";
      return `${basePrompt}\n\nCurrent context: ${context}`;
    };

    const systemPrompt = getContextualPrompt(currentPage || "/");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service unavailable. Please contact support." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Help chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
