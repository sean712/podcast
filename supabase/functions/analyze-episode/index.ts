import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  action: "analyze" | "chat";
  episodeId?: string;
  podcastId?: string;
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

const WIKIPEDIA_REST_API = "https://en.wikipedia.org/api/rest_v1";

const WIKIPEDIA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; PodcastBot/1.0; +https://example.com)",
  "Accept": "application/json",
  "Api-User-Agent": "PodcastAnalyzer/1.0 (contact@example.com)",
};

function normalizeNameForComparison(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeNameForComparison(name1);
  const norm2 = normalizeNameForComparison(name2);

  if (norm1 === norm2) return 1.0;

  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');

  let matchingWords = 0;
  for (const word of words1) {
    if (word.length > 2 && words2.includes(word)) {
      matchingWords++;
    }
  }

  return matchingWords / Math.max(words1.length, words2.length);
}

function isDisambiguationPage(extract: string, description: string): boolean {
  const disambiguationPatterns = [
    /may refer to/i,
    /can refer to/i,
    /commonly refers to/i,
    /disambiguation/i,
    /list of people/i,
  ];

  const combined = `${extract} ${description}`;
  return disambiguationPatterns.some(pattern => pattern.test(combined));
}

function isPersonPage(description: string, extract: string): boolean {
  const combined = `${description} ${extract}`.toLowerCase();

  if (/\d{3,4}/.test(combined)) {
    return true;
  }

  const personKeywords = [
    "born", "died", "was", "were", "is", "politician", "president", "minister",
    "king", "queen", "emperor", "duke", "prince", "princess", "pope", "cardinal",
    "bishop", "earl", "baron", "count", "general", "admiral", "commander",
    "author", "writer", "actor", "actress", "singer", "musician", "scientist",
    "professor", "doctor", "journalist", "historian", "philosopher", "artist",
    "athlete", "player", "coach", "businessman", "lawyer", "judge", "activist",
    "leader", "diplomat", "ambassador", "governor", "senator", "mayor",
    "chancellor", "dictator", "revolutionary", "inventor", "entrepreneur",
    "producer", "composer", "economist", "physicist", "mathematician", "engineer",
    "architect", "filmmaker", "poet", "novelist", "explorer", "pilot", "astronaut",
    "soldier", "officer", "spy", "assassin", "criminal", "philanthropist",
    "monarch", "ruler", "sovereign", "conqueror", "warrior", "knight", "nobleman",
    "aristocrat", "saint", "martyr", "chancellor", "regent", "heir"
  ];

  if (personKeywords.some(keyword => combined.includes(keyword))) {
    return true;
  }

  return false;
}

async function searchAndValidateWikipediaPerson(
  name: string,
  _role: string
): Promise<{ pageTitle: string; imageUrl?: string; pageUrl: string; extract: string } | null> {
  try {
    const searchUrl = `${WIKIPEDIA_REST_API}/page/search/${encodeURIComponent(name)}?limit=5`;
    console.log(`[WIKI] REST API search for: \"${name}\"`);

    const searchResponse = await fetch(searchUrl, { headers: WIKIPEDIA_HEADERS });
    console.log(`[WIKI] Search status: ${searchResponse.status}`);

    if (!searchResponse.ok) {
      console.error(`[WIKI] Search failed: HTTP ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData?.pages || [];

    if (searchResults.length === 0) {
      console.log(`[WIKI] No results for \"${name}\"`);
      return null;
    }

    console.log(`[WIKI] Found ${searchResults.length} results: ${searchResults.map((r: any) => r.title).join(", ")}`);

    for (const result of searchResults) {
      const pageTitle = result.title;
      const nameSimilarity = calculateNameSimilarity(name, pageTitle);

      if (nameSimilarity < 0.3) {
        continue;
      }

      const summaryUrl = `${WIKIPEDIA_REST_API}/page/summary/${encodeURIComponent(pageTitle)}`;
      const summaryResponse = await fetch(summaryUrl, { headers: WIKIPEDIA_HEADERS });

      if (!summaryResponse.ok) {
        console.error(`[WIKI] Summary fetch failed for ${pageTitle}: HTTP ${summaryResponse.status}`);
        continue;
      }

      const summary = await summaryResponse.json();

      if (summary.type === "disambiguation") {
        continue;
      }

      const extract = summary.extract || "";
      const description = summary.description || "";

      if (!isPersonPage(description, extract)) {
        continue;
      }

      console.log(`[WIKI] MATCH: \"${pageTitle}\" for \"${name}\" - has image: ${!!summary.thumbnail?.source}`);

      return {
        pageTitle,
        imageUrl: summary.thumbnail?.source,
        pageUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
        extract,
      };
    }

    console.log(`[WIKI] No match found for \"${name}\"`);
    return null;
  } catch (error) {
    console.error(`[WIKI] Error for ${name}:`, error);
    return null;
  }
}

async function enrichPersonWithWikipedia(person: any): Promise<any> {
  try {
    const wikiData = await searchAndValidateWikipediaPerson(person.name, person.role || "");
    if (!wikiData) {
      return person;
    }

    return {
      ...person,
      wikipediaImageUrl: wikiData.imageUrl,
      wikipediaPageUrl: wikiData.pageUrl,
    };
  } catch (error) {
    console.error(`[WIKI] Failed to enrich ${person.name}:`, error);
    return person;
  }
}

async function enrichPeopleWithWikipedia(people: any[]): Promise<any[]> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const enrichedPeople: any[] = [];

  console.log(`[WIKI] Starting enrichment for ${people.length} people`);

  for (const person of people) {
    const enriched = await enrichPersonWithWikipedia(person);
    enrichedPeople.push(enriched);
    await delay(300);
  }

  const withWikipedia = enrichedPeople.filter(p => p.wikipediaPageUrl).length;
  console.log(`[WIKI] Complete: ${withWikipedia}/${people.length} enriched`);

  return enrichedPeople;
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
    const { action, episodeId, podcastId, transcript, episodeTitle, userQuestion, conversationHistory } = requestData;

    if (action === "analyze" && episodeId) {
      const { data: cachedAnalysis } = await supabase
        .from("episode_analyses")
        .select("*")
        .eq("episode_id", episodeId)
        .maybeSingle();

      if (cachedAnalysis) {
        let keyPersonnel = cachedAnalysis.key_personnel || [];

        let wikipediaEnabled = true;
        if (podcastId) {
          const { data: settings } = await supabase
            .from('podcast_settings')
            .select('enable_wikipedia_info')
            .eq('podcast_id', podcastId)
            .maybeSingle();
          wikipediaEnabled = settings?.enable_wikipedia_info ?? true;
        }

        const hasAnyWikipedia = keyPersonnel.some((p: any) => p.wikipediaPageUrl);
        const needsWikipediaEnrichment = wikipediaEnabled && keyPersonnel.length > 0 && !hasAnyWikipedia;

        console.log(`[CACHE] Episode ${episodeId}: ${keyPersonnel.length} people, hasWiki=${hasAnyWikipedia}, needsEnrich=${needsWikipediaEnrichment}`);

        if (needsWikipediaEnrichment) {
          console.log(`[CACHE] Enriching ${keyPersonnel.length} people...`);
          keyPersonnel = await enrichPeopleWithWikipedia(keyPersonnel);

          const { error: updateError } = await supabase
            .from("episode_analyses")
            .update({ key_personnel: keyPersonnel })
            .eq("episode_id", episodeId);
          
          if (updateError) {
            console.error("[CACHE] Failed to save:", updateError);
          } else {
            console.log("[CACHE] Saved enriched data");
          }
        }

        return new Response(
          JSON.stringify({
            cached: true,
            summary: cachedAnalysis.summary,
            keyPersonnel: keyPersonnel,
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
          model: "gpt-5",
          input: `You are an expert at analyzing podcast transcripts. Extract comprehensive information including summary, key moments, key personnel, timeline events, locations with supporting quotes, and parallel world events.\n\nIMPORTANT DISTINCTION:\n- TIMELINE: Chronological historical events with dates (wars, treaties, political changes, etc.)\n- KEY MOMENTS: The most memorable, surprising, funny, shocking, or insightful parts of THIS podcast episode that listeners will want to tell others about. These should be the standout moments that make you go 'wow', laugh, or think differently. Focus on revelations, unexpected turns, powerful statements, or fascinating insights shared in the conversation.\n\nFor all timestamps, provide ONLY the start time in the format HH:MM:SS.mmm or MM:SS.mmm (e.g., '01:23:45.678' or '23:45.678'). If you see a range like '00:07:21.390 --> 00:07:38.150', extract only the first part '00:07:21.390'.\n\nAnalyze this podcast transcript and return the analysis in the following JSON format:\n\n${transcript}`,
          max_output_tokens: 16000,
          reasoning: {
            effort: "low"
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
                    description: "5-8 MEMORABLE moments from THIS podcast conversation that are surprising, funny, shocking, insightful, or inspiring - the moments listeners will want to share and remember.",
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
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              timestamp: { type: "string" }
                            },
                            required: ["text", "timestamp"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["name", "role", "relevance", "quotes"],
                      additionalProperties: false
                    }
                  },
                  timeline: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        event: { type: "string" },
                        significance: { type: "string" },
                        details: { type: "string" },
                        quotes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              timestamp: { type: "string" }
                            },
                            required: ["text", "timestamp"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["date", "event", "significance", "details", "quotes"],
                      additionalProperties: false
                    }
                  },
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        context: { type: "string" },
                        quotes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              timestamp: { type: "string" }
                            },
                            required: ["text", "timestamp"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["name", "context", "quotes"],
                      additionalProperties: false
                    }
                  },
                  references: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["book", "film", "company", "product", "article", "website", "other"]
                        },
                        name: { type: "string" },
                        context: { type: "string" },
                        quote: { type: "string" },
                        timestamp: { type: "string" }
                      },
                      required: ["type", "name", "context", "quote", "timestamp"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["summary", "keyMoments", "keyPersonnel", "timeline", "locations", "references"],
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

      if (data.status === "incomplete") {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const messageItem = data.output.find((item: any) => item.type === "message");
      if (!messageItem || !messageItem.content || !Array.isArray(messageItem.content) || messageItem.content.length === 0) {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentItem = messageItem.content.find((item: any) => item.type === "output_text");

      if (!contentItem || contentItem.type === "refusal" || !contentItem.text) {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const analysis = JSON.parse(contentItem.text);

      let references = Array.isArray(analysis.references) ? analysis.references : [];
      let keyPersonnel = Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [];

      let wikipediaEnabled = true;
      if (podcastId) {
        const { data: settings } = await supabase
          .from('podcast_settings')
          .select('enable_wikipedia_info')
          .eq('podcast_id', podcastId)
          .maybeSingle();

        wikipediaEnabled = settings?.enable_wikipedia_info ?? true;
      }

      if (keyPersonnel.length > 0 && wikipediaEnabled) {
        console.log(`[NEW] Enriching ${keyPersonnel.length} people...`);
        keyPersonnel = await enrichPeopleWithWikipedia(keyPersonnel);
      }

      const result = {
        summary: analysis.summary || "",
        keyPersonnel: keyPersonnel,
        timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments : [],
        references: references,
      };

      return new Response(
        JSON.stringify({ cached: false, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "chat") {
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful assistant that answers questions about a podcast episode titled \"${episodeTitle}\".\\n\\nHere is the full transcript:\\n\\n${transcript}`,
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

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return new Response(
        JSON.stringify({ content }),
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