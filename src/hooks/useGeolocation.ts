import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface LocationData {
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  colMultiplier?: number;
}

interface UseGeolocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  lookupZipCode: (zipCode: string) => Promise<LocationData | null>;
}

// Cost of Living Index multipliers by state (national average = 1.0)
// Based on 2024 COL data from Bureau of Economic Analysis
const STATE_COL_MULTIPLIERS: Record<string, number> = {
  // High COL states
  'Hawaii': 1.86,
  'HI': 1.86,
  'California': 1.42,
  'CA': 1.42,
  'Massachusetts': 1.35,
  'MA': 1.35,
  'New York': 1.34,
  'NY': 1.34,
  'Alaska': 1.28,
  'AK': 1.28,
  'Maryland': 1.24,
  'MD': 1.24,
  'Connecticut': 1.21,
  'CT': 1.21,
  'Washington': 1.19,
  'WA': 1.19,
  'New Jersey': 1.18,
  'NJ': 1.18,
  'New Hampshire': 1.17,
  'NH': 1.17,
  'Oregon': 1.16,
  'OR': 1.16,
  'Vermont': 1.14,
  'VT': 1.14,
  'Rhode Island': 1.12,
  'RI': 1.12,
  'Colorado': 1.11,
  'CO': 1.11,
  'Maine': 1.10,
  'ME': 1.10,
  'Virginia': 1.08,
  'VA': 1.08,
  'Delaware': 1.06,
  'DE': 1.06,
  'Minnesota': 1.04,
  'MN': 1.04,
  'Illinois': 1.03,
  'IL': 1.03,
  'Pennsylvania': 1.02,
  'PA': 1.02,
  // Average COL states
  'Florida': 1.01,
  'FL': 1.01,
  'Nevada': 1.00,
  'NV': 1.00,
  'Arizona': 0.99,
  'AZ': 0.99,
  'Utah': 0.98,
  'UT': 0.98,
  'Wisconsin': 0.97,
  'WI': 0.97,
  'Michigan': 0.96,
  'MI': 0.96,
  'South Dakota': 0.95,
  'SD': 0.95,
  'North Dakota': 0.94,
  'ND': 0.94,
  'Montana': 0.94,
  'MT': 0.94,
  'Nebraska': 0.93,
  'NE': 0.93,
  'Idaho': 0.93,
  'ID': 0.93,
  'Iowa': 0.92,
  'IA': 0.92,
  'Wyoming': 0.92,
  'WY': 0.92,
  'North Carolina': 0.91,
  'NC': 0.91,
  'South Carolina': 0.90,
  'SC': 0.90,
  'Georgia': 0.90,
  'GA': 0.90,
  'Texas': 0.90,
  'TX': 0.90,
  // Low COL states
  'Tennessee': 0.89,
  'TN': 0.89,
  'Indiana': 0.88,
  'IN': 0.88,
  'Missouri': 0.88,
  'MO': 0.88,
  'Ohio': 0.87,
  'OH': 0.87,
  'Louisiana': 0.87,
  'LA': 0.87,
  'Kansas': 0.86,
  'KS': 0.86,
  'Kentucky': 0.86,
  'KY': 0.86,
  'New Mexico': 0.85,
  'NM': 0.85,
  'Alabama': 0.84,
  'AL': 0.84,
  'Oklahoma': 0.84,
  'OK': 0.84,
  'Arkansas': 0.83,
  'AR': 0.83,
  'West Virginia': 0.82,
  'WV': 0.82,
  'Mississippi': 0.81,
  'MS': 0.81,
};

// Metro area adjustments (multiplied on top of state multiplier)
const METRO_ADJUSTMENTS: Record<string, number> = {
  'New York': 1.25, // NYC metro
  'San Francisco': 1.35,
  'Los Angeles': 1.15,
  'Seattle': 1.12,
  'Boston': 1.15,
  'Washington': 1.18, // DC metro
  'Miami': 1.08,
  'Chicago': 1.05,
  'Denver': 1.08,
  'San Diego': 1.12,
  'Austin': 1.06,
  'Portland': 1.08,
  'Phoenix': 1.02,
  'Atlanta': 1.02,
  'Dallas': 1.02,
  'Houston': 1.00,
};

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupZipCode = useCallback(async (zipCode: string): Promise<LocationData | null> => {
    if (!zipCode || zipCode.length < 5) {
      toast.error('Please enter a valid 5-digit Zip Code');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Zippopotam.us for free zip code lookup (no API key needed)
      // Only supports US for now based on the app's context
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

      if (!response.ok) {
        throw new Error('Invalid Zip Code or service unavailable');
      }

      const data = await response.json();
      
      const city = data.places[0]['place name'];
      const state = data.places[0]['state abbreviation']; // Get 2-letter code
      const country = data['country abbreviation'] || 'US';

      // Calculate COL multiplier
      let colMultiplier = 1.0;
      
      // Get base state multiplier
      colMultiplier = STATE_COL_MULTIPLIERS[state] || STATE_COL_MULTIPLIERS[data.places[0]['state']] || 1.0;
      
      // Apply metro adjustment if applicable
      const metroAdjustment = METRO_ADJUSTMENTS[city] || 1.0;
      colMultiplier = colMultiplier * metroAdjustment;
      
      // Round to 2 decimal places
      colMultiplier = Math.round(colMultiplier * 100) / 100;

      const locationData: LocationData = {
        city,
        state,
        zipCode,
        country,
        colMultiplier,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lookup Zip Code';
      setError(message);
      toast.error('Could not find location for this Zip Code.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    lookupZipCode,
  };
}

export function getColMultiplierLabel(multiplier: number): string {
  if (multiplier >= 1.3) return 'Very High COL';
  if (multiplier >= 1.1) return 'High COL';
  if (multiplier >= 0.95) return 'Average COL';
  if (multiplier >= 0.85) return 'Below Average COL';
  return 'Low COL';
}
