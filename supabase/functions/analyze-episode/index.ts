import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  action: "analyze" | "extractLocations" | "chat";
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
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "analyze") {
      const systemPrompt = `You are an expert at analyzing podcast transcripts. Extract the following information and return it as a JSON object:\n\n1. "summary": A concise TL;DR summary (3-5 sentences) capturing the main points and takeaways\n\n2. "keyMoments": Array of 5-8 key moments that are important, interesting, or surprising from the episode. Format: [{"title": "Brief catchy title", "description": "2-3 sentence description", "quote": "direct quote from transcript if available", "timestamp": "approximate time or context"}]\n\n3. "keyPersonnel": Array of ALL key people mentioned throughout the ENTIRE transcript. For each person include:\n   - name: person's name\n   - role: their role/title\n   - relevance: detailed explanation (2-3 sentences) about their involvement and significance\n   - quotes: array of 1-2 relevant direct quotes from the transcript about or by this person\n   Format: [{"name": "...", "role": "...", "relevance": "...", "quotes": ["...", "..."]}]\n\n4. "timeline": Array of ALL chronological events mentioned throughout the ENTIRE transcript. For each event include:\n   - date: the date (specific or relative like "2020", "Last year")\n   - event: brief title of the event\n   - significance: why it matters (1-2 sentences)\n   - details: more comprehensive details about what happened (2-3 sentences)\n   - quotes: array of 1-2 relevant direct quotes from the transcript about this event\n   Format: [{"date": "...", "event": "...", "significance": "...", "details": "...", "quotes": ["...", "..."]}]\n\n5. "locations": Array of ALL geographic locations mentioned throughout the ENTIRE transcript. For each location include:\n   - name: location name\n   - context: detailed context (2-3 sentences) about what happened at this location according to the transcript, including specific events, people involved, and outcomes\n   - quotes: array of 1-2 relevant direct quotes from the transcript mentioning this location\n   Format: [{"name": "...", "context": "...", "quotes": ["...", "..."]}]\n\nBe comprehensive and thorough. Include direct quotes from the transcript wherever possible to support the information. Make sure quotes are actual verbatim text from the transcript.\n\nReturn ONLY valid JSON, no additional text.`;

      const input = `${systemPrompt}\n\nAnalyze this podcast transcript:\n\n${transcript}`;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input: input,
          max_output_tokens: 6000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API response structure:", JSON.stringify({
        hasOutput: !!data.output,
        outputType: typeof data.output,
        isOutputArray: Array.isArray(data.output),
        outputLength: Array.isArray(data.output) ? data.output.length : 0,
        firstOutputItem: Array.isArray(data.output) && data.output[0] ? {
          type: data.output[0].type,
          hasContent: !!data.output[0].content,
          contentType: typeof data.output[0].content,
        } : null,
        keys: Object.keys(data),
      }, null, 2));

      let content = "";

      if (data.output && Array.isArray(data.output)) {
        for (const outputItem of data.output) {
          console.log("Processing output item:", { type: outputItem.type, hasContent: !!outputItem.content });
          if (outputItem.type === "message" && outputItem.content && Array.isArray(outputItem.content)) {
            for (const contentItem of outputItem.content) {
              console.log("Processing content item:", { type: contentItem.type, hasText: !!contentItem.text });
              if (contentItem.type === "output_text" && contentItem.text) {
                content += contentItem.text;
              }
            }
          }
        }
      }

      console.log("Extracted content length:", content.length);
      console.log("Extracted content preview:", content.substring(0, 500));

      if (!content) {
        console.error("No content extracted from response");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON object found in content");
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [], keyMoments: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let analysis;
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Attempted to parse:", jsonMatch[0].substring(0, 1000));
        return new Response(
          JSON.stringify({
            error: "Failed to parse AI response",
            summary: "",
            keyPersonnel: [],
            timeline: [],
            locations: [],
            keyMoments: []
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const result = {
        summary: analysis.summary || "",
        keyPersonnel: Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [],
        timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments : [],
      };

      return new Response(
        JSON.stringify({ cached: false, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "extractLocations") {
      const systemPrompt = `You are a location extraction expert. Extract ALL geographic locations (cities, countries, landmarks, regions, states, neighborhoods, etc.) mentioned throughout the ENTIRE text. For each location include:\n- name: location name\n- context: detailed context (2-3 sentences) about what happened at this location according to the transcript\n- quotes: array of 1-2 relevant direct quotes from the transcript mentioning this location\n\nBe comprehensive and thorough. Return ONLY a JSON array. Example format: [{"name": "Paris", "context": "The conference took place here where major announcements were made about the future of AI", "quotes": ["We gathered in Paris for the biggest tech conference of the year", "Paris was buzzing with excitement"]}, {"name": "New York", "context": "...", "quotes": ["..."]}]`;

      const input = `${systemPrompt}\n\nExtract all geographic locations from this transcript:\n\n${transcript}`;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input: input,
          max_output_tokens: 3000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Location extraction raw response:", JSON.stringify(data, null, 2));

      let content = "";

      if (data.output && Array.isArray(data.output)) {
        for (const outputItem of data.output) {
          if (outputItem.type === "message" && outputItem.content && Array.isArray(outputItem.content)) {
            for (const contentItem of outputItem.content) {
              if (contentItem.type === "output_text" && contentItem.text) {
                content += contentItem.text;
              }
            }
          }
        }
      }

      console.log("Extracted location content:", content.substring(0, 500));

      if (!content) {
        console.error("No content extracted for locations");
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("No JSON array found in location content");
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let locations;
      try {
        locations = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Location JSON parse error:", parseError);
        console.error("Attempted to parse:", jsonMatch[0].substring(0, 1000));
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify(Array.isArray(locations) ? locations : []),
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