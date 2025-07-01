
import { supabase } from '@/integrations/supabase/client';

export async function fetchStaffProfilesByIds(userIds: string[]): Promise<Record<string, {first_name: string, last_name: string, role: string}>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .in('id', userIds);
  if (error) {
    console.error('Error fetching profiles', error);
    return {};
  }
  const map: Record<string, {first_name: string, last_name: string, role: string}> = {};
  data?.forEach((profile) => {
    map[profile.id] = {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      role: profile.role || 'staff',
    };
  });
  return map;
}

export const getShiftColor = (shiftType: string) => {
  switch (shiftType.toLowerCase()) {
    case 'morning':
      return 'bg-yellow-100 text-yellow-800';
    case 'afternoon':
      return 'bg-orange-100 text-orange-800';
    case 'evening':
      return 'bg-blue-100 text-blue-800';
    case 'night':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-gray-100 text-gray-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'checked_in':
      return 'bg-blue-100 text-blue-800';
    case 'checked_out':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'absent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
