import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2, AlertCircle, CheckCircle, Radio, Settings, Zap } from 'lucide-react';
import { getAllActivePodcasts, createPodcast, updatePodcastStatus } from '../services/podcastSpaceService';
import { syncPodcastEpisodes } from '../services/episodeSyncService';
import { searchPodcasts } from '../services/podscanApi';
import { supabase } from '../lib/supabase';
import type { PodcastSpace } from '../types/multiTenant';
import type { Podcast } from '../types/podcast';

export default function AdminPanel() {
  const [podcasts, setPodcasts] = useState<PodcastSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [customSlug, setCustomSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingPodcast, setSyncingPodcast] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    setIsLoading(true);
    try {
      const data = await getAllActivePodcasts();
      setPodcasts(data);
    } catch (err) {
      console.error('Error loading podcasts:', err);
      setError('Failed to load podcasts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const response = await searchPodcasts(searchQuery, { perPage: 10 });
      setSearchResults(response.podcasts || []);
    } catch (err) {
      console.error('Error searching podcasts:', err);
      setError('Failed to search podcasts');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPodcast = (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    const slug = podcast.podcast_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setCustomSlug(slug);
  };

  const handleCreatePodcast = async () => {
    if (!selectedPodcast || !customSlug) return;

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const newPodcast = await createPodcast({
        podcast_id: selectedPodcast.podcast_id,
        slug: customSlug,
        name: selectedPodcast.podcast_name,
        description: selectedPodcast.podcast_description,
        image_url: selectedPodcast.podcast_image_url,
        publisher_name: selectedPodcast.publisher_name,
      });

      await updatePodcastStatus(newPodcast.id, 'active');

      setSuccess(`Podcast "${newPodcast.name}" created! Syncing episodes...`);

      const syncResult = await syncPodcastEpisodes(newPodcast.id, selectedPodcast.podcast_id);

      setSuccess(
        `Podcast created and ${syncResult.synced} episodes synced!${
          syncResult.errors > 0 ? ` (${syncResult.errors} errors)` : ''
        }`
      );

      setShowAddForm(false);
      setSelectedPodcast(null);
      setCustomSlug('');
      setSearchQuery('');
      setSearchResults([]);

      await loadPodcasts();
    } catch (err) {
      console.error('Error creating podcast:', err);
      setError('Failed to create podcast. The slug might already be in use.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSyncEpisodes = async (podcast: PodcastSpace) => {
    setSyncingPodcast(podcast.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await syncPodcastEpisodes(podcast.id, podcast.podcast_id);
      setSuccess(
        `Synced ${result.synced} new episodes for "${podcast.name}"${
          result.errors > 0 ? ` (${result.errors} errors)` : ''
        }`
      );
      await loadPodcasts();
    } catch (err) {
      console.error('Error syncing episodes:', err);
      setError(`Failed to sync episodes for "${podcast.name}"`);
    } finally {
      setSyncingPodcast(null);
    }
  };

  const handleSyncAllPodcasts = async () => {
    setIsSyncingAll(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await supabase.functions.invoke('sync-episodes');

      if (data?.success) {
        setSuccess(data.message);
        await loadPodcasts();
      } else {
        setError(data?.error || 'Failed to sync episodes');
      }
    } catch (err) {
      console.error('Error triggering sync:', err);
      setError('Failed to trigger episode sync');
    } finally {
      setIsSyncingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllPodcasts}
              disabled={isSyncingAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isSyncingAll ? 'animate-pulse' : ''}`} />
              {isSyncingAll ? 'Syncing...' : 'Sync All'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Podcast
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Podcast</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a podcast by name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((podcast) => (
                  <button
                    key={podcast.podcast_id}
                    onClick={() => handleSelectPodcast(podcast)}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all text-left ${
                      selectedPodcast?.podcast_id === podcast.podcast_id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <img
                      src={podcast.podcast_image_url}
                      alt={podcast.podcast_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {podcast.podcast_name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {podcast.publisher_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedPodcast && (
              <div className="space-y-3 pt-4 border-t border-gray-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug (will be: myapp.com/{customSlug})
                  </label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="podcast-slug"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreatePodcast}
                    disabled={isCreating || !customSlug}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Podcast Space'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedPodcast(null);
                      setCustomSlug('');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Active Podcast Spaces</h3>

          {podcasts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No podcast spaces yet. Add your first podcast above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {podcasts.map((podcast) => (
                <div
                  key={podcast.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {podcast.image_url && (
                      <img
                        src={podcast.image_url}
                        alt={podcast.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{podcast.name}</h4>
                      <p className="text-sm text-gray-600">
                        /{podcast.slug}
                        {podcast.last_synced_at && (
                          <span className="ml-2 text-xs text-gray-500">
                            Last synced: {new Date(podcast.last_synced_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSyncEpisodes(podcast)}
                    disabled={syncingPodcast === podcast.id}
                    className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${syncingPodcast === podcast.id ? 'animate-spin' : ''}`}
                    />
                    {syncingPodcast === podcast.id ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
