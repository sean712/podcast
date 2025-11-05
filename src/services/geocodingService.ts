export interface GeocodedLocation {
  name: string;
  context?: string;
  lat: number;
  lon: number;
  displayName: string;
}

class GeocodingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingServiceError';
  }
}

export async function geocodeLocation(locationName: string): Promise<GeocodedLocation | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/geocode-location`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ locationName }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Geocoding API error: ${response.status} - ${errorText}`);
      throw new GeocodingServiceError(`Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Failed to geocode location "${locationName}":`, error);
    return null;
  }
}

export async function geocodeLocations(
  locations: Array<{ name: string; context?: string }>
): Promise<GeocodedLocation[]> {
  const geocodedLocations: GeocodedLocation[] = [];

  for (const location of locations) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const geocoded = await geocodeLocation(location.name);
    if (geocoded) {
      geocodedLocations.push({
        ...geocoded,
        context: location.context,
      });
    }
  }

  return geocodedLocations;
}

export { GeocodingServiceError };
