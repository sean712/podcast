import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Loader2, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AudioPlayer from './AudioPlayer';
import TranscriptViewer from './TranscriptViewer';
import EpisodeSummary from './EpisodeSummary';
import KeyPersonnel from './KeyPersonnel';
import Timeline from './Timeline';
import LocationMap from './LocationMap';
import KeyMoments from './KeyMoments';
import References from './References';
import type { StoredEpisode, PodcastSpace } from '../types/multiTenant';

interface FeaturedEpisodeViewerProps {
  episodeSlug: string;
}

export default function FeaturedEpisodeViewer({ episodeSlug }: FeaturedEpisodeViewerProps) {
  const [episode, setEpisode] = useState<StoredEpisode | null>(null);
  const [podcast, setPodcast] = useState<PodcastSpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadEpisode();
  }, [episodeSlug]);

  const loadEpisode = async () => {
    setIsLoading(true);
    setNotFound(false);

    try {
      const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .select('*')
        .eq('slug', episodeSlug)
        .maybeSingle();

      if (episodeError || !episodeData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setEpisode(episodeData);

      const { data: podcastData } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', episodeData.podcast_id)
        .maybeSingle();

      if (podcastData) {
        setPodcast(podcastData);
      }
    } catch (err) {
      console.error('Error loading featured episode:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToFeatured = () => {
    window.history.pushState({}, '', '/featured');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !episode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-slate-400 mb-6">Episode not found</p>
          <button
            onClick={handleBackToFeatured}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Featured Episodes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToFeatured}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Featured</span>
            </button>
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6 text-cyan-500" />
              <span className="text-lg font-bold text-white">Augmented Pods</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <Star className="w-5 h-5 fill-amber-500" />
              <span className="text-sm font-semibold">Featured</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          {podcast && (
            <div className="flex items-center gap-3 mb-4">
              {podcast.image_url && (
                <img
                  src={podcast.image_url}
                  alt={podcast.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-sm font-medium text-emerald-400">{podcast.name}</h2>
                {podcast.publisher_name && (
                  <p className="text-xs text-slate-500">by {podcast.publisher_name}</p>
                )}
              </div>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {episode.title}
          </h1>
          {episode.description && (
            <p className="text-slate-300 text-lg leading-relaxed">
              {episode.description}
            </p>
          )}
        </div>

        {episode.audio_url && (
          <div className="mb-8">
            <AudioPlayer
              audioUrl={episode.audio_url}
              episodeId={episode.episode_id}
              episodeTitle={episode.title}
              podcastTitle={podcast?.name || ''}
              episodeImageUrl={episode.image_url || podcast?.image_url}
              transcript={episode.transcript}
              wordTimestamps={episode.transcript_word_timestamps}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <EpisodeSummary episodeId={episode.episode_id} />
            <KeyPersonnel episodeId={episode.episode_id} />
            <Timeline episodeId={episode.episode_id} />
            <KeyMoments episodeId={episode.episode_id} />
            <References episodeId={episode.episode_id} />
            {episode.transcript && (
              <TranscriptViewer
                transcript={episode.transcript}
                wordTimestamps={episode.transcript_word_timestamps}
              />
            )}
          </div>
          <div className="space-y-6">
            <LocationMap episodeId={episode.episode_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
