
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IoDownload, IoDocument, IoPerson } from "react-icons/io5";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader className="spacing-responsive-sm">
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-base sm:text-lg'}`}>
          <IoDocument className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 spacing-responsive-sm">
        <div className="space-y-4">
          {/* Full Summary Export */}
          <div className="space-y-2">
            <Button
              onClick={onExportSummary}
              disabled={isExporting}
              className={`btn-mobile w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
              size="sm"
            >
              <IoDownload className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{isExporting ? 'Exporting...' : 'Export Full Summary Report'}</span>
            </Button>
            <p className="text-xs text-muted-foreground">
              Download complete summary of all users
            </p>
          </div>
          
          {/* User Detail Export */}
          <div className="space-y-2">
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <Select value={selectedUserForExport} onValueChange={setSelectedUserForExport}>
                <SelectTrigger className={`form-mobile ${isMobile ? 'w-full' : 'w-full sm:w-48'}`}>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
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
                className={`btn-mobile flex items-center gap-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 ${isMobile ? 'w-full text-sm' : 'w-full sm:w-auto text-sm sm:text-base'}`}
                size="sm"
              >
                <IoPerson className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Export User Report</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Download detailed report for specific user
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportControls;
