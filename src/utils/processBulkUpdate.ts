import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface UpdateResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
  notFoundTenants: string[];
}

export async function processBulkUpdate(filePath: string): Promise<UpdateResult> {
  const results: UpdateResult = {
    success: 0,
    failed: 0,
    notFound: 0,
    errors: [],
    notFoundTenants: [],
  };

  try {
    // Fetch the file
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse Excel
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${jsonData.length} rows`);

    // Fetch all agents for lookup
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, phone')
      .eq('is_active', true);

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    // Create agent lookup map
    const agentMap = new Map<string, { id: string; phone: string }>();
    agents?.forEach(agent => {
      agentMap.set(agent.name.toUpperCase(), { id: agent.id, phone: agent.phone || "" });
    });

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      try {
        const contact = row["Contact"] || row["contact"];
        const tenantName = row["Tenant Name"] || row["tenant_name"] || row["name"];
        const agentName = row["Agent Name"] || row["agent_name"];
        const agentPhone = row["Agent Phone"] || row["agent_phone"];

        if (!contact) {
          results.errors.push(`Row ${i + 2}: Missing contact/phone number`);
          continue;
        }

        if (!agentName) {
          results.errors.push(`Row ${i + 2}: Missing agent name`);
          continue;
        }

        // Find tenant by contact
        const { data: tenant, error: findError } = await supabase
          .from("tenants")
          .select("id, name")
          .eq("contact", String(contact))
          .maybeSingle();

        if (findError) {
          results.errors.push(`Row ${i + 2}: Database error - ${findError.message}`);
          results.failed++;
          continue;
        }

        if (!tenant) {
          results.notFound++;
          results.notFoundTenants.push(`${tenantName || contact}`);
          continue;
        }

        // Get agent details
        const agentInfo = agentMap.get(String(agentName).toUpperCase());
        const agentId = agentInfo?.id || null;
        const finalAgentPhone = agentPhone || agentInfo?.phone || "";

        // Update tenant
        const { error: updateError } = await supabase
          .from("tenants")
          .update({
            agent_name: String(agentName),
            agent_phone: finalAgentPhone,
            agent_id: agentId,
            edited_by: "Bulk Agent Update",
            edited_at: new Date().toISOString(),
          })
          .eq("id", tenant.id);

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed to update tenant ${tenantName}: ${updateError.message}`);
        } else {
          results.success++;
        }

      } catch (error: any) {
        results.errors.push(`Row ${i + 2}: ${error.message}`);
        results.failed++;
      }
    }

    return results;

  } catch (error: any) {
    console.error('Error processing bulk update:', error);
    throw error;
  }
}
