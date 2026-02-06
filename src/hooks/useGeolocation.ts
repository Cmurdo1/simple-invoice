import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface GeolocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  colMultiplier?: number;
}

interface UseGeolocationReturn {
  location: GeolocationData | null;
  isLoading: boolean;
  error: string | null;
  detectLocation: () => Promise<GeolocationData | null>;
}

// Cost of Living Index multipliers by state (national average = 1.0)
// Based on 2024 COL data from Bureau of Economic Analysis
const STATE_COL_MULTIPLIERS: Record<string, number> = {
  // High COL states
  'Hawaii': 1.86,
  'California': 1.42,
  'Massachusetts': 1.35,
  'New York': 1.34,
  'Alaska': 1.28,
  'Maryland': 1.24,
  'Connecticut': 1.21,
  'Washington': 1.19,
  'New Jersey': 1.18,
  'New Hampshire': 1.17,
  'Oregon': 1.16,
  'Vermont': 1.14,
  'Rhode Island': 1.12,
  'Colorado': 1.11,
  'Maine': 1.10,
  'Virginia': 1.08,
  'Delaware': 1.06,
  'Minnesota': 1.04,
  'Illinois': 1.03,
  'Pennsylvania': 1.02,
  // Average COL states
  'Florida': 1.01,
  'Nevada': 1.00,
  'Arizona': 0.99,
  'Utah': 0.98,
  'Wisconsin': 0.97,
  'Michigan': 0.96,
  'South Dakota': 0.95,
  'North Dakota': 0.94,
  'Montana': 0.94,
  'Nebraska': 0.93,
  'Idaho': 0.93,
  'Iowa': 0.92,
  'Wyoming': 0.92,
  'North Carolina': 0.91,
  'South Carolina': 0.90,
  'Georgia': 0.90,
  'Texas': 0.90,
  // Low COL states
  'Tennessee': 0.89,
  'Indiana': 0.88,
  'Missouri': 0.88,
  'Ohio': 0.87,
  'Louisiana': 0.87,
  'Kansas': 0.86,
  'Kentucky': 0.86,
  'New Mexico': 0.85,
  'Alabama': 0.84,
  'Oklahoma': 0.84,
  'Arkansas': 0.83,
  'West Virginia': 0.82,
  'Mississippi': 0.81,
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
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async (): Promise<GeolocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // First get coordinates from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using free Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'HonestInvoice/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get location details');
      }

      const data = await response.json();
      const address = data.address || {};
      
      const city = address.city || address.town || address.village || address.municipality || '';
      const state = address.state || '';
      const zipCode = address.postcode || '';
      const country = address.country_code?.toUpperCase() || 'US';

      // Calculate COL multiplier
      let colMultiplier = 1.0;
      
      if (country === 'US' && state) {
        // Get base state multiplier
        colMultiplier = STATE_COL_MULTIPLIERS[state] || 1.0;
        
        // Apply metro adjustment if applicable
        const metroAdjustment = METRO_ADJUSTMENTS[city] || 1.0;
        colMultiplier = colMultiplier * metroAdjustment;
        
        // Round to 2 decimal places
        colMultiplier = Math.round(colMultiplier * 100) / 100;
      }

      const locationData: GeolocationData = {
        latitude,
        longitude,
        city,
        state,
        zipCode,
        country,
        colMultiplier,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to detect location';
      setError(message);
      
      if (message.includes('denied')) {
        toast.error('Location access denied. Please enable location in your browser settings or enter your location manually.');
      } else {
        toast.error('Could not detect your location. You can enter it manually in Settings.');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    detectLocation,
  };
}

export function getColMultiplierLabel(multiplier: number): string {
  if (multiplier >= 1.3) return 'Very High COL';
  if (multiplier >= 1.1) return 'High COL';
  if (multiplier >= 0.95) return 'Average COL';
  if (multiplier >= 0.85) return 'Below Average COL';
  return 'Low COL';
}
