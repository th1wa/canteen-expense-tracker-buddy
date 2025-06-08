
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Download, Trash2, Upload, Settings, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface BackupFile {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
}

const GoogleDriveBackup = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    userName: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem('google_drive_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
      loadBackups(storedToken);
    }
  }, []);

  const authenticateGoogleDrive = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'getAuthUrl' }
      });

      if (data?.authUrl) {
        window.open(data.authUrl, '_blank', 'width=500,height=600');
        
        // Listen for auth completion
        const handleAuthMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.code) {
            const { data: tokenData } = await supabase.functions.invoke('google-drive-auth', {
              body: { action: 'exchangeCode', code: event.data.code }
            });

            if (tokenData?.access_token) {
              localStorage.setItem('google_drive_token', tokenData.access_token);
              if (tokenData.refresh_token) {
                localStorage.setItem('google_drive_refresh_token', tokenData.refresh_token);
              }
              setAccessToken(tokenData.access_token);
              setIsAuthenticated(true);
              loadBackups(tokenData.access_token);
              
              toast({
                title: "Authentication Successful",
                description: "Connected to Google Drive successfully!"
              });
            }
            window.removeEventListener('message', handleAuthMessage);
          }
        };
        
        window.addEventListener('message', handleAuthMessage);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Failed",
        description: "Failed to connect to Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async (token: string) => {
    try {
      const { data } = await supabase.functions.invoke('google-drive-backup', {
        body: { action: 'listBackups', accessToken: token }
      });

      if (data?.backups) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Load backups error:', error);
    }
  };

  const createBackup = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const { data } = await supabase.functions.invoke('google-drive-backup', {
        body: { 
          action: 'createBackup', 
          accessToken,
          filters: {
            dateFrom: filters.dateFrom || null,
            dateTo: filters.dateTo || null,
            userName: filters.userName || null
          }
        }
      });

      if (data?.success) {
        toast({
          title: "Backup Created Successfully! 📁",
          description: `Backup file: ${data.fileName}`
        });
        loadBackups(accessToken);
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup on Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (fileId: string, fileName: string) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const { data } = await supabase.functions.invoke('google-drive-backup', {
        body: { action: 'deleteBackup', accessToken, fileId }
      });

      if (data?.success) {
        toast({
          title: "Backup Deleted",
          description: `Deleted: ${fileName}`
        });
        loadBackups(accessToken);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (fileId: string, fileName: string) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const { data } = await supabase.functions.invoke('google-drive-backup', {
        body: { action: 'downloadBackup', accessToken, fileId }
      });

      if (data?.success && data?.content) {
        const blob = new Blob([data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Complete",
          description: `Downloaded: ${fileName}`
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectGoogleDrive = () => {
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_refresh_token');
    setAccessToken(null);
    setIsAuthenticated(false);
    setBackups([]);
    toast({
      title: "Disconnected",
      description: "Disconnected from Google Drive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Google Drive Integration
          </CardTitle>
          <CardDescription>
            Connect to Google Drive for automatic backups and data export
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <Button 
              onClick={authenticateGoogleDrive} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Connecting...' : 'Connect to Google Drive'}
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-green-600">
                ✓ Connected to Google Drive
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectGoogleDrive}
              >
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isAuthenticated && (
        <>
          {/* Backup Creation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Create Backup
              </CardTitle>
              <CardDescription>
                Export and backup your canteen data to Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="userName">User Name (optional)</Label>
                  <Input
                    id="userName"
                    placeholder="Filter by user..."
                    value={filters.userName}
                    onChange={(e) => setFilters(prev => ({ ...prev, userName: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={createBackup} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Backup...' : 'Create Backup to Google Drive'}
              </Button>
            </CardContent>
          </Card>

          {/* Backup Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Backup History
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => accessToken && loadBackups(accessToken)}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your existing backups on Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No backups found. Create your first backup above.
                </p>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{backup.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created: {format(new Date(backup.createdTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {backup.size && (
                          <p className="text-xs text-muted-foreground">
                            Size: {(parseInt(backup.size) / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadBackup(backup.id, backup.name)}
                          disabled={loading}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteBackup(backup.id, backup.name)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GoogleDriveBackup;
