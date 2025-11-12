import { supabase } from '../lib/supabase';

export interface EpisodeGroupMember {
  id: string;
  episode_id: string;
  group_id: string;
  added_at: string;
}

export interface GroupWithEpisodes {
  group_id: string;
  group_name: string;
  episode_ids: string[];
}

export async function addEpisodeToGroup(episodeId: string, groupId: string): Promise<EpisodeGroupMember> {
  const { data, error } = await supabase
    .from('episode_group_members')
    .insert([{
      episode_id: episodeId,
      group_id: groupId,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Episode is already in this group');
    }
    console.error('Error adding episode to group:', error);
    throw error;
  }

  return data;
}

export async function removeEpisodeFromGroup(episodeId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('episode_group_members')
    .delete()
    .eq('episode_id', episodeId)
    .eq('group_id', groupId);

  if (error) {
    console.error('Error removing episode from group:', error);
    throw error;
  }
}

export async function getEpisodesByGroup(groupId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('episode_group_members')
    .select('episode_id')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error fetching episodes by group:', error);
    throw error;
  }

  return (data || []).map(member => member.episode_id);
}

export async function getGroupsForEpisode(episodeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('episode_group_members')
    .select('group_id')
    .eq('episode_id', episodeId);

  if (error) {
    console.error('Error fetching groups for episode:', error);
    throw error;
  }

  return (data || []).map(member => member.group_id);
}

export async function getGroupedEpisodes(podcastId: string): Promise<Map<string, string[]>> {
  const { data: groups, error: groupsError } = await supabase
    .from('episode_groups')
    .select('id')
    .eq('podcast_id', podcastId);

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    throw groupsError;
  }

  if (!groups || groups.length === 0) {
    return new Map();
  }

  const groupIds = groups.map(g => g.id);

  const { data: members, error: membersError } = await supabase
    .from('episode_group_members')
    .select('group_id, episode_id')
    .in('group_id', groupIds);

  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw membersError;
  }

  const groupedMap = new Map<string, string[]>();

  (members || []).forEach(member => {
    const episodes = groupedMap.get(member.group_id) || [];
    episodes.push(member.episode_id);
    groupedMap.set(member.group_id, episodes);
  });

  return groupedMap;
}

export async function addMultipleEpisodesToGroup(episodeIds: string[], groupId: string): Promise<void> {
  const inserts = episodeIds.map(episodeId => ({
    episode_id: episodeId,
    group_id: groupId,
  }));

  const { error } = await supabase
    .from('episode_group_members')
    .insert(inserts);

  if (error) {
    console.error('Error adding multiple episodes to group:', error);
    throw error;
  }
}
