import { supabase } from "@/integrations/supabase/client";

export interface ValidatedAgentData {
  agentName: string;
  agentPhone: string;
  agentId?: string;
  isValid: boolean;
  message?: string;
}

/**
 * Validates and retrieves correct agent data from the database
 * Ensures agent phone numbers are consistent with the agents table
 */
export const validateAgentData = async (
  agentName: string,
  agentPhone?: string
): Promise<ValidatedAgentData> => {
  try {
    // Normalize agent name
    const normalizedName = agentName.trim().toUpperCase();

    // Find agent in database by name
    const { data: agent, error } = await supabase
      .from("agents")
      .select("id, name, phone")
      .eq("is_active", true)
      .ilike("name", normalizedName)
      .maybeSingle();

    if (error) {
      console.error("Error validating agent:", error);
      return {
        agentName: normalizedName,
        agentPhone: agentPhone || "",
        isValid: false,
        message: "Database error while validating agent",
      };
    }

    if (!agent) {
      // Agent not found - this might be a new agent
      console.warn(`Agent not found in database: ${normalizedName}`);
      return {
        agentName: normalizedName,
        agentPhone: agentPhone || "",
        isValid: false,
        message: "Agent not found in database. Please add agent first.",
      };
    }

    // Validate phone number matches
    const dbPhone = agent.phone || "";
    const providedPhone = agentPhone || "";

    if (providedPhone && dbPhone && providedPhone !== dbPhone) {
      console.warn(
        `Phone mismatch for ${agent.name}: provided ${providedPhone}, using ${dbPhone}`
      );
    }

    // Return validated data with correct phone from database
    return {
      agentName: agent.name,
      agentPhone: dbPhone,
      agentId: agent.id,
      isValid: true,
      message: "Agent validated successfully",
    };
  } catch (error) {
    console.error("Unexpected error validating agent:", error);
    return {
      agentName: agentName.trim().toUpperCase(),
      agentPhone: agentPhone || "",
      isValid: false,
      message: "Unexpected error during validation",
    };
  }
};

/**
 * Validates agent phone number format
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Remove spaces, dashes, and plus signs
  let normalized = phone.replace(/[\s\-\+]/g, "");

  // Convert international format to local
  if (normalized.startsWith("256")) {
    normalized = "0" + normalized.substring(3);
  }

  // Ensure it starts with 0
  if (!normalized.startsWith("0") && normalized.length === 9) {
    normalized = "0" + normalized;
  }

  return normalized;
};
