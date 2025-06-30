
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useActivityTracker = () => {
  const { user, profile } = useAuth();
  const sessionStartRef = useRef<Date | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  const getDetailedClientInfo = () => {
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

    const getBrowserInfo = () => {
      const userAgent = navigator.userAgent;
      let browserName = 'Unknown';
      
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browserName = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browserName = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browserName = 'Safari';
      } else if (userAgent.includes('Edg')) {
        browserName = 'Edge';
      } else if (userAgent.includes('Opera')) {
        browserName = 'Opera';
      }
      
      return browserName;
    };

    const getDeviceType = () => {
      const userAgent = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'Tablet';
      } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        return 'Mobile';
      }
      return 'Desktop';
    };

    const getScreenResolution = () => {
      return `${screen.width}x${screen.height}`;
    };

    return {
      userAgent: navigator.userAgent,
      ipAddress: getIpAddress(),
      browserName: getBrowserInfo(),
      deviceType: getDeviceType(),
      screenResolution: getScreenResolution(),
      referrer: document.referrer || null,
      pageUrl: window.location.href
    };
  };

  const logActivity = async (activityType: 'login' | 'logout', sessionDuration?: string) => {
    if (!user || !profile) return;

    try {
      const clientInfo = getDetailedClientInfo();
      const ipAddress = await clientInfo.ipAddress;

      // Enhanced activity data
      const activityData = {
        user_id: user.id,
        username: profile.username,
        activity_type: activityType,
        ip_address: ipAddress,
        user_agent: clientInfo.userAgent,
        browser_name: clientInfo.browserName,
        device_type: clientInfo.deviceType,
        screen_resolution: clientInfo.screenResolution,
        referrer: clientInfo.referrer,
        page_url: clientInfo.pageUrl,
        session_duration: sessionDuration || null
      };

      // Log to user_activity table
      const { error: userActivityError } = await supabase
        .from('user_activity')
        .insert(activityData);

      if (userActivityError) {
        console.error('Error logging to user_activity:', userActivityError);
      }

      // Log to activity_logs table as well
      const { error: activityLogsError } = await supabase
        .from('activity_logs')
        .insert(activityData);

      if (activityLogsError) {
        console.error('Error logging to activity_logs:', activityLogsError);
      }

      console.log('Enhanced activity logged:', {
        type: activityType,
        user: profile.username,
        browser: clientInfo.browserName,
        device: clientInfo.deviceType,
        resolution: clientInfo.screenResolution
      });

    } catch (error) {
      console.error('Error logging enhanced user activity:', error);
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
      
      console.log('Enhanced user session started:', {
        user: profile.username,
        time: sessionStartRef.current
      });
    }

    if (!user && sessionStartRef.current) {
      // User logged out
      const sessionEnd = new Date();
      const sessionDuration = calculateSessionDuration(sessionStartRef.current, sessionEnd);
      logActivity('logout', sessionDuration);
      
      console.log('Enhanced user session ended:', {
        duration: sessionDuration,
        time: sessionEnd
      });
      
      sessionStartRef.current = null;
    }
  }, [user, profile]);

  // Track enhanced user activity
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      lastActivityRef.current = new Date();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user]);

  // Handle page unload with enhanced data
  useEffect(() => {
    if (!user || !profile) return;

    const handleBeforeUnload = () => {
      if (sessionStartRef.current) {
        const sessionEnd = new Date();
        const sessionDuration = calculateSessionDuration(sessionStartRef.current, sessionEnd);
        
        // Use sendBeacon for reliable logging on page unload
        const clientInfo = getDetailedClientInfo();
        navigator.sendBeacon('/api/log-activity', JSON.stringify({
          user_id: user.id,
          username: profile.username,
          activity_type: 'logout',
          session_duration: sessionDuration,
          timestamp: sessionEnd.toISOString(),
          browser_name: clientInfo.browserName,
          device_type: clientInfo.deviceType,
          screen_resolution: clientInfo.screenResolution,
          page_url: clientInfo.pageUrl
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
