import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractLocationsRequest {
  transcript: string;
}

async function getConfig(key: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching config for ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Failed to get config ${key}:`, error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiApiKey = await getConfig("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured in app_config table");
    }

    const requestData: ExtractLocationsRequest = await req.json();
    const { transcript } = requestData;

    if (!transcript) {
      throw new Error("No transcript provided");
    }

    console.log("🌍 Starting location extraction for transcript length:", transcript.length);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content: `You are an expert at extracting geographic locations from text. Your goal is to find EVERY location mentioned, no matter how brief the reference.\n\nCRITICAL RULES:\n1. Extract SPECIFIC locations: cities, towns, neighborhoods, landmarks, streets, buildings, regions\n2. When multiple places within a country are mentioned, extract EACH ONE separately\n3. For each location, use format: "City, Country" or "Specific Place, City, Country" or "Region, Country"\n4. Only use country-level when no specific place is mentioned\n5. Include locations mentioned in any context: visited, mentioned, referenced, discussed, etc.\n6. Extract locations from: stories, anecdotes, news references, historical events, personal experiences\n7. Don't skip locations just because they're mentioned briefly\n8. Include context about why the location was mentioned\n\nExamples:\n- If transcript says "I visited Sana'a, then Aden, and finally Hodeidah" → Extract: "Sana'a, Yemen", "Aden, Yemen", "Hodeidah, Yemen"\n- If transcript says "The Pentagon announced..." → Extract: "Pentagon, Arlington, Virginia, USA"\n- If transcript says "Growing up in Brooklyn" → Extract: "Brooklyn, New York, USA"\n- If transcript says "France" without specifics → Extract: "France"\n\nYour success is measured by comprehensiveness - find EVERY location, no matter how small the mention.`
          },
          {
            role: "user",
            content: `Extract ALL locations from this podcast transcript. Be thorough and extract every single geographic location mentioned:\n\n${transcript}`
          }
        ],
        max_output_tokens: 8000,
        reasoning: {
          effort: "medium"
        },
        text: {
          format: {
            type: "json_schema",
            name: "location_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                locations: {
                  type: "array",
                  description: "All geographic locations mentioned in the transcript",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Full location name with country (e.g., 'Brooklyn, New York, USA' or 'Sana'a, Yemen')"
                      },
                      context: {
                        type: "string",
                        description: "Brief explanation of why this location was mentioned or what happened there"
                      },
                      quotes: {
                        type: "array",
                        description: "Direct quotes from transcript mentioning this location",
                        items: { type: "string" }
                      }
                    },
                    required: ["name", "context", "quotes"],
                    additionalProperties: false
                  }
                }
              },
              required: ["locations"],
              additionalProperties: false
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✓ API response status:", data.status);

    if (data.status === "incomplete") {
      console.error("Incomplete response:", data.incomplete_details);
      return new Response(
        JSON.stringify({ locations: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
      console.error("No output in response");
      return new Response(
        JSON.stringify({ locations: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messageItem = data.output.find((item: any) => item.type === "message");
    if (!messageItem || !messageItem.content || !Array.isArray(messageItem.content)) {
      console.error("No message content in output");
      return new Response(
        JSON.stringify({ locations: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textItem = messageItem.content.find((item: any) => item.type === "output_text");
    if (!textItem || !textItem.text) {
      console.error("No output_text in message content");
      return new Response(
        JSON.stringify({ locations: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(textItem.text);
    const locations = Array.isArray(parsed.locations) ? parsed.locations : [];

    console.log(`✓ Extracted ${locations.length} locations`);
    if (locations.length > 0) {
      console.log("First 3 locations:", JSON.stringify(locations.slice(0, 3), null, 2));
    }

    return new Response(
      JSON.stringify({ locations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-locations function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        locations: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});