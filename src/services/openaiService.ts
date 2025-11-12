import { supabase } from '../lib/supabase';

export interface ExtractedLocation {
  name: string;
  context?: string;
  quotes?: string[];
}

export interface KeyPerson {
  name: string;
  role: string;
  relevance: string;
  quotes?: string[];
}

export interface TimelineEvent {
  date: string;
  event: string;
  significance: string;
  details?: string;
  quotes?: string[];
}

export interface KeyMoment {
  title: string;
  description: string;
  quote?: string;
  timestamp?: string;
}

export interface Reference {
  type: 'book' | 'film' | 'company' | 'product' | 'article' | 'website' | 'other';
  name: string;
  context?: string;
  quote?: string;
}

export interface TranscriptAnalysis {
  summary: string;
  keyPersonnel: KeyPerson[];
  timeline: TimelineEvent[];
  locations: ExtractedLocation[];
  keyMoments: KeyMoment[];
  references: Reference[];
}

class OpenAIServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export async function analyzeTranscript(
  transcript: string,
  episodeId?: string
): Promise<TranscriptAnalysis> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-episode', {
      body: {
        action: 'analyze',
        transcript,
        episodeId,
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
      keyMoments: Array.isArray(data?.keyMoments) ? data.keyMoments : [],
      references: Array.isArray(data?.references) ? data.references : [],
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
    const { data, error } = await supabase.functions.invoke('analyze-episode', {
      body: {
        action: 'chat',
        transcript,
        episodeTitle,
        userQuestion,
        conversationHistory,
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
