
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Upload, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cloud,
  RefreshCw,
  Play,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BackupSystem = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [backupHistory, setBackupHistory] = useState<string[]>([]);
  const [storageBackups, setStorageBackups] = useState<any[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [deletingBackups, setDeletingBackups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStorageBackups();
  }, []);

  const loadStorageBackups = async () => {
    try {
      setIsLoadingStorage(true);

      const { data: files, error } = await supabase.storage
        .from('automatic-backups')
        .list('', {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error loading storage backups:', error);
        toast({
          title: "Load Error",
          description: "Could not load backup files",
          variant: "destructive",
        });
        return;
      }

      setStorageBackups(files || []);
    } catch (error) {
      console.error('Error loading storage backups:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while loading backups",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const deleteStorageBackup = async (fileName: string) => {
    try {
      setDeletingBackups(prev => new Set(prev).add(fileName));
      
      const { error } = await supabase.storage
        .from('automatic-backups')
        .remove([fileName]);

      if (error) {
        toast({
          title: "Delete Failed",
          description: `Failed to delete ${fileName}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Backup Deleted",
        description: `Successfully deleted ${fileName}`,
      });

      // Refresh the list
      loadStorageBackups();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete backup file",
        variant: "destructive",
      });
    } finally {
      setDeletingBackups(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  const testAutomaticBackup = async () => {
    try {
      setIsTesting(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to test the backup system",
          variant: "destructive",
        });
        return;
      }

      console.log('Testing automatic backup with authenticated user...');
      
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const { data, error } = await supabase.functions.invoke('auto-backup-scheduler', {
          headers: {
            'x-backup-type': 'manual_test'
          },
          body: { test: true }
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('Test backup error details:', error);
          
          // Check for specific error types
          if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
            toast({
              title: "Network Error",
              description: "Could not connect to the backup service. Please check your internet connection and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Backup Test Failed",
              description: error.message || "An error occurred during backup test",
              variant: "destructive",
            });
          }
          return;
        }

        console.log('Test backup response:', data);

        toast({
          title: "Test Backup Successful",
          description: "Automatic backup test completed successfully. Check the recent backups list.",
        });

        // Refresh backup list after successful test
        setTimeout(() => {
          loadStorageBackups();
        }, 2000);

      } catch (networkError: any) {
        clearTimeout(timeoutId);
        console.error('Network error during backup test:', networkError);
        
        if (networkError.name === 'AbortError') {
          toast({
            title: "Request Timeout",
            description: "The backup test took too long to complete. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Error",
            description: "Could not connect to backup service. Please check your connection and try again.",
            variant: "destructive",
          });
        }
      }

    } catch (error: any) {
      console.error('Test backup error:', error);
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred during backup test",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const downloadStorageBackup = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('automatic-backups')
        .download(fileName);

      if (error) {
        toast({
          title: "Download Failed",
          description: `Failed to download ${fileName}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Successful",
        description: `Downloaded ${fileName}`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download backup file",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const { data, error } = await supabase.functions.invoke('database-backup', {
        body: { action: 'export' }
      });

      if (error) {
        toast({
          title: "Export Failed",
          description: error.message || "Failed to export database",
          variant: "destructive",
        });
        return;
      }

      const fileName = `canteen_backup_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupHistory(prev => [fileName, ...prev.slice(0, 6)]);

      toast({
        title: "Export Successful",
        description: `Database exported as ${fileName}`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export database",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (file: File) => {
    try {
      setIsImporting(true);

      if (!file.name.endsWith('.json')) {
        throw new Error('Please select a valid JSON backup file');
      }

      const fileContent = await file.text();
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch {
        throw new Error('Invalid JSON format in backup file');
      }

      if (!backupData.data) {
        throw new Error('Invalid backup file structure');
      }

      const { data, error } = await supabase.functions.invoke('database-backup', {
        body: { 
          action: 'import',
          backupData 
        }
      });

      if (error) {
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import database",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Import Successful",
        description: `Imported ${data.results.expenses} expenses, ${data.results.payments} payments, and ${data.results.profiles} profiles`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import database",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportData(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Automatic Storage Backups */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Cloud className="w-5 h-5" />
            Automatic Backups
          </CardTitle>
          <CardDescription>
            Automatic daily backups stored securely in cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Daily Backups:</strong> Automatic backups run daily at 2:00 AM UTC. Last 7 days are retained automatically.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <span className="font-medium">Recent Backups</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={testAutomaticBackup}
                disabled={isTesting}
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {isTesting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Backup
                  </>
                )}
              </Button>
              <Button
                onClick={loadStorageBackups}
                disabled={isLoadingStorage}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {isLoadingStorage ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          {storageBackups.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-muted-foreground">
                No automatic backups found yet. Click "Test Backup" to create one now.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg">
              {storageBackups.map((backup, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 border-b last:border-b-0 gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono block truncate pr-2">{backup.name}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(backup.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                    <Button
                      onClick={() => downloadStorageBackup(backup.name)}
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1 sm:flex-none"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingBackups.has(backup.name)}
                          className="text-xs"
                        >
                          {deletingBackups.has(backup.name) ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{backup.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteStorageBackup(backup.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Export Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Manual Export
          </CardTitle>
          <CardDescription>
            Export database to JSON file for manual backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This exports ALL data including sensitive information. Keep backup files secure and encrypted.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Exporting Database...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Database Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Import Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Manual Import
          </CardTitle>
          <CardDescription>
            Import database from backup file (USE WITH CAUTION)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>DANGER:</strong> This will permanently overwrite ALL existing data. Make sure to export a backup first.
            </AlertDescription>
          </Alert>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Importing Data...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Database
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Import</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently overwrite all existing data. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={triggerFileInput}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Import Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Manual Backup History */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Session History
          </CardTitle>
          <CardDescription>
            Manual backups created during this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-muted-foreground">
                No manual backups created yet in this session
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backupHistory.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                  <span className="font-mono text-sm truncate flex-1 mr-2">{backup}</span>
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Manual
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSystem;
