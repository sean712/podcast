import { supabase } from '../lib/supabase';

export interface EpisodeGroup {
  id: string;
  podcast_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupData {
  podcast_id: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  display_order?: number;
}

export async function getGroupsByPodcast(podcastId: string): Promise<EpisodeGroup[]> {
  const { data, error } = await supabase
    .from('episode_groups')
    .select('*')
    .eq('podcast_id', podcastId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching episode groups:', error);
    throw error;
  }

  return data || [];
}

export async function createGroup(groupData: CreateGroupData): Promise<EpisodeGroup> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Must be authenticated to create groups');
  }

  const { data, error } = await supabase
    .from('episode_groups')
    .insert([{
      ...groupData,
      created_by: user.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating episode group:', error);
    throw error;
  }

  return data;
}

export async function updateGroup(groupId: string, updates: UpdateGroupData): Promise<EpisodeGroup> {
  const { data, error } = await supabase
    .from('episode_groups')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating episode group:', error);
    throw error;
  }

  return data;
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('episode_groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    console.error('Error deleting episode group:', error);
    throw error;
  }
}

export async function reorderGroups(groupIds: string[]): Promise<void> {
  const updates = groupIds.map((id, index) =>
    supabase
      .from('episode_groups')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  await Promise.all(updates);
}
