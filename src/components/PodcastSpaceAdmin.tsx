import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, FolderTree, List, Loader2, AlertCircle, Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isOwner } from '../services/adminAuthService';
import { getGroupsByPodcast, createGroup, updateGroup, deleteGroup, type EpisodeGroup } from '../services/episodeGroupsService';
import { getEpisodesByGroup, addEpisodeToGroup, removeEpisodeFromGroup, getGroupsForEpisode } from '../services/episodeGroupMembersService';
import { deleteAnalysis, getCachedAnalysis } from '../services/episodeAnalysisCache';
import { refreshPodcastEpisodes } from '../services/episodeSyncService';
import type { PodcastSpace, StoredEpisode } from '../types/multiTenant';

interface PodcastSpaceAdminProps {
  podcast: PodcastSpace;
  episodes: StoredEpisode[];
  onBack: () => void;
  onEpisodesRefreshed?: () => void;
}

type AdminTab = 'groups' | 'episodes';

export default function PodcastSpaceAdmin({ podcast, episodes, onBack, onEpisodesRefreshed }: PodcastSpaceAdminProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('groups');
  const [groups, setGroups] = useState<EpisodeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [episodeGroups, setEpisodeGroups] = useState<Map<string, string[]>>(new Map());
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string | null>(null);
  const [episodesWithAnalysis, setEpisodesWithAnalysis] = useState<Set<string>>(new Set());
  const [isDeletingAnalysis, setIsDeletingAnalysis] = useState<string | null>(null);
  const [isRefreshingEpisodes, setIsRefreshingEpisodes] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isOwner(user)) {
      return;
    }
    loadGroups();
    loadEpisodesWithAnalysis();
  }, [user]);

  const loadEpisodesWithAnalysis = async () => {
    const episodesWithCache = new Set<string>();
    for (const episode of episodes) {
      if (episode.transcript) {
        const cached = await getCachedAnalysis(episode.episode_id);
        if (cached) {
          episodesWithCache.add(episode.episode_id);
        }
      }
    }
    setEpisodesWithAnalysis(episodesWithCache);
  };

  const loadGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groupsData = await getGroupsByPodcast(podcast.id);
      setGroups(groupsData);

      const groupMap = new Map<string, string[]>();
      for (const group of groupsData) {
        const episodeIds = await getEpisodesByGroup(group.id);
        groupMap.set(group.id, episodeIds);
      }
      setEpisodeGroups(groupMap);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await createGroup({
        podcast_id: podcast.id,
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        display_order: groups.length,
      });
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateModal(false);
      await loadGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (group: EpisodeGroup) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditDescription(group.description || '');
  };

  const handleSaveEdit = async (groupId: string) => {
    try {
      await updateGroup(groupId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingGroupId(null);
      await loadGroups();
    } catch (err) {
      console.error('Error updating group:', err);
      alert('Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? All episode associations will be removed.`)) {
      return;
    }

    try {
      await deleteGroup(groupId);
      await loadGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
  };

  const handleDeleteAnalysis = async (episodeId: string, episodeTitle: string) => {
    if (!confirm(`Delete analysis for "${episodeTitle}"?\n\nThe episode will be re-analyzed the next time it's viewed.`)) {
      return;
    }

    setIsDeletingAnalysis(episodeId);
    try {
      await deleteAnalysis(episodeId);
      setEpisodesWithAnalysis(prev => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
      alert('Analysis deleted successfully. Navigate to the episode to trigger a fresh analysis.');
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert('Failed to delete analysis');
    } finally {
      setIsDeletingAnalysis(null);
    }
  };

  const handleAddToGroup = async (episodeId: string, groupId: string) => {
    try {
      await addEpisodeToGroup(episodeId, groupId);
      await loadGroups();
    } catch (err: any) {
      console.error('Error adding episode to group:', err);
      alert(err.message || 'Failed to add episode to group');
    }
  };

  const handleRefreshEpisodes = async () => {
    if (!confirm('Refresh all episodes from Podscan?\n\nThis will update all episode data including transcripts that may have become available. This may take a few minutes.')) {
      return;
    }

    setIsRefreshingEpisodes(true);
    setRefreshProgress('Starting refresh...');

    try {
      setRefreshProgress('Fetching latest episode data from Podscan...');
      const result = await refreshPodcastEpisodes(podcast.id, podcast.podscan_podcast_id);

      setRefreshProgress(`Complete! Updated ${result.updated} episodes${result.errors > 0 ? `, ${result.errors} errors` : ''}`);

      setTimeout(() => {
        setRefreshProgress(null);
        if (onEpisodesRefreshed) {
          onEpisodesRefreshed();
        }
      }, 3000);

      alert(`Episode refresh complete!\n\nUpdated: ${result.updated}\nErrors: ${result.errors}\nTotal: ${result.total}`);
    } catch (err) {
      console.error('Error refreshing episodes:', err);
      setRefreshProgress(null);
      alert('Failed to refresh episodes. Please try again.');
    } finally {
      setIsRefreshingEpisodes(false);
    }
  };

  const handleRemoveFromGroup = async (episodeId: string, groupId: string) => {
    try {
      await removeEpisodeFromGroup(episodeId, groupId);
      await loadGroups();
    } catch (err) {
      console.error('Error removing episode from group:', err);
      alert('Failed to remove episode from group');
    }
  };

  if (!user || !isOwner(user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this admin panel.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Back to Podcast
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Podcast</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">{podcast.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Owner</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'groups'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                Episode Groups
              </button>
              <button
                onClick={() => setActiveTab('episodes')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-all ${
                  activeTab === 'episodes'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                Episode Management
              </button>
            </nav>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            ) : activeTab === 'groups' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Episode Groups</h2>
                    <p className="text-sm text-gray-600 mt-1">Organize episodes into thematic groups</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No groups created yet. Create your first group to organize episodes by theme.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        {editingGroupId === group.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Group name"
                            />
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Description (optional)"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(group.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <Save className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingGroupId(null)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                                {group.description && (
                                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {episodeGroups.get(group.id)?.length || 0} episodes
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStartEdit(group)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit group"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete group"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Episode Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage episode analysis and group assignments</p>
                  </div>
                  <button
                    onClick={handleRefreshEpisodes}
                    disabled={isRefreshingEpisodes}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingEpisodes ? 'animate-spin' : ''}`} />
                    {isRefreshingEpisodes ? 'Refreshing...' : 'Refresh Episodes'}
                  </button>
                </div>

                {refreshProgress && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-900">{refreshProgress}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {episodes.map((episode) => {
                    const episodeGroupIds = Array.from(episodeGroups.entries())
                      .filter(([_, episodeIds]) => episodeIds.includes(episode.episode_id))
                      .map(([groupId]) => groupId);

                    return (
                      <div key={episode.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{episode.title}</h3>
                              {!episode.transcript ? (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">No transcript</span>
                              ) : episodesWithAnalysis.has(episode.episode_id) ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">Analyzed</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">Not analyzed</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {episode.published_at && new Date(episode.published_at).toLocaleDateString()}
                            </p>
                            {episodeGroupIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {episodeGroupIds.map(groupId => {
                                  const group = groups.find(g => g.id === groupId);
                                  return group ? (
                                    <span key={groupId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                                      {group.name}
                                      <button
                                        onClick={() => handleRemoveFromGroup(episode.episode_id, groupId)}
                                        className="hover:text-blue-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {groups.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddToGroup(episode.episode_id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                              >
                                <option value="">Add to group...</option>
                                {groups
                                  .filter(g => !episodeGroupIds.includes(g.id))
                                  .map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                  ))}
                              </select>
                            )}
                            {episode.transcript && episodesWithAnalysis.has(episode.episode_id) && (
                              <button
                                onClick={() => handleDeleteAnalysis(episode.episode_id, episode.title)}
                                disabled={isDeletingAnalysis === episode.episode_id}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete cached analysis"
                              >
                                {isDeletingAnalysis === episode.episode_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Analysis
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Season 1, Interviews, etc."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this group"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateGroup}
                disabled={isCreating || !newGroupName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
