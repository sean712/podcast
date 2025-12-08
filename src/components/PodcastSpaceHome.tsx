import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Radio, Clock, Calendar, List as ListIcon, FolderTree, ChevronDown, ChevronRight } from 'lucide-react';
import { getGroupsByPodcast, type EpisodeGroup } from '../services/episodeGroupsService';
import { getGroupedEpisodes } from '../services/episodeGroupMembersService';
import type { PodcastSpace, PodcastSettings, StoredEpisode } from '../types/multiTenant';
import { stripHtml, decodeHtmlEntities } from '../utils/textUtils';
import PodcastFooter from './PodcastFooter';
import ProtectedPodcastPage from './ProtectedPodcastPage';

interface PodcastSpaceHomeProps {
  podcast: PodcastSpace;
  settings: PodcastSettings | null;
  episodes: StoredEpisode[];
  onEpisodeClick: (episode: StoredEpisode, isFeatured?: boolean) => void;
}

type ViewMode = 'chronological' | 'grouped';

export default function PodcastSpaceHome({ podcast, settings, episodes, onEpisodeClick }: PodcastSpaceHomeProps) {
  if (!podcast.is_client) {
    return <ProtectedPodcastPage podcast={podcast} onEpisodeClick={onEpisodeClick} />;
  }
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [groups, setGroups] = useState<EpisodeGroup[]>([]);
  const [episodeGroups, setEpisodeGroups] = useState<Map<string, string[]>>(new Map());
  const [viewMode, setViewMode] = useState<ViewMode>('chronological');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const primaryColor = settings?.primary_color || '#10b981';

  useEffect(() => {
    document.title = `${podcast.name} | Augmented Pods`;
    return () => {
      document.title = 'Augmented Pods';
    };
  }, [podcast.name]);

  useEffect(() => {
    loadGroups();
  }, [podcast.id]);

  useEffect(() => {
    const savedViewMode = localStorage.getItem(`podcast-${podcast.id}-viewMode`) as ViewMode;
    if (savedViewMode && (savedViewMode === 'chronological' || savedViewMode === 'grouped')) {
      setViewMode(savedViewMode);
    }
  }, [podcast.id]);

  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const groupsData = await getGroupsByPodcast(podcast.id);
      setGroups(groupsData);

      if (groupsData.length > 0) {
        const groupedData = await getGroupedEpisodes(podcast.id);
        setEpisodeGroups(groupedData);
      }
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(`podcast-${podcast.id}-viewMode`, mode);
  };

  const toggleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const getGroupedEpisodesForDisplay = () => {
    const grouped: { group: EpisodeGroup; episodes: StoredEpisode[] }[] = [];
    const ungroupedEpisodes: StoredEpisode[] = [];
    const allGroupedEpisodeIds = new Set<string>();

    groups.forEach(group => {
      const episodeIds = episodeGroups.get(group.id) || [];
      episodeIds.forEach(id => allGroupedEpisodeIds.add(id));
      const groupEpisodes = episodes.filter(ep => episodeIds.includes(ep.episode_id));
      if (groupEpisodes.length > 0) {
        grouped.push({ group, episodes: groupEpisodes });
      }
    });

    episodes.forEach(ep => {
      if (!allGroupedEpisodeIds.has(ep.episode_id)) {
        ungroupedEpisodes.push(ep);
      }
    });

    return { grouped, ungroupedEpisodes };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {podcast.image_url ? (
              <img
                src={podcast.image_url}
                alt={podcast.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover shadow-lg flex-shrink-0"
              />
            ) : (
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Radio className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-gray-900">
                {settings?.custom_header_text || podcast.name}
              </h1>
              {podcast.publisher_name && (
                <p className="text-gray-600 text-base sm:text-lg mb-3">{podcast.publisher_name}</p>
              )}
              {podcast.description && (
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed line-clamp-3">{stripHtml(podcast.description)}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Episodes</h2>
            <p className="text-gray-600 mt-1">
              {episodes.length} episodes with interactive transcripts and insights
            </p>
          </div>
          {groups.length > 0 && (
            <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('chronological')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'chronological'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                Chronological
              </button>
              <button
                onClick={() => handleViewModeChange('grouped')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                By Theme
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No episodes available yet. Check back soon!</p>
          </div>
        ) : viewMode === 'chronological' ? (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => onEpisodeClick(episode)}
                className="w-full bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left group p-4 flex items-start gap-4"
              >
                {episode.image_url && (
                  <img
                    src={episode.image_url}
                    alt={episode.title}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {decodeHtmlEntities(episode.title)}
                  </h3>
                  {episode.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {stripHtml(episode.description)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {episode.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(episode.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    {episode.duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{Math.floor(episode.duration / 60)} min</span>
                      </div>
                    )}
                    {episode.word_count > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Transcript</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const { grouped, ungroupedEpisodes } = getGroupedEpisodesForDisplay();
              return (
                <>
                  {grouped.map(({ group, episodes: groupEpisodes }) => (
                    <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {collapsedGroups.has(group.id) ? (
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{group.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                          {groupEpisodes.length} {groupEpisodes.length === 1 ? 'episode' : 'episodes'}
                        </span>
                      </button>
                      {!collapsedGroups.has(group.id) && (
                        <div className="p-4 space-y-2">
                          {groupEpisodes.map((episode) => (
                            <button
                              key={episode.id}
                              onClick={() => onEpisodeClick(episode)}
                              className="w-full bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group p-3 flex items-start gap-3"
                            >
                              {episode.image_url && (
                                <img
                                  src={episode.image_url}
                                  alt={episode.title}
                                  className="w-12 h-12 rounded object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                  {decodeHtmlEntities(episode.title)}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {episode.published_at && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(episode.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {episode.duration > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{Math.floor(episode.duration / 60)} min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {ungroupedEpisodes.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => toggleGroupCollapse('uncategorized')}
                        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {collapsedGroups.has('uncategorized') ? (
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">Uncategorized</h3>
                            <p className="text-sm text-gray-600 mt-0.5">Episodes not in any group</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                          {ungroupedEpisodes.length} {ungroupedEpisodes.length === 1 ? 'episode' : 'episodes'}
                        </span>
                      </button>
                      {!collapsedGroups.has('uncategorized') && (
                        <div className="p-4 space-y-2">
                          {ungroupedEpisodes.map((episode) => (
                            <button
                              key={episode.id}
                              onClick={() => onEpisodeClick(episode)}
                              className="w-full bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group p-3 flex items-start gap-3"
                            >
                              {episode.image_url && (
                                <img
                                  src={episode.image_url}
                                  alt={episode.title}
                                  className="w-12 h-12 rounded object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                  {decodeHtmlEntities(episode.title)}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {episode.published_at && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(episode.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {episode.duration > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{Math.floor(episode.duration / 60)} min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </main>

      <PodcastFooter />
    </div>
  );
}
