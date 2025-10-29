// Open Data Uganda API Service
// Fetches comprehensive Uganda location data including all villages and cells

const API_BASE_URL = 'https://api.opendataug.org/v1';
const API_KEY = import.meta.env.VITE_OPEN_DATA_UGANDA_API_KEY;

interface VillageResponse {
  id: string;
  name: string;
  parish_id: string;
  parish_name: string;
  subcounty_id: string;
  subcounty_name: string;
  district_id?: string;
  district_name?: string;
  county_id?: string;
  county_name?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T[];
}

export interface CompleteLocationData {
  village: string;
  parish: string;
  subcounty: string;
  district: string;
  county: string;
  country: string;
}

// Fetch all villages from API
export const fetchAllVillages = async (): Promise<CompleteLocationData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/villages`, {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch villages: ${response.statusText}`);
    }

    const result: ApiResponse<VillageResponse> = await response.json();
    
    if (result.status !== 'success') {
      throw new Error('API returned error status');
    }

    // Transform API response to our location format
    return result.data.map(village => ({
      village: village.name,
      parish: village.parish_name,
      subcounty: village.subcounty_name,
      district: village.district_name || '',
      county: village.county_name || '',
      country: 'Uganda',
    }));
  } catch (error) {
    console.error('Error fetching villages from API:', error);
    throw error;
  }
};

// Search villages by query
export const searchVillagesFromApi = async (query: string): Promise<CompleteLocationData[]> => {
  const allVillages = await fetchAllVillages();
  
  const lowercaseQuery = query.toLowerCase().trim();
  return allVillages.filter(location =>
    location.village.toLowerCase().includes(lowercaseQuery) ||
    location.subcounty.toLowerCase().includes(lowercaseQuery) ||
    location.district.toLowerCase().includes(lowercaseQuery) ||
    location.parish.toLowerCase().includes(lowercaseQuery)
  );
};

// Get location by village name
export const getLocationByVillageFromApi = async (villageName: string): Promise<CompleteLocationData | undefined> => {
  const allVillages = await fetchAllVillages();
  return allVillages.find(
    location => location.village.toLowerCase() === villageName.toLowerCase()
  );
};
