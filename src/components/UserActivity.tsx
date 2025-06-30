
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { Activity, User, Clock, Globe, Monitor } from "lucide-react";

interface UserActivityRecord {
  id: string;
  username: string;
  activity_type: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  session_duration: string | null;
}

const UserActivity = () => {
  const [activities, setActivities] = useState<UserActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchActivities = async () => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching user activities:', error);
        return;
      }

      // Type cast the data to ensure proper types
      const typedActivities: UserActivityRecord[] = (data || []).map(activity => ({
        id: activity.id,
        username: activity.username,
        activity_type: activity.activity_type,
        timestamp: activity.timestamp,
        ip_address: activity.ip_address ? String(activity.ip_address) : null,
        user_agent: activity.user_agent ? String(activity.user_agent) : null,
        session_duration: activity.session_duration ? String(activity.session_duration) : null,
      }));

      setActivities(typedActivities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Set up real-time listener for new activities
    const channel = supabase
      .channel('user-activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'login':
        return <User className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <User className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActivityBadgeVariant = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const formatSessionDuration = (duration: string | null) => {
    if (!duration) return null;
    
    // Parse PostgreSQL interval format (e.g., "01:23:45" or "2 days 01:23:45")
    const parts = duration.split(' ');
    const timePart = parts[parts.length - 1];
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    let result = '';
    if (parts.length > 1) {
      result += parts.slice(0, -1).join(' ') + ' ';
    }
    
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0) result += `${seconds}s`;
    
    return result.trim() || '0s';
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to view user activity.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            User Activity
          </CardTitle>
          <CardDescription>Loading user activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            User Activity Log
          </CardTitle>
          <CardDescription>
            Monitor user login/logout activity and session information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No user activity recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{activity.username}</span>
                          <Badge variant={getActivityBadgeVariant(activity.activity_type)}>
                            {activity.activity_type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                            <span className="text-xs">
                              ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {activity.ip_address && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>{activity.ip_address}</span>
                            </div>
                          )}
                          
                          {activity.user_agent && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              <span>{getBrowserInfo(activity.user_agent)}</span>
                            </div>
                          )}
                          
                          {activity.session_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Session: {formatSessionDuration(activity.session_duration)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivity;
