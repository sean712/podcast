import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  action: "analyze" | "chat" | "extract_locations";
  episodeId?: string;
  transcript: string;
  episodeTitle?: string;
  userQuestion?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = await getConfig("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured in app_config table");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: AnalyzeRequest = await req.json();
    const { action, episodeId, transcript, episodeTitle, userQuestion, conversationHistory } = requestData;

    if (action === "analyze" && episodeId) {
      const { data: cachedAnalysis } = await supabase
        .from("episode_analyses")
        .select("*")
        .eq("episode_id", episodeId)
        .maybeSingle();

      if (cachedAnalysis) {
        return new Response(
          JSON.stringify({
            cached: true,
            summary: cachedAnalysis.summary,
            keyPersonnel: cachedAnalysis.key_personnel,
            timeline: cachedAnalysis.timeline_events,
            locations: cachedAnalysis.locations,
            keyMoments: cachedAnalysis.key_moments || [],
            references: cachedAnalysis.references || [],
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "analyze") {
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
              content: "You are an expert at analyzing podcast transcripts. Extract comprehensive information including summary, key moments, key personnel, timeline events, references, and ALL geographic locations mentioned.\n\nFor LOCATIONS: Find EVERY location mentioned, no matter how brief. Extract SPECIFIC locations: cities, towns, neighborhoods, landmarks, streets, buildings, regions. When multiple places within a country are mentioned, extract EACH ONE separately. Use format: 'City, Country' or 'Specific Place, City, Country' or 'Region, Country'. Only use country-level when no specific place is mentioned. Include locations from stories, anecdotes, news references, historical events, personal experiences."
            },
            {
              role: "user",
              content: `Analyze this podcast transcript and extract ALL locations mentioned:\n\n${transcript}`
            }
          ],
          max_output_tokens: 16000,
          reasoning: {
            effort: "medium"
          },
          text: {
            format: {
              type: "json_schema",
              name: "podcast_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A concise TL;DR summary (3-5 sentences) capturing the main points and takeaways"
                  },
                  keyMoments: {
                    type: "array",
                    description: "5-8 key moments that are important, interesting, or surprising",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        quote: { type: "string" },
                        timestamp: { type: "string" }
                      },
                      required: ["title", "description", "quote", "timestamp"],
                      additionalProperties: false
                    }
                  },
                  keyPersonnel: {
                    type: "array",
                    description: "Key people mentioned in the transcript (max 10)",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        relevance: { type: "string" },
                        quotes: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["name", "role", "relevance", "quotes"],
                      additionalProperties: false
                    }
                  },
                  timeline: {
                    type: "array",
                    description: "Key chronological events mentioned in the transcript (max 10)",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        event: { type: "string" },
                        significance: { type: "string" },
                        details: { type: "string" },
                        quotes: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["date", "event", "significance", "details", "quotes"],
                      additionalProperties: false
                    }
                  },
                  references: {
                    type: "array",
                    description: "Books, films, TV shows, companies, products, articles, websites, and other notable references mentioned. Extract as many as possible with their type and context.",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["book", "film", "company", "product", "article", "website", "other"]
                        },
                        name: { type: "string" },
                        context: { type: "string" },
                        quote: { type: "string" }
                      },
                      required: ["type", "name", "context", "quote"],
                      additionalProperties: false
                    }
                  },
                  locations: {
                    type: "array",
                    description: "ALL geographic locations mentioned in the transcript. Extract EVERY location no matter how brief: cities, towns, neighborhoods, landmarks, streets, buildings, regions. When multiple places within a country are mentioned, extract EACH ONE separately.",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "Full location name with country (e.g., 'Brooklyn, New York, USA' or 'Sana'a, Yemen' or 'Pentagon, Arlington, Virginia, USA')"
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
                required: ["summary", "keyMoments", "keyPersonnel", "timeline", "references", "locations"],
                additionalProperties: false
              }
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response status:", data.status);
      console.log("API Response full structure:", JSON.stringify(data, null, 2));

      if (data.status === "incomplete") {
        console.error("Incomplete response:", data.incomplete_details);
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        console.error("No output in response");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const messageItem = data.output.find((item: any) => item.type === "message");
      if (!messageItem || !messageItem.content || !Array.isArray(messageItem.content) || messageItem.content.length === 0) {
        console.error("No message content in output");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentItem = messageItem.content.find((item: any) => item.type === "output_text");

      if (!contentItem) {
        console.error("No output_text in message content");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (contentItem.type === "refusal") {
        console.error("Model refused:", contentItem.refusal);
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!contentItem.text) {
        console.error("No text in content item");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Content item text:", contentItem.text);
      const analysis = JSON.parse(contentItem.text);
      console.log("Parsed analysis:", JSON.stringify(analysis, null, 2));
      const result = {
        summary: analysis.summary || "",
        keyPersonnel: Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [],
        timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments : [],
        references: Array.isArray(analysis.references) ? analysis.references : [],
      };
      console.log(`Final result: ${result.locations.length} locations extracted`);
      console.log("First 3 locations:", JSON.stringify(result.locations.slice(0, 3), null, 2));

      return new Response(
        JSON.stringify({ cached: false, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "chat") {
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful assistant that answers questions about a podcast episode titled "${episodeTitle}".\n\nYou have access to the full transcript of the episode. Use the transcript to provide accurate, detailed answers to user questions.\n\nWhen answering:\n- Be conversational and helpful\n- Quote relevant parts of the transcript when appropriate\n- If the answer isn't in the transcript, say so honestly\n- Provide context and explain connections between topics\n- Keep responses concise but informative\n\nHere is the full transcript:\n\n${transcript}`,
        },
        ...(conversationHistory || []),
        {
          role: "user" as const,
          content: userQuestion || "",
        },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return new Response(
        JSON.stringify({ content }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "extract_locations") {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Location extraction API response status:", data.status);
      console.log("Location extraction full response:", JSON.stringify(data, null, 2));

      if (data.status === "incomplete") {
        console.error("Incomplete location extraction response:", data.incomplete_details);
        return new Response(
          JSON.stringify({ locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        console.error("No output in location extraction response");
        return new Response(
          JSON.stringify({ locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const messageItem = data.output.find((item: any) => item.type === "message");
      if (!messageItem || !messageItem.content || !Array.isArray(messageItem.content) || messageItem.content.length === 0) {
        console.error("No message content in location extraction output");
        return new Response(
          JSON.stringify({ locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentItem = messageItem.content.find((item: any) => item.type === "output_text");

      if (!contentItem || !contentItem.text) {
        console.error("No output_text in location extraction message content");
        return new Response(
          JSON.stringify({ locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parsed = JSON.parse(contentItem.text);
      console.log(`✓ Extracted ${parsed.locations?.length || 0} locations`);
      console.log("Location details:", JSON.stringify(parsed.locations?.slice(0, 3), null, 2));

      return new Response(
        JSON.stringify({ locations: parsed.locations || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-episode function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});