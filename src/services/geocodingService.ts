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
  let cleaned = locationName.trim();

  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();

  cleaned = cleaned.replace(/\s+(region|area|city|province|district|territory|zone|sector)\s*$/i, '').trim();

  const suffixPatterns = [
    /\s+crossing\s+area$/i,
    /\s+vicinity$/i,
    /\s+suburbs?$/i,
    /\s+outskirts$/i,
    /\s+surrounding\s+area$/i,
  ];

  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }

  if (cleaned && cleaned !== locationName) {
    candidates.push(cleaned);
  }

  candidates.push(locationName.trim());

  const slashParts = locationName.split('/').map(p => p.trim());
  if (slashParts.length > 1) {
    candidates.push(...slashParts);
  }

  const commaParts = locationName.split(',').map(p => p.trim());
  if (commaParts.length === 2) {
    const cityPart = commaParts[0].trim();
    const countryPart = commaParts[1].trim();

    const countriesAndRegions = [
      'palestine', 'israel', 'syria', 'lebanon', 'jordan', 'iraq', 'egypt',
      'saudi arabia', 'yemen', 'kuwait', 'oman', 'uae', 'emirates',
      'turkey', 'russia', 'ukraine', 'china', 'india', 'pakistan',
      'afghanistan', 'iran', 'middle east'
    ];

    const countryLower = countryPart.toLowerCase();
    const isKnownRegion = countriesAndRegions.some(region => countryLower.includes(region));

    if (isKnownRegion && cityPart.length > 2) {
      candidates.push(`${cityPart}, ${countryPart}`);
    } else {
      const lastTwo = commaParts.slice(-2).join(', ');
      candidates.push(lastTwo);

      if (countryPart.length > 2) {
        candidates.push(countryPart);
      }
    }
  } else if (commaParts.length > 2) {
    candidates.push(commaParts.slice(0, 2).join(', '));
    candidates.push(commaParts.slice(-2).join(', '));
  }

  const andMatch = locationName.match(/^([^(]+?)\s+(?:and|&)\s+/i);
  if (andMatch) {
    candidates.push(andMatch[1].trim());
  }

  return [...new Set(candidates.filter(c => c.length > 0))];
}

async function tryGeocodeWithFallback(locationName: string, retryCount = 0): Promise<GeocodedLocation | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const maxRetries = 2;

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
      if (response.status === 429 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`   ⏳ Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryGeocodeWithFallback(locationName, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();

    if (!data || !data.lat || !data.lon) {
      return null;
    }

    return data;
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`   ⚠️ Error occurred, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return tryGeocodeWithFallback(locationName, retryCount + 1);
    }
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

    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }

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
