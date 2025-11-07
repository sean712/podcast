import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2, AlertCircle, CheckCircle, Radio, Settings, Zap, Trash2, Pause, Play, Edit2, X, Check, Eye } from 'lucide-react';
import { getAllActivePodcasts, createPodcast, updatePodcastStatus, deletePodcast, togglePodcastPause, updatePodcastSlug } from '../services/podcastSpaceService';
import { syncPodcastEpisodes } from '../services/episodeSyncService';
import { searchPodcasts } from '../services/podscanApi';
import { supabase } from '../lib/supabase';
import type { PodcastSpace } from '../types/multiTenant';
import type { Podcast } from '../types/podcast';

function TabSettingsEditor({ podcastId, onUpdate }: { podcastId: string; onUpdate: (id: string, tabs: string[]) => void }) {
  const [currentSettings, setCurrentSettings] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('podcast_settings')
        .select('visible_tabs')
        .eq('podcast_id', podcastId)
        .maybeSingle();

      setCurrentSettings(data?.visible_tabs || ['player', 'overview', 'people', 'timeline', 'map', 'references', 'transcript', 'notes']);
    };
    fetchSettings();
  }, [podcastId]);

  const handleToggleTab = (tab: string) => {
    const updated = currentSettings.includes(tab)
      ? currentSettings.filter(t => t !== tab)
      : [...currentSettings, tab];
    setCurrentSettings(updated);
    onUpdate(podcastId, updated);
  };

  return (
    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Visible Tabs</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['player', 'overview', 'people', 'timeline', 'map', 'references', 'transcript', 'notes'].map((tab) => {
          const isVisible = currentSettings.includes(tab);
          return (
            <button
              key={tab}
              onClick={() => handleToggleTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isVisible
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingTabs, setEditingTabs] = useState<string | null>(null);
  const [tabSettings, setTabSettings] = useState<Record<string, string[]>>({});

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to sync episodes for "${podcast.name}": ${errorMessage}`);
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

  const handleDeletePodcast = async (podcast: PodcastSpace) => {
    if (confirmDelete !== podcast.id) {
      setConfirmDelete(podcast.id);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deletePodcast(podcast.id);
      setSuccess(`Podcast "${podcast.name}" deleted successfully`);
      setConfirmDelete(null);
      await loadPodcasts();
    } catch (err) {
      console.error('Error deleting podcast:', err);
      setError(`Failed to delete podcast: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTogglePause = async (podcast: PodcastSpace) => {
    setError(null);
    setSuccess(null);

    try {
      await togglePodcastPause(podcast.id, !podcast.is_paused);
      setSuccess(`Podcast "${podcast.name}" ${podcast.is_paused ? 'unpaused' : 'paused'} successfully`);
      await loadPodcasts();
    } catch (err) {
      console.error('Error toggling pause:', err);
      setError(`Failed to ${podcast.is_paused ? 'unpause' : 'pause'} podcast`);
    }
  };

  const handleStartEditSlug = (podcast: PodcastSpace) => {
    setEditingSlug(podcast.id);
    setNewSlug(podcast.slug);
  };

  const handleSaveSlug = async (podcast: PodcastSpace) => {
    if (!newSlug || newSlug === podcast.slug) {
      setEditingSlug(null);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await updatePodcastSlug(podcast.id, newSlug);
      setSuccess(`Slug updated to "${newSlug}" for "${podcast.name}"`);
      setEditingSlug(null);
      await loadPodcasts();
    } catch (err) {
      console.error('Error updating slug:', err);
      setError(`Failed to update slug: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancelEditSlug = () => {
    setEditingSlug(null);
    setNewSlug('');
  };

  const handleUpdateVisibleTabs = async (podcastId: string, visibleTabs: string[]) => {
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('podcast_settings')
        .upsert({
          podcast_id: podcastId,
          visible_tabs: visibleTabs,
        }, {
          onConflict: 'podcast_id'
        });

      if (updateError) throw updateError;

      setSuccess('Tab visibility updated successfully');
      setEditingTabs(null);
    } catch (err) {
      console.error('Error updating tab visibility:', err);
      setError('Failed to update tab visibility');
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
                <div key={podcast.id}>
                  <div
                    className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-all ${
                    podcast.is_paused
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{podcast.name}</h4>
                        {podcast.is_paused && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingSlug === podcast.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">/</span>
                            <input
                              type="text"
                              value={newSlug}
                              onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              className="px-2 py-0.5 text-sm border border-emerald-500 rounded focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveSlug(podcast)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEditSlug}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-600">/{podcast.slug}</p>
                            <button
                              onClick={() => handleStartEditSlug(podcast)}
                              className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Edit slug"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {podcast.last_synced_at && (
                          <span className="text-xs text-gray-500">
                            Last synced: {new Date(podcast.last_synced_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSyncEpisodes(podcast)}
                      disabled={syncingPodcast === podcast.id}
                      className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Sync episodes"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${syncingPodcast === podcast.id ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => setEditingTabs(editingTabs === podcast.id ? null : podcast.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Configure visible tabs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePause(podcast)}
                      className={`p-2 rounded-lg transition-colors ${
                        podcast.is_paused
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                      title={podcast.is_paused ? 'Unpause podcast' : 'Pause podcast'}
                    >
                      {podcast.is_paused ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeletePodcast(podcast)}
                      className={`p-2 rounded-lg transition-colors ${
                        confirmDelete === podcast.id
                          ? 'bg-red-100 text-red-700'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={confirmDelete === podcast.id ? 'Click again to confirm' : 'Delete podcast'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  </div>
                  {editingTabs === podcast.id && (
                    <TabSettingsEditor
                      podcastId={podcast.id}
                      onUpdate={handleUpdateVisibleTabs}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
