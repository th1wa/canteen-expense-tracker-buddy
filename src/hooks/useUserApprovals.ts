
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PendingUser {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  role: string;
}

export const useUserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const fetchPendingUsers = async () => {
    if (profile?.role !== 'admin') return;
    
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
               typeof user.role === 'string';
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
      
      // Refresh the list
      await fetchPendingUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingUsers();
      
      // Set up real-time subscription for new users
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            fetchPendingUsers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            fetchPendingUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  return {
    pendingUsers,
    loading,
    updateUserRole,
    refetch: fetchPendingUsers
  };
};
