
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
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
    <div className="space-y-6 mx-auto max-w-7xl p-4">
      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.todayLogins}</div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Today's Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLogins}</div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.uniqueUsers}</div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.avgSessionDuration}</div>
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Avg Session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20 border-l-4 border-l-pink-500 hover:shadow-lg transition-all duration-300 lg:col-span-1 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-pink-900 dark:text-pink-100 truncate">{stats.mostActiveUser || 'N/A'}</div>
                <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">Most Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-300 lg:col-span-1 col-span-2 sm:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.peakHour || 'N/A'}</div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Peak Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser & Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              Browser Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {Object.entries(stats.browserStats).slice(0, 5).map(([browser, count]) => (
              <div key={browser} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10 rounded-lg hover:shadow-md transition-all duration-300">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 mr-4">{browser}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(count / stats.totalLogins) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/20 border-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {Object.entries(stats.deviceStats).slice(0, 5).map(([device, count]) => (
              <div key={device} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 rounded-lg hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getDeviceIcon(device)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{device}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(count / stats.totalLogins) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Filters */}
      <Card className="overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20 border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Activity Filters
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Filter and search activity data
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Search className="w-4 h-4" />
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  placeholder="Search username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-10 bg-white dark:bg-gray-900 border-2 hover:border-purple-300 focus:border-purple-500 transition-all duration-300 font-medium group-hover:shadow-md"
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Activity className="w-4 h-4" />
                Activity Type
              </label>
              <div className="relative">
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-900 border-2 hover:border-blue-300 focus:border-blue-500 transition-all duration-300 font-medium group-hover:shadow-md">
                    <SelectValue placeholder="All activities" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-2 shadow-xl z-50">
                    <SelectItem value="all" className="py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        All Activities
                      </div>
                    </SelectItem>
                    <SelectItem value="login" className="py-3 hover:bg-green-50 dark:hover:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Login
                      </div>
                    </SelectItem>
                    <SelectItem value="logout" className="py-3 hover:bg-red-50 dark:hover:bg-red-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Logout
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Time Period
              </label>
              <div className="relative">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-900 border-2 hover:border-green-300 focus:border-green-500 transition-all duration-300 font-medium group-hover:shadow-md">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-2 shadow-xl z-50">
                    <SelectItem value="all" className="py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20">All Time</SelectItem>
                    <SelectItem value="today" className="py-3 hover:bg-green-50 dark:hover:bg-green-950/20">Today</SelectItem>
                    <SelectItem value="week" className="py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20">Last 7 Days</SelectItem>
                    <SelectItem value="month" className="py-3 hover:bg-purple-50 dark:hover:bg-purple-950/20">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <RefreshCw className="w-4 h-4" />
                Actions
              </label>
              <Button
                onClick={fetchActivities}
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <BarChart3 className="w-4 h-4" />
                Results
              </label>
              <div className="h-10 flex items-center px-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {filteredActivities.length} of {activities.length} activities
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            Recent Activity Log
          </CardTitle>
          <CardDescription>
            Real-time user activity monitoring with enhanced tracking data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No activities found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start justify-between space-x-4 p-4 rounded-lg hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/10 dark:hover:to-purple-950/10 transition-all duration-300 group">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{activity.username}</span>
                          <Badge variant={getActivityBadgeVariant(activity.activity_type)} className="text-xs font-medium">
                            {activity.activity_type}
                          </Badge>
                          {activity.device_type && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getDeviceIcon(activity.device_type)}
                              <span>{activity.device_type}</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{format(new Date(activity.timestamp), 'MMM dd, HH:mm:ss')}</span>
                            <span className="text-xs opacity-75 hidden lg:inline">
                              ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })})
                            </span>
                          </div>

                          {activity.ip_address && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{activity.ip_address}</span>
                            </div>
                          )}
                          
                          {(activity.browser_name || activity.user_agent) && (
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{activity.browser_name || getBrowserInfo(activity.user_agent)}</span>
                            </div>
                          )}

                          {activity.screen_resolution && (
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{activity.screen_resolution}</span>
                            </div>
                          )}
                          
                          {activity.session_duration && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                Session: {formatSessionDuration(activity.session_duration)}
                              </span>
                            </div>
                          )}

                          {activity.page_url && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <Globe className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                Page: {activity.page_url}
                              </span>
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
