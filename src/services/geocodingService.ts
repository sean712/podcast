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
      console.warn(`⚠️ Geocoding failed for "${locationName}": ${response.status} - ${errorText}`);
      throw new GeocodingServiceError(`Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.lat || !data.lon) {
      console.warn(`⚠️ No coordinates found for "${locationName}"`);
      return null;
    }

    console.log(`✓ Geocoded "${locationName}" -> ${data.lat}, ${data.lon}`);
    return data;
  } catch (error) {
    console.warn(`✗ Failed to geocode "${locationName}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function geocodeLocations(
  locations: Array<{ name: string; context?: string }>
): Promise<GeocodedLocation[]> {
  const geocodedLocations: GeocodedLocation[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log(`🗺️ Starting batch geocoding of ${locations.length} locations`);

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`[${i + 1}/${locations.length}] Geocoding "${location.name}"...`);

    const geocoded = await geocodeLocation(location.name);
    if (geocoded) {
      geocodedLocations.push({
        ...geocoded,
        context: location.context,
      });
      successCount++;
    } else {
      failCount++;
      console.warn(`✗ Skipping "${location.name}" - geocoding failed`);
    }
  }

  console.log(`📊 Batch geocoding complete: ${successCount} succeeded, ${failCount} failed`);
  return geocodedLocations;
}

export { GeocodingServiceError };
