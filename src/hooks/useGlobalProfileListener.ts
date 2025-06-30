
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGlobalProfileListener = () => {
  const { profile, refreshProfile } = useAuth();
  const channelRef = useRef<any>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    // Clean up existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing global profile listener');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!profile?.id) return;

    console.log('Setting up global profile listener for user:', profile.id);

    // Listen for any changes to the current user's profile
    const channel = supabase
      .channel(`global-profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Real-time profile update received:', payload);
          
          // Prevent multiple simultaneous refreshes
          if (isRefreshingRef.current) return;
          
          isRefreshingRef.current = true;
          
          // Small delay to ensure the database transaction is complete
          setTimeout(async () => {
            try {
              await refreshProfile();
            } catch (error) {
              console.error('Error refreshing profile:', error);
            } finally {
              isRefreshingRef.current = false;
            }
          }, 100);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up global profile listener');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, refreshProfile]);
};
