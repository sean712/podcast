import type { Quote } from './openaiService';

export interface GeocodedLocation {
  name: string;
  context?: string;
  lat: number;
  lon: number;
  displayName: string;
  quotes?: Quote[];
}

class GeocodingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingServiceError';
  }
}

function cleanLocationName(locationName: string): string[] {
  const candidates: string[] = [];

  candidates.push(locationName.trim());

  const parenthesesRemoved = locationName.replace(/\([^)]*\)/g, '').trim();
  if (parenthesesRemoved && parenthesesRemoved !== locationName) {
    candidates.push(parenthesesRemoved);
  }

  const slashParts = locationName.split('/').map(p => p.trim());
  if (slashParts.length > 1) {
    candidates.push(...slashParts);
  }

  const commaParts = locationName.split(',');
  if (commaParts.length >= 2) {
    const lastTwo = commaParts.slice(-2).map(p => p.trim()).join(', ');
    candidates.push(lastTwo);

    const lastOne = commaParts[commaParts.length - 1].trim();
    if (lastOne) {
      candidates.push(lastOne);
    }
  }

  const andMatch = locationName.match(/^([^(]+?)\s+(?:and|&)\s+/i);
  if (andMatch) {
    candidates.push(andMatch[1].trim());
  }

  const impliedMatch = locationName.match(/^([^(]+?)\s+\(implied/i);
  if (impliedMatch) {
    candidates.push(impliedMatch[1].trim());
  }

  return [...new Set(candidates.filter(c => c.length > 0))];
}

async function tryGeocodeWithFallback(locationName: string): Promise<GeocodedLocation | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
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
      return null;
    }

    const data = await response.json();

    if (!data || !data.lat || !data.lon) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function geocodeLocation(locationName: string): Promise<GeocodedLocation | null> {
  const originalName = locationName;
  console.log(`🔍 Starting geocoding for: "${originalName}"`);

  const candidates = cleanLocationName(locationName);
  console.log(`   → Generated ${candidates.length} candidate(s):`, candidates);

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`   [${i + 1}/${candidates.length}] Trying: "${candidate}"`);

    const result = await tryGeocodeWithFallback(candidate);
    if (result) {
      console.log(`   ✅ Success! Geocoded "${candidate}" → ${result.lat}, ${result.lon}`);
      return {
        ...result,
        name: originalName,
      };
    } else {
      console.log(`   ❌ Failed: "${candidate}"`);
    }
  }

  console.warn(`⚠️ All ${candidates.length} attempts failed for "${originalName}"`);
  return null;
}

export async function geocodeLocations(
  locations: Array<{ name: string; context?: string; quotes?: Quote[] }>
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
        quotes: location.quotes,
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
