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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PodcastTranscriptViewer/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new GeocodingServiceError(`Geocoding failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      name: locationName,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
    };
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
