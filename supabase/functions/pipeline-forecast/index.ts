import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'
import { corsHeaders } from '../_shared/cors.ts'

interface ForecastRequest {
  dateFrom?: string;
  dateTo?: string;
  serviceCenter?: string;
  agentName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { dateFrom, dateTo, serviceCenter, agentName } = await req.json() as ForecastRequest

    console.log('Fetching pipeline data for forecast...')

    // Fetch historical pipeline data
    let pipelineQuery = supabase
      .from('tenants')
      .select('id, status, created_at, updated_at, agent_name, service_center')
      .eq('status', 'pipeline')
      .order('created_at', { ascending: false })

    if (dateFrom) pipelineQuery = pipelineQuery.gte('created_at', dateFrom)
    if (dateTo) pipelineQuery = pipelineQuery.lte('created_at', dateTo)
    if (serviceCenter && serviceCenter !== 'all') pipelineQuery = pipelineQuery.eq('service_center', serviceCenter)
    if (agentName && agentName !== 'all') pipelineQuery = pipelineQuery.eq('agent_name', agentName)

    const { data: pipelineTenants, error: pipelineError } = await pipelineQuery

    if (pipelineError) throw pipelineError

    // Fetch converted tenants (active status)
    let convertedQuery = supabase
      .from('tenants')
      .select('id, status, created_at, updated_at, agent_name, service_center')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (dateFrom) convertedQuery = convertedQuery.gte('created_at', dateFrom)
    if (dateTo) convertedQuery = convertedQuery.lte('created_at', dateTo)
    if (serviceCenter && serviceCenter !== 'all') convertedQuery = convertedQuery.eq('service_center', serviceCenter)
    if (agentName && agentName !== 'all') convertedQuery = convertedQuery.eq('agent_name', agentName)

    const { data: convertedTenants, error: convertedError } = await convertedQuery

    if (convertedError) throw convertedError

    // Fetch agent earnings
    let earningsQuery = supabase
      .from('agent_earnings')
      .select('agent_name, amount, created_at, earning_type')
      .eq('earning_type', 'pipeline_bonus')
      .order('created_at', { ascending: false })
      .limit(500)

    if (dateFrom) earningsQuery = earningsQuery.gte('created_at', dateFrom)
    if (dateTo) earningsQuery = earningsQuery.lte('created_at', dateTo)
    if (agentName && agentName !== 'all') earningsQuery = earningsQuery.eq('agent_name', agentName)

    const { data: earnings, error: earningsError } = await earningsQuery

    if (earningsError) throw earningsError

    // Calculate statistics
    const totalPipeline = pipelineTenants?.length || 0
    const totalConverted = convertedTenants?.length || 0
    const conversionRate = totalPipeline > 0 ? (totalConverted / totalPipeline) * 100 : 0

    // Group by agents
    const agentStats: Record<string, { pipeline: number; converted: number; earnings: number }> = {}

    pipelineTenants?.forEach(t => {
      if (!agentStats[t.agent_name]) {
        agentStats[t.agent_name] = { pipeline: 0, converted: 0, earnings: 0 }
      }
      agentStats[t.agent_name].pipeline++
    })

    convertedTenants?.forEach(t => {
      if (agentStats[t.agent_name]) {
        agentStats[t.agent_name].converted++
      }
    })

    earnings?.forEach(e => {
      if (agentStats[e.agent_name]) {
        agentStats[e.agent_name].earnings += Number(e.amount)
      }
    })

    // Group by service centers
    const centerStats: Record<string, { pipeline: number; converted: number }> = {}

    pipelineTenants?.forEach(t => {
      const center = t.service_center || 'Unassigned'
      if (!centerStats[center]) {
        centerStats[center] = { pipeline: 0, converted: 0 }
      }
      centerStats[center].pipeline++
    })

    convertedTenants?.forEach(t => {
      const center = t.service_center || 'Unassigned'
      if (centerStats[center]) {
        centerStats[center].converted++
      }
    })

    console.log('Sending data to AI for analysis...')

    // Prepare data summary for AI
    const dataSummary = {
      totalPipeline,
      totalConverted,
      conversionRate: conversionRate.toFixed(2),
      agentCount: Object.keys(agentStats).length,
      serviceCenterCount: Object.keys(centerStats).length,
      topAgents: Object.entries(agentStats)
        .sort((a, b) => b[1].pipeline - a[1].pipeline)
        .slice(0, 5)
        .map(([name, stats]) => ({
          name,
          pipeline: stats.pipeline,
          converted: stats.converted,
          conversionRate: stats.pipeline > 0 ? ((stats.converted / stats.pipeline) * 100).toFixed(1) : '0',
          earnings: stats.earnings
        })),
      topCenters: Object.entries(centerStats)
        .sort((a, b) => b[1].pipeline - a[1].pipeline)
        .slice(0, 5)
        .map(([name, stats]) => ({
          name,
          pipeline: stats.pipeline,
          converted: stats.converted,
          conversionRate: stats.pipeline > 0 ? ((stats.converted / stats.pipeline) * 100).toFixed(1) : '0'
        }))
    }

    const systemPrompt = `You are an AI data analyst specializing in sales pipeline forecasting. Based on historical pipeline conversion data, you provide accurate predictions and actionable insights for business performance.

Analyze the provided data and generate forecasts using the extract_forecast tool with the following structure:

1. Overall Predictions:
   - Expected conversion rate for next 30 days (percentage)
   - Projected number of conversions
   - Confidence level (high/medium/low)

2. Agent Performance Forecasts:
   - For each top agent, predict their performance in next 30 days
   - Include expected conversions and confidence level

3. Service Center Forecasts:
   - For each service center, predict conversion trends
   - Identify which centers will perform best

4. Key Insights:
   - 3-5 actionable insights based on the data
   - Recommendations for improving conversion rates
   - Warning signs or areas of concern

Base your analysis on conversion rates, trends, and agent/center performance patterns.`

    const userPrompt = `Analyze this pipeline data and generate forecasts:

**Overall Statistics:**
- Current Pipeline: ${dataSummary.totalPipeline} tenants
- Recently Converted: ${dataSummary.totalConverted} tenants  
- Historical Conversion Rate: ${dataSummary.conversionRate}%
- Active Agents: ${dataSummary.agentCount}
- Service Centers: ${dataSummary.serviceCenterCount}

**Top Performing Agents:**
${dataSummary.topAgents.map(a => `- ${a.name}: ${a.pipeline} pipeline, ${a.converted} converted (${a.conversionRate}%), UGX ${a.earnings} earned`).join('\n')}

**Top Service Centers:**
${dataSummary.topCenters.map(c => `- ${c.name}: ${c.pipeline} pipeline, ${c.converted} converted (${c.conversionRate}%)`).join('\n')}

Generate comprehensive forecasts for the next 30 days with actionable insights.`

    // Call Lovable AI with tool calling for structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_forecast',
              description: 'Extract structured pipeline forecast data',
              parameters: {
                type: 'object',
                properties: {
                  overallForecast: {
                    type: 'object',
                    properties: {
                      expectedConversionRate: { type: 'number', description: 'Predicted conversion rate percentage' },
                      projectedConversions: { type: 'number', description: 'Expected number of conversions' },
                      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                      reasoning: { type: 'string', description: 'Brief explanation of the forecast' }
                    },
                    required: ['expectedConversionRate', 'projectedConversions', 'confidence', 'reasoning']
                  },
                  agentForecasts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        agentName: { type: 'string' },
                        expectedConversions: { type: 'number' },
                        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                        reasoning: { type: 'string' }
                      },
                      required: ['agentName', 'expectedConversions', 'confidence', 'reasoning']
                    }
                  },
                  serviceCenterForecasts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        centerName: { type: 'string' },
                        trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
                        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                        reasoning: { type: 'string' }
                      },
                      required: ['centerName', 'trend', 'confidence', 'reasoning']
                    }
                  },
                  insights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        actionable: { type: 'boolean' }
                      },
                      required: ['title', 'description', 'priority', 'actionable']
                    }
                  }
                },
                required: ['overallForecast', 'agentForecasts', 'serviceCenterForecasts', 'insights'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_forecast' } }
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const aiResponse = await response.json()
    console.log('AI response received successfully')

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall) {
      throw new Error('No tool call in AI response')
    }

    const forecast = JSON.parse(toolCall.function.arguments)

    return new Response(
      JSON.stringify({
        forecast,
        generatedAt: new Date().toISOString(),
        dataSnapshot: dataSummary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Pipeline forecast error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate forecast' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
