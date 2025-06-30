
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useActivityTracker = () => {
  const { user, profile } = useAuth();
  const sessionStartRef = useRef<Date | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  const getClientInfo = () => {
    const getIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        console.error('Error fetching IP:', error);
        return null;
      }
    };

    return {
      userAgent: navigator.userAgent,
      ipAddress: getIpAddress()
    };
  };

  const logActivity = async (activityType: 'login' | 'logout', sessionDuration?: string) => {
    if (!user || !profile) return;

    try {
      const clientInfo = getClientInfo();
      const ipAddress = await clientInfo.ipAddress;

      // Log to both tables for comprehensive tracking
      // Log to user_activity (existing table)
      const { error: userActivityError } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          username: profile.username,
          activity_type: activityType,
          ip_address: ipAddress,
          user_agent: clientInfo.userAgent,
          session_duration: sessionDuration || null
        });

      if (userActivityError) {
        console.error('Error logging to user_activity:', userActivityError);
      }

      // Log to activity_logs (new table)
      const { error: activityLogsError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          username: profile.username,
          activity_type: activityType,
          ip_address: ipAddress,
          user_agent: clientInfo.userAgent,
          session_duration: sessionDuration || null
        });

      if (activityLogsError) {
        console.error('Error logging to activity_logs:', activityLogsError);
      }

    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };

  const calculateSessionDuration = (startTime: Date, endTime: Date): string => {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (user && profile && !sessionStartRef.current) {
      // User just logged in
      sessionStartRef.current = new Date();
      logActivity('login');
      
      console.log('User session started:', {
        user: profile.username,
        time: sessionStartRef.current
      });
    }

    if (!user && sessionStartRef.current) {
      // User logged out
      const sessionEnd = new Date();
      const sessionDuration = calculateSessionDuration(sessionStartRef.current, sessionEnd);
      logActivity('logout', sessionDuration);
      
      console.log('User session ended:', {
        duration: sessionDuration,
        time: sessionEnd
      });
      
      sessionStartRef.current = null;
    }
  }, [user, profile]);

  // Track user activity (mouse movement, clicks, etc.)
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user]);

  // Handle page unload (logout tracking)
  useEffect(() => {
    if (!user || !profile) return;

    const handleBeforeUnload = () => {
      if (sessionStartRef.current) {
        const sessionEnd = new Date();
        const sessionDuration = calculateSessionDuration(sessionStartRef.current, sessionEnd);
        
        // Use sendBeacon for reliable logging on page unload
        navigator.sendBeacon('/api/log-activity', JSON.stringify({
          user_id: user.id,
          username: profile.username,
          activity_type: 'logout',
          session_duration: sessionDuration,
          timestamp: sessionEnd.toISOString()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, profile]);

  return {
    logActivity,
    sessionStart: sessionStartRef.current,
    lastActivity: lastActivityRef.current
  };
};
