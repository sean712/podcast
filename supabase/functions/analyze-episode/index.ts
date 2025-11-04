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

interface CachedAnalysis {
  id: string;
  episode_id: string;
  summary: string;
  key_personnel: any[];
  timeline_events: any[];
  locations: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "analyze") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert at analyzing podcast transcripts. Extract the following information and return it as a JSON object:

1. "summary": A concise TL;DR summary (3-5 sentences) capturing the main points and takeaways
2. "keyPersonnel": Array of ALL key people mentioned throughout the ENTIRE transcript with their role and relevance. Be thorough and comprehensive - include every person who plays a significant role in the discussion. Format: [{"name": "...", "role": "...", "relevance": "..."}]
3. "timeline": Array of ALL chronological events mentioned throughout the ENTIRE transcript. Be comprehensive and include all significant dates and events discussed. Format: [{"date": "...", "event": "...", "significance": "..."}]. Use relative dates if specific dates aren't mentioned (e.g., "2020", "Last year", "Beginning of career")
4. "locations": Array of ALL geographic locations mentioned throughout the ENTIRE transcript. Be thorough and include every location reference. Format: [{"name": "...", "context": "..."}]

Be comprehensive and thorough in your extraction. Include as many relevant items as you can find in each category.

Return ONLY valid JSON, no additional text.`,
            },
            {
              role: "user",
              content: `Analyze this podcast transcript:\n\n${transcript}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ summary: "", keyPersonnel: [], timeline: [], locations: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const analysis = JSON.parse(jsonMatch[0]);
      const result = {
        summary: analysis.summary || "",
        keyPersonnel: Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [],
        timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
      };

      return new Response(
        JSON.stringify({ cached: false, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "extractLocations") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a location extraction expert. Extract ALL geographic locations (cities, countries, landmarks, regions, states, neighborhoods, etc.) mentioned throughout the ENTIRE text. Be comprehensive and thorough - include every location reference you find, no matter how brief. Return ONLY a JSON array of objects with "name" and optional "context" fields. The name should be the location name, and context should be a brief description of why it was mentioned. Return locations in order of importance. Example format: [{"name": "Paris", "context": "where the event took place"}, {"name": "New York", "context": "speaker's hometown"}]`,
            },
            {
              role: "user",
              content: `Extract all geographic locations from this transcript:\n\n${transcript}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const locations = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(Array.isArray(locations) ? locations : []),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "chat") {
      const messages = [
        {
          role: "system" as const,
          content: `You are a helpful assistant that answers questions about a podcast episode titled "${episodeTitle}".

You have access to the full transcript of the episode. Use the transcript to provide accurate, detailed answers to user questions.

When answering:
- Be conversational and helpful
- Quote relevant parts of the transcript when appropriate
- If the answer isn't in the transcript, say so honestly
- Provide context and explain connections between topics
- Keep responses concise but informative

Here is the full transcript:

${transcript}`,
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