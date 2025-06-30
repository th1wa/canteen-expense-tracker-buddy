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
  Play
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load automatic backups from storage on component mount
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
        return;
      }

      setStorageBackups(files || []);
    } catch (error) {
      console.error('Error loading storage backups:', error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const testAutomaticBackup = async () => {
    try {
      setIsTesting(true);
      
      // Get the current session to ensure we have proper authorization
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
      
      const { data, error } = await supabase.functions.invoke('auto-backup-scheduler', {
        headers: {
          'x-backup-type': 'manual_test'
        }
      });

      if (error) {
        console.error('Test backup error details:', error);
        throw error;
      }

      console.log('Test backup response:', data);

      toast({
        title: "Test Backup Successful",
        description: "Automatic backup test completed successfully. Check the recent backups list.",
      });

      // Refresh the storage backups list
      setTimeout(() => {
        loadStorageBackups();
      }, 2000);

    } catch (error: any) {
      console.error('Test backup error:', error);
      toast({
        title: "Test Backup Failed",
        description: error.message || "Failed to run test backup. Please check console for details.",
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

      // Create and download the file
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

      if (error) throw error;

      // Create and download the file
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

      // Update backup history
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

      // Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Please select a valid JSON backup file');
      }

      // Read file content
      const fileContent = await file.text();
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch {
        throw new Error('Invalid JSON format in backup file');
      }

      // Validate backup structure
      if (!backupData.data) {
        throw new Error('Invalid backup file structure');
      }

      const { data, error } = await supabase.functions.invoke('database-backup', {
        body: { 
          action: 'import',
          backupData 
        }
      });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Imported ${data.results.expenses} expenses, ${data.results.payments} payments, and ${data.results.profiles} profiles`,
      });

      // Refresh the page to show updated data
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
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Automatic Storage Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Automatic Backups (Supabase Storage)
          </CardTitle>
          <CardDescription>
            Automatic daily backups stored securely in Supabase storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Daily Backups:</strong> The system creates automatic backups daily at 2:00 AM 
              and stores them securely in Supabase storage. The last 7 days of backups are retained automatically.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between items-center gap-4">
            <span className="font-medium">Recent Automatic Backups</span>
            <div className="flex gap-2">
              <Button
                onClick={testAutomaticBackup}
                disabled={isTesting}
                variant="default"
                size="sm"
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
            <p className="text-muted-foreground text-center py-4">
              No automatic backups found in storage yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {storageBackups.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded border">
                  <div className="flex-1">
                    <span className="text-sm font-mono">{backup.name}</span>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(backup.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                    <Button
                      onClick={() => downloadStorageBackup(backup.name)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Manual Export
          </CardTitle>
          <CardDescription>
            Export all database data to a JSON file for backup purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will export ALL data including expenses, payments, and user profiles. 
              Keep backup files secure and in a safe location.
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
                Exporting Data...
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Manual Import
          </CardTitle>
          <CardDescription>
            Import database data from a backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>WARNING:</strong> This will overwrite ALL existing data in the database. 
              Make sure to create a backup before importing.
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
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Database Import</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently overwrite all existing data in the database. 
                  This cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={triggerFileInput}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Import Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Manual Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manual Backup History
          </CardTitle>
          <CardDescription>
            Last 7 manual backups created during this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No manual backups created in this session yet
            </p>
          ) : (
            <div className="space-y-2">
              {backupHistory.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{backup}</span>
                  <Badge variant="secondary">
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
