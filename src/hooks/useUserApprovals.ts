
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PendingUser {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  role: 'admin' | 'hr' | 'canteen' | 'user';
}

export const useUserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile, refreshProfile } = useAuth();

  const fetchPendingUsers = async () => {
    // Only fetch if user is admin
    if (profile?.role !== 'admin') {
      setPendingUsers([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending users:', error);
        throw error;
      }
      
      // Safely handle the data and ensure it matches our interface
      const validUsers = (data || []).filter((user): user is PendingUser => {
        return user && 
               typeof user.id === 'string' && 
               typeof user.username === 'string' && 
               typeof user.created_at === 'string' && 
               typeof user.updated_at === 'string' && 
               typeof user.role === 'string' &&
               ['admin', 'hr', 'canteen', 'user'].includes(user.role);
      });
      
      setPendingUsers(validUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'hr' | 'canteen' | 'user') => {
    if (!userId || !newRole) {
      return { success: false, error: 'Invalid parameters' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
      
      console.log('Role updated successfully for user:', userId, 'to role:', newRole);
      
      // If the updated user is the current user, refresh their profile immediately
      if (userId === profile?.id) {
        console.log('Current user role updated, refreshing profile');
        await refreshProfile();
      }
      
      // Refresh the list
      await fetchPendingUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    // Always set up the effect, but only fetch if admin
    fetchPendingUsers();
    
    // Set up real-time subscription only for admin users
    if (profile?.role === 'admin') {
      const channel = supabase
        .channel('admin-profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('Profile change detected:', payload);
            // Refresh the users list when any profile changes
            fetchPendingUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.role]);

  return {
    pendingUsers,
    loading,
    updateUserRole,
    refetch: fetchPendingUsers
  };
};
