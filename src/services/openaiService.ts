const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface ExtractedLocation {
  name: string;
  context?: string;
}

export interface KeyPerson {
  name: string;
  role: string;
  relevance: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  significance: string;
}

export interface TranscriptAnalysis {
  summary: string;
  keyPersonnel: KeyPerson[];
  timeline: TimelineEvent[];
  locations: ExtractedLocation[];
}

class OpenAIServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export async function extractLocationsFromTranscript(
  transcript: string
): Promise<ExtractedLocation[]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new OpenAIServiceError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a location extraction expert. Extract ALL geographic locations (cities, countries, landmarks, regions, states, neighborhoods, etc.) mentioned throughout the ENTIRE text. Be comprehensive and thorough - include every location reference you find, no matter how brief. Return ONLY a JSON array of objects with "name" and optional "context" fields. The name should be the location name, and context should be a brief description of why it was mentioned. Return locations in order of importance. Example format: [{"name": "Paris", "context": "where the event took place"}, {"name": "New York", "context": "speaker's hometown"}]`
          },
          {
            role: 'user',
            content: `Extract all geographic locations from this transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenAIServiceError(
        errorData.error?.message || `OpenAI API request failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return [];
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const locations = JSON.parse(jsonMatch[0]);
    return Array.isArray(locations) ? locations : [];
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    throw new OpenAIServiceError('Failed to extract locations from transcript');
  }
}

export async function analyzeTranscript(
  transcript: string
): Promise<TranscriptAnalysis> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new OpenAIServiceError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing podcast transcripts. Extract the following information and return it as a JSON object:

1. "summary": A concise TL;DR summary (3-5 sentences) capturing the main points and takeaways
2. "keyPersonnel": Array of ALL key people mentioned throughout the ENTIRE transcript with their role and relevance. Be thorough and comprehensive - include every person who plays a significant role in the discussion. Format: [{"name": "...", "role": "...", "relevance": "..."}]
3. "timeline": Array of ALL chronological events mentioned throughout the ENTIRE transcript. Be comprehensive and include all significant dates and events discussed. Format: [{"date": "...", "event": "...", "significance": "..."}]. Use relative dates if specific dates aren't mentioned (e.g., "2020", "Last year", "Beginning of career")
4. "locations": Array of ALL geographic locations mentioned throughout the ENTIRE transcript. Be thorough and include every location reference. Format: [{"name": "...", "context": "..."}]

Be comprehensive and thorough in your extraction. Include as many relevant items as you can find in each category.

Return ONLY valid JSON, no additional text.`
          },
          {
            role: 'user',
            content: `Analyze this podcast transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenAIServiceError(
        errorData.error?.message || `OpenAI API request failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        summary: '',
        keyPersonnel: [],
        timeline: [],
        locations: []
      };
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: '',
        keyPersonnel: [],
        timeline: [],
        locations: []
      };
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return {
      summary: analysis.summary || '',
      keyPersonnel: Array.isArray(analysis.keyPersonnel) ? analysis.keyPersonnel : [],
      timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
      locations: Array.isArray(analysis.locations) ? analysis.locations : []
    };
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    throw new OpenAIServiceError('Failed to analyze transcript');
  }
}

export async function chatWithTranscript(
  transcript: string,
  episodeTitle: string,
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new OpenAIServiceError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful assistant that answers questions about a podcast episode titled "${episodeTitle}".

You have access to the full transcript of the episode. Use the transcript to provide accurate, detailed answers to user questions.

When answering:
- Be conversational and helpful
- Quote relevant parts of the transcript when appropriate
- If the answer isn't in the transcript, say so honestly
- Provide context and explain connections between topics
- Keep responses concise but informative

Here is the full transcript:

${transcript}`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userQuestion
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenAIServiceError(
        errorData.error?.message || `OpenAI API request failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenAIServiceError('No response from OpenAI');
    }

    return content;
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    throw new OpenAIServiceError('Failed to process chat message');
  }
}

export { OpenAIServiceError };
