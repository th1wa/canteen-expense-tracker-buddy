
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, User } from "lucide-react";

interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
}

interface ExportControlsProps {
  isExporting: boolean;
  selectedUserForExport: string;
  setSelectedUserForExport: (value: string) => void;
  filteredData: UserSummary[];
  onExportSummary: () => void;
  onExportUserDetail: (userName: string) => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  isExporting,
  selectedUserForExport,
  setSelectedUserForExport,
  filteredData,
  onExportSummary,
  onExportUserDetail
}) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Full Summary Export */}
          <div className="space-y-2 sm:space-y-3">
            <Button
              onClick={onExportSummary}
              disabled={isExporting}
              className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="sm"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Full Summary Report'}
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Download complete summary of all users
            </p>
          </div>
          
          {/* User Detail Export */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={selectedUserForExport} onValueChange={setSelectedUserForExport}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredData.map((user) => (
                    <SelectItem key={user.user_name} value={user.user_name}>
                      {user.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => onExportUserDetail(selectedUserForExport)}
                disabled={isExporting || !selectedUserForExport}
                variant="outline"
                className="w-full sm:w-auto flex items-center gap-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                size="sm"
              >
                <User className="w-4 h-4" />
                Export User Report
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Download detailed report for specific user
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportControls;
