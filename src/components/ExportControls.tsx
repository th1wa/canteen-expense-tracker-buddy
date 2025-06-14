
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Button
              onClick={onExportSummary}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Full Summary Report'}
            </Button>
            <p className="text-sm text-muted-foreground mt-1">Download complete summary of all users</p>
          </div>
          
          <div className="flex-1">
            <div className="flex gap-2">
              <Select value={selectedUserForExport} onValueChange={setSelectedUserForExport}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select user for detailed report" />
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
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Export User Report
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Download detailed report for specific user</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportControls;
