
import React, { useState, useRef } from 'react';
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
  Clock
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

const LocalBackupSystem = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupHistory, setBackupHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      {/* Export Section */}
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

      {/* Import Section */}
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

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Recent Backup History
          </CardTitle>
          <CardDescription>
            Last 7 manual backups created during this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No backups created in this session yet
            </p>
          ) : (
            <div className="space-y-2">
              {backupHistory.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{backup}</span>
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automatic Backup Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Automatic Backup Information
          </CardTitle>
          <CardDescription>
            Information about the automatic daily backup system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Daily Backups:</strong> The system is configured to create 
              automatic backups daily. These backups are stored locally and follow the 
              naming convention: canteen_backup_YYYY-MM-DD.json
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Backup Schedule:</strong>
              <p className="text-muted-foreground">Daily at midnight (server time)</p>
            </div>
            <div>
              <strong>Retention Policy:</strong>
              <p className="text-muted-foreground">Last 7 days kept automatically</p>
            </div>
            <div>
              <strong>File Format:</strong>
              <p className="text-muted-foreground">JSON with complete database export</p>
            </div>
            <div>
              <strong>Storage Location:</strong>
              <p className="text-muted-foreground">Local server directory</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalBackupSystem;
