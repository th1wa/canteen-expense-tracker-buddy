
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGlobalProfileListener = () => {
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
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
        (payload) => {
          console.log('Real-time profile update received:', payload);
          // Refresh the profile to get the latest data
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up global profile listener');
      supabase.removeChannel(channel);
    };
  }, [profile?.id, refreshProfile]);
};
