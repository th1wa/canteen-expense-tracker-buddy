
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { Activity, User, Clock, Globe, Monitor, Search, Filter, RefreshCw } from "lucide-react";

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
  const [filteredActivities, setFilteredActivities] = useState<UserActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
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
        .limit(200);

      if (error) {
        console.error('Error fetching user activities:', error);
        return;
      }

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
      setFilteredActivities(typedActivities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

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

  useEffect(() => {
    let filtered = activities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.ip_address && activity.ip_address.includes(searchTerm))
      );
    }

    // Filter by activity type
    if (activityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === activityFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(activity => new Date(activity.timestamp) >= filterDate);
      }
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, activityFilter, dateFilter]);

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

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search username, activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                onClick={fetchActivities}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
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
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activities found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{activity.username}</span>
                          <Badge variant={getActivityBadgeVariant(activity.activity_type)}>
                            {activity.activity_type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{format(new Date(activity.timestamp), 'MMM dd, HH:mm:ss')}</span>
                            <span className="text-xs">
                              ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {activity.ip_address && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{activity.ip_address}</span>
                            </div>
                          )}
                          
                          {activity.user_agent && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 flex-shrink-0" />
                              <span>{getBrowserInfo(activity.user_agent)}</span>
                            </div>
                          )}
                          
                          {activity.session_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>Session: {formatSessionDuration(activity.session_duration)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredActivities.length - 1 && <Separator className="mt-4" />}
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
