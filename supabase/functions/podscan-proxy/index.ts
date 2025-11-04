import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PodscanRequest {
  action: "search" | "getEpisodes" | "getEpisode";
  query?: string;
  podcastId?: string;
  episodeId?: string;
  perPage?: number;
  orderBy?: string;
  orderDir?: string;
  showOnlyFullyProcessed?: boolean;
  showFullPodcast?: boolean;
  wordLevelTimestamps?: boolean;
  transcriptFormatter?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const podscanApiKey = Deno.env.get("PODSCAN_API_KEY");
    const podscanApiUrl = Deno.env.get("PODSCAN_API_URL") || "https://podscan.fm/api/v1";

    if (!podscanApiKey) {
      throw new Error("PODSCAN_API_KEY not configured");
    }

    const requestData: PodscanRequest = await req.json();
    const { action } = requestData;

    const podscanHeaders = {
      "Authorization": `Bearer ${podscanApiKey}`,
      "Content-Type": "application/json",
    };

    if (action === "search") {
      const { query, perPage = 20, orderBy = "best_match", orderDir = "desc" } = requestData;

      if (!query) {
        return new Response(
          JSON.stringify({ error: "Query parameter required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        query,
        per_page: perPage.toString(),
        order_by: orderBy,
        order_dir: orderDir,
      });

      const response = await fetch(`${podscanApiUrl}/podcasts/search?${params}`, {
        headers: podscanHeaders,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryMessage = retryAfter
            ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
            : "Rate limit exceeded. Please wait a few minutes before trying again.";
          return new Response(
            JSON.stringify({ error: retryMessage }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        return new Response(
          JSON.stringify({ error: errorData.error || `API request failed with status ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getEpisodes") {
      const {
        podcastId,
        perPage = 50,
        orderBy = "posted_at",
        orderDir = "desc",
        showOnlyFullyProcessed = false,
      } = requestData;

      if (!podcastId) {
        return new Response(
          JSON.stringify({ error: "Podcast ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        per_page: perPage.toString(),
        order_by: orderBy,
        order_dir: orderDir,
        show_only_fully_processed: showOnlyFullyProcessed.toString(),
      });

      const response = await fetch(`${podscanApiUrl}/podcasts/${podcastId}/episodes?${params}`, {
        headers: podscanHeaders,
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        return new Response(
          JSON.stringify({ error: errorData.error || `API request failed with status ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getEpisode") {
      const {
        episodeId,
        showFullPodcast = false,
        wordLevelTimestamps = false,
        transcriptFormatter,
      } = requestData;

      if (!episodeId) {
        return new Response(
          JSON.stringify({ error: "Episode ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        show_full_podcast: showFullPodcast.toString(),
        word_level_timestamps: wordLevelTimestamps.toString(),
      });

      if (transcriptFormatter) {
        params.set("transcript_formatter", transcriptFormatter);
      }

      const response = await fetch(`${podscanApiUrl}/episodes/${episodeId}?${params}`, {
        headers: podscanHeaders,
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        return new Response(
          JSON.stringify({ error: errorData.error || `API request failed with status ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in podscan-proxy function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});