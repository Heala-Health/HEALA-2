
import { supabase } from '@/integrations/supabase/client';

export async function fetchProfilesByIds(userIds: string[]): Promise<Record<string, {first_name: string, last_name: string, phone: string}>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone')
    .in('id', userIds);
  if (error) {
    console.error('Error fetching profiles', error);
    return {};
  }
  const map: Record<string, {first_name: string, last_name: string, phone: string}> = {};
  data?.forEach((profile) => {
    map[profile.id] = {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
    };
  });
  return map;
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'waiting':
      return 'bg-blue-100 text-blue-800';
    case 'called':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
