import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  place_rank: number;
}

interface RegionBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const REGION_BOUNDS: Record<string, RegionBounds> = {
  'palestine': { minLat: 29.5, maxLat: 33.5, minLon: 34.0, maxLon: 36.0 },
  'israel': { minLat: 29.5, maxLat: 33.5, minLon: 34.0, maxLon: 36.0 },
  'syria': { minLat: 32.0, maxLat: 37.5, minLon: 35.5, maxLon: 42.5 },
  'lebanon': { minLat: 33.0, maxLat: 34.7, minLon: 35.0, maxLon: 36.7 },
  'jordan': { minLat: 29.0, maxLat: 33.5, minLon: 34.5, maxLon: 39.5 },
  'iraq': { minLat: 29.0, maxLat: 37.5, minLon: 38.5, maxLon: 49.0 },
  'egypt': { minLat: 22.0, maxLat: 32.0, minLon: 25.0, maxLon: 36.0 },
  'saudi arabia': { minLat: 16.0, maxLat: 32.5, minLon: 34.5, maxLon: 56.0 },
  'yemen': { minLat: 12.0, maxLat: 19.0, minLon: 42.5, maxLon: 54.5 },
  'kuwait': { minLat: 28.5, maxLat: 30.5, minLon: 46.5, maxLon: 49.0 },
  'oman': { minLat: 16.5, maxLat: 26.5, minLon: 52.0, maxLon: 60.0 },
  'united arab emirates': { minLat: 22.5, maxLat: 26.5, minLon: 51.0, maxLon: 56.5 },
  'turkey': { minLat: 36.0, maxLat: 42.5, minLon: 26.0, maxLon: 45.0 },
  'russia': { minLat: 41.0, maxLat: 82.0, minLon: 19.0, maxLon: 180.0 },
  'ukraine': { minLat: 44.0, maxLat: 53.0, minLon: 22.0, maxLon: 40.5 },
  'china': { minLat: 18.0, maxLat: 54.0, minLon: 73.0, maxLon: 135.0 },
  'india': { minLat: 8.0, maxLat: 37.0, minLon: 68.0, maxLon: 97.5 },
};

function detectFeatureType(locationName: string): string | null {
  const lowerName = locationName.toLowerCase();

  if (lowerName.includes('river') || lowerName.includes('نهر')) return 'river';
  if (lowerName.includes('mountain') || lowerName.includes('mt.') || lowerName.includes('mount')) return 'mountain';
  if (lowerName.includes('sea') || lowerName.includes('ocean')) return 'sea';
  if (lowerName.includes('lake')) return 'lake';
  if (lowerName.includes('desert')) return 'desert';
  if (lowerName.includes('valley')) return 'valley';

  return null;
}

function extractExpectedRegion(locationName: string): string | null {
  const lowerName = locationName.toLowerCase();

  const regionPatterns = [
    { pattern: /(palestine|palestinian territories?|west bank|gaza)/i, region: 'palestine' },
    { pattern: /(israel)/i, region: 'israel' },
    { pattern: /(syria|syrian)/i, region: 'syria' },
    { pattern: /(lebanon|lebanese)/i, region: 'lebanon' },
    { pattern: /(jordan|jordanian)/i, region: 'jordan' },
    { pattern: /(iraq|iraqi)/i, region: 'iraq' },
    { pattern: /(egypt|egyptian)/i, region: 'egypt' },
    { pattern: /(saudi arabia|saudi)/i, region: 'saudi arabia' },
    { pattern: /(yemen|yemeni)/i, region: 'yemen' },
    { pattern: /(kuwait|kuwaiti)/i, region: 'kuwait' },
    { pattern: /(oman|omani)/i, region: 'oman' },
    { pattern: /(uae|emirates|united arab emirates)/i, region: 'united arab emirates' },
    { pattern: /(turkey|turkish)/i, region: 'turkey' },
    { pattern: /(russia|russian)/i, region: 'russia' },
    { pattern: /(ukraine|ukrainian)/i, region: 'ukraine' },
    { pattern: /(china|chinese)/i, region: 'china' },
    { pattern: /(india|indian)/i, region: 'india' },
  ];

  for (const { pattern, region } of regionPatterns) {
    if (pattern.test(lowerName)) {
      return region;
    }
  }

  return null;
}

function isWithinBounds(lat: number, lon: number, region: string): boolean {
  const bounds = REGION_BOUNDS[region];
  if (!bounds) return true;

  return lat >= bounds.minLat && lat <= bounds.maxLat &&
         lon >= bounds.minLon && lon <= bounds.maxLon;
}

function parseStructuredLocation(locationName: string): { city: string; country: string } | null {
  const parts = locationName.split(',').map(p => p.trim());
  if (parts.length !== 2) return null;

  const [city, country] = parts;
  if (city.length < 2 || country.length < 2) return null;

  return { city, country };
}

async function tryStructuredSearch(city: string, country: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&format=json&limit=10`;

  console.log(`   📍 Trying structured search: city="${city}", country="${country}"`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "PodcastTranscriptViewer/1.0 (Supabase Edge Function)",
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  console.log(`   → Structured search returned ${data.length} results`);
  return Array.isArray(data) ? data : [];
}

function scoreResult(result: NominatimResult, locationName: string, expectedType: string | null, expectedRegion: string | null): number {
  let score = 0;

  score += result.importance * 100;

  if (expectedType) {
    if (expectedType === 'river' && result.class === 'waterway' && result.type === 'river') {
      score += 200;
    } else if (expectedType === 'mountain' && result.class === 'natural' && result.type === 'peak') {
      score += 200;
    } else if (expectedType === 'sea' && result.class === 'natural' && result.type === 'water') {
      score += 200;
    } else if (expectedType === 'lake' && result.class === 'natural' && result.type === 'water') {
      score += 200;
    }
  }

  if (result.place_rank <= 12) {
    score += 50;
  } else if (result.place_rank <= 16) {
    score += 30;
  }

  if (result.class === 'place' && ['city', 'town', 'village', 'country', 'state'].includes(result.type)) {
    score += 40;
  }

  if (result.class === 'building' || result.type === 'apartments' || result.type === 'tower') {
    score -= 150;
  }

  const displayNameLower = result.display_name.toLowerCase();
  const searchNameLower = locationName.toLowerCase();

  const mainSearchTerm = searchNameLower.split(',')[0].trim();
  if (displayNameLower.includes(mainSearchTerm)) {
    score += 30;
  }

  if (expectedRegion) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (displayNameLower.includes(expectedRegion)) {
      score += 300;

      if (isWithinBounds(lat, lon, expectedRegion)) {
        score += 200;
      }
    } else {
      score -= 1000;
    }

    if (!isWithinBounds(lat, lon, expectedRegion)) {
      score -= 500;
    }
  }

  return score;
}

function validateResult(result: NominatimResult, locationName: string, expectedType: string | null, expectedRegion: string | null): boolean {
  if (result.class === 'building' && expectedType && expectedType !== 'building') {
    console.log(`❌ Rejecting building result for ${locationName} (expected ${expectedType})`);
    return false;
  }

  if (expectedType === 'river' && !(result.class === 'waterway' && result.type === 'river')) {
    console.log(`❌ Rejecting non-river result for ${locationName}`);
    return false;
  }

  const displayNameLower = result.display_name.toLowerCase();

  if (expectedRegion) {
    if (!displayNameLower.includes(expectedRegion)) {
      console.log(`❌ Rejecting result - expected region "${expectedRegion}" not found in "${result.display_name}"`);
      return false;
    }

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (!isWithinBounds(lat, lon, expectedRegion)) {
      console.log(`❌ Rejecting result - coordinates (${lat}, ${lon}) outside bounds for ${expectedRegion}`);
      return false;
    }
  }

  if (result.class === 'place' && ['city', 'town', 'village', 'country', 'state', 'county'].includes(result.type)) {
    console.log(`✅ Accepting place result: ${result.type}`);
    return true;
  }

  const searchNameLower = locationName.toLowerCase();
  const mainSearchTerm = searchNameLower.split(',')[0].trim().replace(/\s+/g, ' ');

  if (mainSearchTerm.length > 3) {
    const searchWords = mainSearchTerm.split(' ').filter(w => w.length > 2);
    const hasMatch = searchWords.some(word => displayNameLower.includes(word));

    if (!hasMatch) {
      console.log(`❌ Rejecting result - no matching terms between "${mainSearchTerm}" and "${result.display_name}"`);
      return false;
    }
  }

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { locationName } = await req.json();

    if (!locationName) {
      return new Response(
        JSON.stringify({ error: "locationName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Geocoding: "${locationName}"`);

    const expectedRegion = extractExpectedRegion(locationName);
    const expectedType = detectFeatureType(locationName);
    console.log(`   Expected region: ${expectedRegion || 'none'}`);
    console.log(`   Expected feature type: ${expectedType || 'any'}`);

    let data: NominatimResult[] = [];

    const structured = parseStructuredLocation(locationName);
    if (structured && expectedRegion) {
      data = await tryStructuredSearch(structured.city, structured.country);
    }

    if (data.length === 0) {
      console.log(`   🔍 Trying free-form search`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=10`,
        {
          headers: {
            "User-Agent": "PodcastTranscriptViewer/1.0 (Supabase Edge Function)",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed with status ${response.status}`);
      }

      data = await response.json();
      console.log(`   → Free-form search returned ${data.length} results`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`❌ No results found for "${locationName}"`);
      return new Response(
        JSON.stringify(null),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`   Found ${data.length} candidate(s)`);

    const validResults = data.filter(result => validateResult(result, locationName, expectedType, expectedRegion));

    if (validResults.length === 0) {
      console.log(`❌ No valid results after filtering for "${locationName}"`);
      return new Response(
        JSON.stringify(null),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scoredResults = validResults.map(result => ({
      result,
      score: scoreResult(result, locationName, expectedType, expectedRegion)
    }));

    scoredResults.sort((a, b) => b.score - a.score);

    console.log(`   Top results:`);
    scoredResults.slice(0, 3).forEach((item, idx) => {
      console.log(`   ${idx + 1}. [Score: ${item.score.toFixed(1)}] ${item.result.display_name} (${item.result.class}/${item.result.type}) at ${item.result.lat}, ${item.result.lon}`);
    });

    const bestResult = scoredResults[0].result;
    const geocoded = {
      name: locationName,
      lat: parseFloat(bestResult.lat),
      lon: parseFloat(bestResult.lon),
      displayName: bestResult.display_name,
    };

    console.log(`✅ Selected: ${geocoded.displayName} at ${geocoded.lat}, ${geocoded.lon}`);

    return new Response(
      JSON.stringify(geocoded),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in geocode-location function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});