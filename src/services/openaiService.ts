import { supabase } from '../lib/supabase';

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

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new OpenAIServiceError('Authentication required. Please sign in.');
  }
  return session.access_token;
}

export async function extractLocationsFromTranscript(
  transcript: string
): Promise<ExtractedLocation[]> {
  try {
    const token = await getAuthToken();

    const { data, error } = await supabase.functions.invoke('analyze-episode', {
      body: {
        action: 'extractLocations',
        transcript,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      throw new OpenAIServiceError(error.message || 'Failed to extract locations from transcript');
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    throw new OpenAIServiceError('Failed to extract locations from transcript');
  }
}

export async function analyzeTranscript(
  transcript: string,
  episodeId?: string
): Promise<TranscriptAnalysis> {
  try {
    const token = await getAuthToken();

    const { data, error } = await supabase.functions.invoke('analyze-episode', {
      body: {
        action: 'analyze',
        transcript,
        episodeId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      throw new OpenAIServiceError(error.message || 'Failed to analyze transcript');
    }

    return {
      summary: data?.summary || '',
      keyPersonnel: Array.isArray(data?.keyPersonnel) ? data.keyPersonnel : [],
      timeline: Array.isArray(data?.timeline) ? data.timeline : [],
      locations: Array.isArray(data?.locations) ? data.locations : [],
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
  try {
    const token = await getAuthToken();

    const { data, error } = await supabase.functions.invoke('analyze-episode', {
      body: {
        action: 'chat',
        transcript,
        episodeTitle,
        userQuestion,
        conversationHistory,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      throw new OpenAIServiceError(error.message || 'Failed to process chat message');
    }

    if (!data?.content) {
      throw new OpenAIServiceError('No response from AI');
    }

    return data.content;
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    throw new OpenAIServiceError('Failed to process chat message');
  }
}

export { OpenAIServiceError };
