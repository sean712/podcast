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

function scoreResult(result: NominatimResult, locationName: string, expectedType: string | null): number {
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

  const expectedRegion = extractExpectedRegion(locationName);
  if (expectedRegion) {
    if (displayNameLower.includes(expectedRegion)) {
      score += 300;
    } else {
      score -= 500;
    }
  }

  return score;
}

function validateResult(result: NominatimResult, locationName: string, expectedType: string | null): boolean {
  if (result.class === 'building' && expectedType && expectedType !== 'building') {
    console.log(`❌ Rejecting building result for ${locationName} (expected ${expectedType})`);
    return false;
  }

  if (expectedType === 'river' && !(result.class === 'waterway' && result.type === 'river')) {
    console.log(`❌ Rejecting non-river result for ${locationName}`);
    return false;
  }

  const displayNameLower = result.display_name.toLowerCase();
  const expectedRegion = extractExpectedRegion(locationName);

  if (expectedRegion) {
    if (!displayNameLower.includes(expectedRegion)) {
      console.log(`❌ Rejecting result - expected region "${expectedRegion}" not found in "${result.display_name}"`);
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

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=5`,
      {
        headers: {
          "User-Agent": "PodcastTranscriptViewer/1.0 (Supabase Edge Function)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed with status ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`❌ No results found for "${locationName}"`);
      return new Response(
        JSON.stringify(null),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expectedType = detectFeatureType(locationName);
    console.log(`   Expected feature type: ${expectedType || 'any'}`);
    console.log(`   Found ${data.length} candidate(s)`);

    const validResults = data.filter(result => validateResult(result, locationName, expectedType));

    if (validResults.length === 0) {
      console.log(`❌ No valid results after filtering for "${locationName}"`);
      return new Response(
        JSON.stringify(null),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scoredResults = validResults.map(result => ({
      result,
      score: scoreResult(result, locationName, expectedType)
    }));

    scoredResults.sort((a, b) => b.score - a.score);

    console.log(`   Top results:`);
    scoredResults.slice(0, 3).forEach((item, idx) => {
      console.log(`   ${idx + 1}. [Score: ${item.score.toFixed(1)}] ${item.result.display_name} (${item.result.class}/${item.result.type})`);
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