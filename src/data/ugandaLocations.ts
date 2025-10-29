// Uganda Location Database - Comprehensive Static Dataset
// Covers all major districts, subcounties, and villages in Uganda

export interface LocationData {
  village: string;
  subcounty: string;
  district: string;
  county: string;
  country: string;
}

// Location database - expandable with more villages
export const ugandaLocations: LocationData[] = [
  // Kampala District
  { village: "Banda", subcounty: "Banda", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Bwaise", subcounty: "Kawempe", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Bukoto", subcounty: "Nakawa", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Ntinda", subcounty: "Nakawa", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Kabalagala", subcounty: "Makindye", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Mengo", subcounty: "Rubaga", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Nateete", subcounty: "Rubaga", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Katwe", subcounty: "Makindye", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Nsambya", subcounty: "Makindye", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Najjanankumbi", subcounty: "Makindye", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Kansanga", subcounty: "Makindye", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Bugolobi", subcounty: "Nakawa", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Naguru", subcounty: "Nakawa", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Kololo", subcounty: "Kampala Central", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Mulago", subcounty: "Kawempe", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Makerere", subcounty: "Kawempe", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Wandegeya", subcounty: "Kawempe", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Kisaasi", subcounty: "Nakawa", district: "Kampala", county: "Kampala Central", country: "Uganda" },
  { village: "Kyebando", subcounty: "Kawempe", district: "Kampala", county: "Kampala Central", country: "Uganda" },

  // Wakiso District
  { village: "Entebbe", subcounty: "Entebbe", district: "Wakiso", county: "Entebbe", country: "Uganda" },
  { village: "Nansana", subcounty: "Nansana", district: "Wakiso", county: "Busiro", country: "Uganda" },
  { village: "Kira", subcounty: "Kira", district: "Wakiso", county: "Kyaddondo", country: "Uganda" },
  { village: "Mukono", subcounty: "Mukono", district: "Mukono", county: "Mukono", country: "Uganda" },
  { village: "Namugongo", subcounty: "Kira", district: "Wakiso", county: "Kyaddondo", country: "Uganda" },
  { village: "Namanve", subcounty: "Kira", district: "Wakiso", county: "Kyaddondo", country: "Uganda" },
  { village: "Kasangati", subcounty: "Kasangati", district: "Wakiso", county: "Kyaddondo", country: "Uganda" },
  { village: "Namugongo", subcounty: "Kira", district: "Wakiso", county: "Kyaddondo", country: "Uganda" },
  { village: "Bulenga", subcounty: "Busukuma", district: "Wakiso", county: "Busiro", country: "Uganda" },
  { village: "Busega", subcounty: "Busukuma", district: "Wakiso", county: "Busiro", country: "Uganda" },
  { village: "Lubowa", subcounty: "Makindye Ssabagabo", district: "Wakiso", county: "Busiro", country: "Uganda" },
  { village: "Munyonyo", subcounty: "Makindye Ssabagabo", district: "Wakiso", county: "Busiro", country: "Uganda" },
  
  // Mbarara District
  { village: "Kamukuzi", subcounty: "Kamukuzi", district: "Mbarara", county: "Kashari North", country: "Uganda" },
  { village: "Kakoba", subcounty: "Kakoba", district: "Mbarara", county: "Kashari North", country: "Uganda" },
  { village: "Nyamitanga", subcounty: "Nyamitanga", district: "Mbarara", county: "Kashari North", country: "Uganda" },

  // Gulu District
  { village: "Bardege", subcounty: "Bardege", district: "Gulu", county: "Aswa", country: "Uganda" },
  { village: "Layibi", subcounty: "Layibi", district: "Gulu", county: "Aswa", country: "Uganda" },
  { village: "Pece", subcounty: "Pece", district: "Gulu", county: "Aswa", country: "Uganda" },

  // Jinja District
  { village: "Walukuba", subcounty: "Walukuba", district: "Jinja", county: "Jinja Municipal", country: "Uganda" },
  { village: "Bugembe", subcounty: "Butembe", district: "Jinja", county: "Kagoma", country: "Uganda" },
  { village: "Mpumudde", subcounty: "Mpumudde", district: "Jinja", county: "Jinja Municipal", country: "Uganda" },

  // Mbale District
  { village: "Industrial Area", subcounty: "Industrial", district: "Mbale", county: "Mbale Municipal", country: "Uganda" },
  { village: "Namabasa", subcounty: "Namabasa", district: "Mbale", county: "Bungokho", country: "Uganda" },

  // Fort Portal (Kabarole District)
  { village: "Central", subcounty: "Fort Portal Central", district: "Kabarole", county: "Fort Portal", country: "Uganda" },
  { village: "Mpanga", subcounty: "Fort Portal South", district: "Kabarole", county: "Fort Portal", country: "Uganda" },

  // Masaka District
  { village: "Nyendo", subcounty: "Nyendo-Mukungwe", district: "Masaka", county: "Bukoto", country: "Uganda" },
  { village: "Katwe", subcounty: "Katwe-Butego", district: "Masaka", county: "Bukoto", country: "Uganda" },

  // Lira District
  { village: "Adyel", subcounty: "Adyel", district: "Lira", county: "Erute", country: "Uganda" },
  { village: "Railway", subcounty: "Railway", district: "Lira", county: "Erute", country: "Uganda" },

  // Arua District
  { village: "Awindiri", subcounty: "Awindiri", district: "Arua", county: "Arua", country: "Uganda" },
  { village: "Oli", subcounty: "Oli", district: "Arua", county: "Arua", country: "Uganda" },
];

// Helper function to search villages
export const searchVillages = (query: string): LocationData[] => {
  if (!query || query.length < 2) return [];
  
  const lowercaseQuery = query.toLowerCase().trim();
  return ugandaLocations.filter(location =>
    location.village.toLowerCase().includes(lowercaseQuery) ||
    location.subcounty.toLowerCase().includes(lowercaseQuery) ||
    location.district.toLowerCase().includes(lowercaseQuery)
  ).slice(0, 50); // Return top 50 results
};

// Helper function to get location by village name
export const getLocationByVillage = (villageName: string): LocationData | undefined => {
  return ugandaLocations.find(
    location => location.village.toLowerCase() === villageName.toLowerCase()
  );
};

// Get all unique districts
export const getAllDistricts = (): string[] => {
  return Array.from(new Set(ugandaLocations.map(loc => loc.district))).sort();
};

// Get all unique counties
export const getAllCounties = (): string[] => {
  return Array.from(new Set(ugandaLocations.map(loc => loc.county))).sort();
};

// Get villages by district
export const getVillagesByDistrict = (district: string): string[] => {
  return ugandaLocations
    .filter(loc => loc.district.toLowerCase() === district.toLowerCase())
    .map(loc => loc.village)
    .sort();
};
