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

const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";

async function searchWikipediaPerson(name: string): Promise<string | null> {
  try {
    const searchUrl = `${WIKIPEDIA_API_BASE}?action=opensearch&search=${encodeURIComponent(name)}&limit=1&format=json&origin=*`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
      return null;
    }

    return data[1][0];
  } catch (error) {
    console.error(`Error searching Wikipedia for ${name}:`, error);
    return null;
  }
}

async function getPersonWikipediaData(pageTitle: string): Promise<{ imageUrl?: string; pageUrl?: string } | null> {
  try {
    const imageUrl = `${WIKIPEDIA_API_BASE}?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages|info&format=json&pithumbsize=300&inprop=url&origin=*`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.query || !data.query.pages) {
      return null;
    }

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (!page || pageId === "-1") {
      return null;
    }

    const result: { imageUrl?: string; pageUrl?: string } = {
      pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    };

    if (page.thumbnail && page.thumbnail.source) {
      result.imageUrl = page.thumbnail.source;
    }

    return result;
  } catch (error) {
    console.error(`Error fetching Wikipedia data for ${pageTitle}:`, error);
    return null;
  }
}

async function enrichPersonWithWikipedia(person: any): Promise<any> {
  try {
    const pageTitle = await searchWikipediaPerson(person.name);
    if (!pageTitle) {
      return person;
    }

    const wikiData = await getPersonWikipediaData(pageTitle);
    if (!wikiData) {
      return person;
    }

    return {
      ...person,
      wikipediaImageUrl: wikiData.imageUrl,
      wikipediaPageUrl: wikiData.pageUrl,
    };
  } catch (error) {
    console.error(`Failed to enrich ${person.name} with Wikipedia data:`, error);
    return person;
  }
}

async function enrichPeopleWithWikipedia(people: any[]): Promise<any[]> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const enrichedPeople: any[] = [];

  for (const person of people) {
    const enriched = await enrichPersonWithWikipedia(person);
    enrichedPeople.push(enriched);
    await delay(100);
  }

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
                    description: "5-8 MEMORABLE moments from THIS podcast conversation that are surprising, funny, shocking, insightful, or inspiring - the moments listeners will want to share and remember. These should be standout conversational moments, revelations, unexpected insights, powerful statements, or fascinating stories told during the episode. DO NOT include generic historical facts or timeline events. Focus on what makes THIS specific episode engaging and memorable. Examples: unexpected revelations, counterintuitive insights, humorous exchanges, shocking statements, inspiring stories, surprising connections, or 'aha' moments.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Attention-grabbing title that captures the surprise/interest (e.g., 'The Unexpected Truth About...', 'Why Everything We Thought Was Wrong', 'The Moment That Changed Everything')" },
                        description: { type: "string", description: "Explain WHY this moment is memorable, surprising, or significant. What makes it stand out? What's the key insight or takeaway?" },
                        quote: { type: "string", description: "The most compelling quote that captures this memorable moment" },
                        timestamp: { type: "string", description: "Start timestamp only in HH:MM:SS.mmm or MM:SS.mmm format (e.g., '01:23:45.678')" }
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
                              timestamp: { type: "string", description: "Start timestamp only in HH:MM:SS.mmm or MM:SS.mmm format" }
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
                    description: "Key chronological HISTORICAL events with specific dates mentioned in the transcript (max 10). Focus on factual historical events like wars, treaties, political changes, battles, etc. These are different from Key Moments - timeline is about historical facts with dates, while Key Moments are about memorable parts of the podcast conversation itself.",
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
                              timestamp: { type: "string", description: "Start timestamp only in HH:MM:SS.mmm or MM:SS.mmm format" }
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
                    description: "ALL geographic locations mentioned in the transcript - extract SPECIFIC, GRANULAR locations with CLEAN geographic names for accurate geocoding. CRITICAL NAMING RULES: 1) Use standard geographic names WITHOUT qualifiers like '(region)', '(area)', '(city)', '(implied)'. 2) For cities/towns: use 'City, Country' format (e.g., 'Damascus, Syria' NOT 'Damascus (city)' or 'Damascus area'). 3) For rivers/mountains/landmarks: use the proper name only (e.g., 'Euphrates River' NOT 'Euphrates River (region)' or 'Euphrates crossing area'). 4) For regions: include country context (e.g., 'Chechnya, Russia' NOT just 'Chechnya'). 5) For suburbs/neighborhoods: use 'Neighborhood, City, Country' format. 6) If multiple places within a country are mentioned, extract EACH ONE separately with full context. 7) Avoid vague descriptors - use the actual place name. GOOD EXAMPLES: 'Euphrates River', 'Moscow, Russia', 'St. Petersburg, Russia'. BAD EXAMPLES: 'Euphrates River (region)', 'Moscow suburbs', 'Syrian territory (implied)'.",
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
                              timestamp: { type: "string", description: "Start timestamp only in HH:MM:SS.mmm or MM:SS.mmm format" }
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
                        quote: { type: "string" },
                        timestamp: { type: "string", description: "Start timestamp only in HH:MM:SS.mmm or MM:SS.mmm format" }
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

      const annotations = contentItem.annotations || [];
      console.log(`Found ${annotations.length} annotations (URL citations)`);

      const urlCitations: Array<{ url: string; title: string; start_index: number; end_index: number }> = [];
      for (const annotation of annotations) {
        if (annotation.type === "url_citation") {
          urlCitations.push({
            url: annotation.url,
            title: annotation.title || "",
            start_index: annotation.start_index || 0,
            end_index: annotation.end_index || 0
          });
          console.log(`Citation: ${annotation.title} - ${annotation.url}`);
        }
      }

      let references = Array.isArray(analysis.references) ? analysis.references : [];
      if (urlCitations.length > 0 && references.length > 0) {
        console.log("Matching URLs to references...");
        references = references.map((ref: any) => {
          const refUrls: Array<{ url: string; title: string; domain: string }> = [];
          const refName = ref.name.toLowerCase();

          for (const citation of urlCitations) {
            const citationTitle = citation.title.toLowerCase();
            const refWords = refName.split(' ').filter((w: string) => w.length > 3);

            let isMatch = false;
            for (const word of refWords) {
              if (citationTitle.includes(word)) {
                isMatch = true;
                break;
              }
            }

            if (isMatch) {
              try {
                const domain = new URL(citation.url).hostname.replace('www.', '');
                refUrls.push({
                  url: citation.url,
                  title: citation.title,
                  domain: domain
                });
                console.log(`  Matched \"${ref.name}\" with \"${citation.title}\"`);

                if (refUrls.length >= 3) break;
              } catch (e) {
                console.error(`Invalid URL: ${citation.url}`, e);
              }
            }
          }

          if (refUrls.length > 0) {
            return { ...ref, urls: refUrls };
          }
          return ref;
        });

        console.log(`Attached URLs to ${references.filter((r: any) => r.urls).length} references`);
      }

      let keyPersonnel = Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [];

      if (keyPersonnel.length > 0) {
        console.log(`Enriching ${keyPersonnel.length} people with Wikipedia data...`);
        keyPersonnel = await enrichPeopleWithWikipedia(keyPersonnel);
        console.log("Wikipedia enrichment complete");
      }

      const result = {
        summary: analysis.summary || "",
        keyPersonnel: keyPersonnel,
        timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments : [],
        references: references,
      };
      console.log("Final result:", JSON.stringify(result, null, 2));

      return new Response(
        JSON.stringify({ cached: false, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "chat") {
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful assistant that answers questions about a podcast episode titled \"${episodeTitle}\".\\n\\nYou have access to the full transcript of the episode. Use the transcript to provide accurate, detailed answers to user questions.\\n\\nWhen answering:\\n- Be conversational and helpful\\n- Quote relevant parts of the transcript when appropriate\\n- If the answer isn't in the transcript, say so honestly\\n- Provide context and explain connections between topics\\n- Keep responses concise but informative\\n\\nHere is the full transcript:\\n\\n${transcript}`,
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
