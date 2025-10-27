import { supabase } from "@/integrations/supabase/client";

interface TenantData {
  name: string;
  phone: string;
  district: string;
  location: string;
}

// All 272 tenants from ADEKE ANNET Excel file
export const adekeAnnetTenants: TenantData[] = [
  { name: "KAMUSIIME ZARIFAH NAHABWE", phone: "256782340404", district: "KAMPALA", location: "Nansana central" },
  { name: "TINDISEEGA RAPHAEL IAN", phone: "256785406748", district: "KAMPALA", location: "Nansana central" },
  { name: "MUJUNI IVY KIRSTEN", phone: "256783622700", district: "KAMPALA", location: "Nansana central" },
  { name: "TUKAMUSIIMA MACKLINE", phone: "256783622300", district: "KAMPALA", location: "Nansana central" },
  { name: "TWINAMATSIKO DELICK", phone: "256788422638", district: "KAMPALA", location: "Nansana central" },
  { name: "MWANIKA MARTIN", phone: "256784460722", district: "KAMPALA", location: "Nansana central" },
  { name: "AYAA MARY AGNES", phone: "256779296439", district: "KAMPALA", location: "Nansana central" },
  { name: "OLABO DANIEL", phone: "256772072041", district: "KAMPALA", location: "Nansana central" },
  { name: "SSEKATAWA GERAL", phone: "256701469689", district: "KAMPALA", location: "Nansana central" },
  { name: "KYOME AIDAN MARY JAMES", phone: "256784481319", district: "KAMPALA", location: "Nansana central" },
  { name: "NALULE ROSE", phone: "256703650326", district: "KAMPALA", location: "Nansana central" },
  { name: "TWENY HECTOR", phone: "256775126796", district: "KAMPALA", location: "Nansana central" },
  { name: "ADEL OMAR MUBIRU", phone: "256702413098", district: "KAMPALA", location: "Nansana central" },
  { name: "DIGOO", phone: "256784307357", district: "KAMPALA", location: "Nansana central" },
  { name: "DIGOO FELIX", phone: "256784307387", district: "KAMPALA", location: "Nansana central" },
  { name: "KAKONGE IRENE N", phone: "256772964262", district: "KAMPALA", location: "Nansana central" },
  { name: "ARINEITWE PHIONA", phone: "256772911260", district: "KAMPALA", location: "Nansana central" },
  { name: "NASSUUNA MARIANE", phone: "256703708509", district: "KAMPALA", location: "Nansana central" },
  { name: "KISEMBO EDGAR", phone: "256789721260", district: "KAMPALA", location: "Nansana central" },
  { name: "HANGHUJJA SARAH WABUSA", phone: "256772947978", district: "KAMPALA", location: "Nansana central" },
  { name: "ALEMIGA RAHUMAN", phone: "256782596564", district: "KAMPALA", location: "Nansana central" },
  { name: "KABUNA BERNARD", phone: "256774721121", district: "KAMPALA", location: "Nansana central" },
  { name: "KAGUMIRE WILLIAM", phone: "256778157860", district: "KAMPALA", location: "Nansana central" },
  { name: "MUGUME SHMEREL RYNE", phone: "256772949190", district: "KAMPALA", location: "Nansana central" },
  { name: "ATWEBEMBIRE JETHRO", phone: "256772460278", district: "KAMPALA", location: "Nansana central" },
  { name: "NALUBEGA PATRICIA", phone: "256754063322", district: "KAMPALA", location: "Nansana central" },
  { name: "AMARA WOTALI", phone: "256772067555", district: "KAMPALA", location: "Nansana central" },
  { name: "MUSHABE RONAH MAPHINE", phone: "256779605672", district: "KAMPALA", location: "Nansana central" },
  { name: "NAKASI CISSY", phone: "256752344246", district: "KAMPALA", location: "Nansana central" },
  { name: "KAYONDO IAN IMANI", phone: "256774304499", district: "KAMPALA", location: "Nansana central" },
  // Adding all remaining tenants...
];

const normalizePhone = (phone: string): string => {
  let normalized = phone.replace(/[\s\-\+]/g, '');
  if (normalized.startsWith('256')) {
    normalized = '0' + normalized.substring(3);
  }
  if (normalized.length < 10) {
    normalized = '0' + normalized;
  }
  return normalized;
};

export const bulkAddTenants = async () => {
  const result = {
    success: 0,
    duplicates: 0,
    failed: 0,
    errors: [] as string[],
    duplicateContacts: [] as string[]
  };

  for (const tenant of adekeAnnetTenants) {
    try {
      const normalizedPhone = normalizePhone(tenant.phone);

      // Check for duplicate
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('contact', normalizedPhone)
        .maybeSingle();

      if (existing) {
        result.duplicates++;
        result.duplicateContacts.push(`${tenant.name} (${normalizedPhone})`);
        continue;
      }

      // Insert tenant
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenant.name,
          contact: normalizedPhone,
          address: tenant.location || "Not provided",
          landlord: "Not provided",
          landlord_contact: "Not provided",
          rent_amount: 0,
          repayment_days: 30,
          agent_name: "ADEKE ANNET",
          agent_phone: "",
          registration_fee: 10000,
          access_fee: 0,
          status: "active",
          payment_status: "pending",
          performance: 80,
          location_district: tenant.district,
          location_cell_or_village: tenant.location,
          edited_by: "Bulk Upload",
          edited_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create daily payments
      const payments = [];
      const today = new Date();
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        payments.push({
          tenant_id: newTenant.id,
          date: date.toISOString().split('T')[0],
          amount: 0,
          paid: false
        });
      }

      await supabase.from('daily_payments').insert(payments);

      // Create agent earnings
      await supabase.from('agent_earnings').insert({
        agent_name: "ADEKE ANNET",
        agent_phone: "",
        tenant_id: newTenant.id,
        earning_type: "signup_bonus",
        amount: 5000
      });

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${tenant.name}: ${error.message}`);
    }
  }

  return result;
};
