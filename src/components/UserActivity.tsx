
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
import { Activity, User, Clock, Globe, Monitor, Search, Filter, RefreshCw, Calendar, BarChart3, Smartphone, Tablet, Users, TrendingUp } from "lucide-react";

interface UserActivityRecord {
  id: string;
  username: string;
  activity_type: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  session_duration: string | null;
  browser_name: string | null;
  device_type: string | null;
  screen_resolution: string | null;
  page_url: string | null;
  referrer: string | null;
}

interface ActivityStats {
  totalLogins: number;
  uniqueUsers: number;
  avgSessionDuration: string;
  mostActiveUser: string;
  peakHour: string;
  todayLogins: number;
  browserStats: { [key: string]: number };
  deviceStats: { [key: string]: number };
  hourlyStats: { [key: string]: number };
  userLoginCounts: { [key: string]: number };
}

const UserActivity = () => {
  const [activities, setActivities] = useState<UserActivityRecord[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState<ActivityStats>({
    totalLogins: 0,
    uniqueUsers: 0,
    avgSessionDuration: '0m',
    mostActiveUser: '',
    peakHour: '',
    todayLogins: 0,
    browserStats: {},
    deviceStats: {},
    hourlyStats: {},
    userLoginCounts: {}
  });
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
        .limit(500);

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
        browser_name: activity.browser_name || null,
        device_type: activity.device_type || null,
        screen_resolution: activity.screen_resolution || null,
        page_url: activity.page_url || null,
        referrer: activity.referrer || null,
      }));

      setActivities(typedActivities);
      setFilteredActivities(typedActivities);
      calculateStats(typedActivities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (activities: UserActivityRecord[]) => {
    const loginActivities = activities.filter(a => a.activity_type === 'login');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayLogins = loginActivities.filter(a => new Date(a.timestamp) >= todayStart).length;
    const uniqueUsers = new Set(loginActivities.map(a => a.username)).size;
    
    // Browser stats
    const browserStats: { [key: string]: number } = {};
    loginActivities.forEach(a => {
      const browser = a.browser_name || getBrowserInfo(a.user_agent) || 'Unknown';
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    });

    // Device stats
    const deviceStats: { [key: string]: number } = {};
    loginActivities.forEach(a => {
      const device = a.device_type || 'Unknown';
      deviceStats[device] = (deviceStats[device] || 0) + 1;
    });

    // Hourly stats
    const hourlyStats: { [key: string]: number } = {};
    loginActivities.forEach(a => {
      const hour = format(new Date(a.timestamp), 'HH:00');
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    // User login counts
    const userLoginCounts: { [key: string]: number } = {};
    loginActivities.forEach(a => {
      userLoginCounts[a.username] = (userLoginCounts[a.username] || 0) + 1;
    });

    const mostActiveUser = Object.entries(userLoginCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const peakHour = Object.entries(hourlyStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Average session duration
    const sessionsWithDuration = activities.filter(a => a.session_duration && a.activity_type === 'logout');
    let totalMinutes = 0;
    sessionsWithDuration.forEach(a => {
      if (a.session_duration) {
        const [hours, minutes, seconds] = a.session_duration.split(':').map(Number);
        totalMinutes += (hours * 60) + minutes + (seconds / 60);
      }
    });
    const avgSessionDuration = sessionsWithDuration.length > 0 
      ? `${Math.round(totalMinutes / sessionsWithDuration.length)}m`
      : '0m';

    setStats({
      totalLogins: loginActivities.length,
      uniqueUsers,
      avgSessionDuration,
      mostActiveUser,
      peakHour,
      todayLogins,
      browserStats,
      deviceStats,
      hourlyStats,
      userLoginCounts
    });
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

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-3 h-3" />;
      case 'tablet':
        return <Tablet className="w-3 h-3" />;
      case 'desktop':
      default:
        return <Monitor className="w-3 h-3" />;
    }
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
      <Card className="container-mobile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-responsive-base">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            Access Denied
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            You don't have permission to view user activity.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 container-mobile">
      {/* Enhanced Stats Dashboard - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold truncate">{stats.todayLogins}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">Today's Logins</p>
                <p className="text-xs text-muted-foreground sm:hidden">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold truncate">{stats.totalLogins}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">Total Logins</p>
                <p className="text-xs text-muted-foreground sm:hidden">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold truncate">{stats.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">Unique Users</p>
                <p className="text-xs text-muted-foreground sm:hidden">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold truncate">{stats.avgSessionDuration}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">Avg Session</p>
                <p className="text-xs text-muted-foreground sm:hidden">Session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500 col-span-2 sm:col-span-1">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold truncate">{stats.mostActiveUser || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Most Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 col-span-2 sm:col-span-3 lg:col-span-1">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm sm:text-lg font-bold">{stats.peakHour || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Peak Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser & Device Analytics - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
              Browser Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2">
            {Object.entries(stats.browserStats).slice(0, 5).map(([browser, count]) => (
              <div key={browser} className="flex justify-between items-center">
                <span className="text-xs sm:text-sm truncate flex-1 mr-2">{browser}</span>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(count / stats.totalLogins) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2">
            {Object.entries(stats.deviceStats).slice(0, 5).map(([device, count]) => (
              <div key={device} className="flex justify-between items-center">
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  {getDeviceIcon(device)}
                  <span className="text-xs sm:text-sm truncate">{device}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${(count / stats.totalLogins) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filters Section - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs form-mobile"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Activity Type</label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Actions</label>
              <Button
                onClick={fetchActivities}
                disabled={loading}
                className="w-full h-8 btn-mobile"
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium">Results</label>
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                <span className="hidden sm:inline">{filteredActivities.length} of {activities.length} activities</span>
                <span className="sm:hidden">{filteredActivities.length}/{activities.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            Recent Activity Log
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Real-time user activity monitoring with enhanced tracking data</span>
            <span className="sm:hidden">Real-time activity monitoring</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 sm:py-6">
              <RefreshCw className="w-4 h-4 sm:w-6 sm:h-6 animate-spin mx-auto mb-2 sm:mb-3 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm">No activities found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2 max-h-60 sm:max-h-80 lg:max-h-96 overflow-y-auto">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">{activity.username}</span>
                          <Badge variant={getActivityBadgeVariant(activity.activity_type)} className="text-xs">
                            {activity.activity_type}
                          </Badge>
                          {activity.device_type && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getDeviceIcon(activity.device_type)}
                              <span className="hidden sm:inline">{activity.device_type}</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">{format(new Date(activity.timestamp), 'MMM dd, HH:mm:ss')}</span>
                            <span className="sm:hidden">{format(new Date(activity.timestamp), 'dd/MM HH:mm')}</span>
                            <span className="text-xs opacity-75 hidden lg:inline">
                              ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })})
                            </span>
                          </div>

                          {activity.ip_address && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{activity.ip_address}</span>
                            </div>
                          )}
                          
                          {(activity.browser_name || activity.user_agent) && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{activity.browser_name || getBrowserInfo(activity.user_agent)}</span>
                            </div>
                          )}

                          {activity.screen_resolution && (
                            <div className="flex items-center gap-1 hidden sm:flex">
                              <Monitor className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{activity.screen_resolution}</span>
                            </div>
                          )}
                          
                          {activity.session_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="hidden sm:inline">Session: </span>
                                {formatSessionDuration(activity.session_duration)}
                              </span>
                            </div>
                          )}

                          {activity.page_url && (
                            <div className="flex items-center gap-1 col-span-full">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="hidden sm:inline">Page: </span>
                                {activity.page_url}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredActivities.length - 1 && <Separator className="mt-1 sm:mt-2" />}
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
