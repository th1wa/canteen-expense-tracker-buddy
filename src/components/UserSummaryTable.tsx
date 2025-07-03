
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import UserDetailRow from './UserDetailRow';
import { UserSummaryTableProps } from '@/types/summary';

const UserSummaryTable: React.FC<UserSummaryTableProps> = ({
  filteredData,
  searchTerm,
  expandedUser,
  isExporting,
  onToggleExpand,
  onExportUserDetail
}) => {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 w-full">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-responsive-base">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>User Summary</span>
          </div>
          {filteredData.length > 0 && (
            <span className="text-xs sm:text-sm font-normal bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full self-start sm:ml-auto">
              {filteredData.length} user{filteredData.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-16 px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">📊</div>
            <h3 className="text-responsive-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              {searchTerm ? 'No users found' : 'No data available'}
            </h3>
            <p className="text-responsive-sm text-muted-foreground max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'No data found for the selected month. Try selecting a different month or check if there are any expenses recorded.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredData.map((user, index) => (
              <Card 
                key={user.user_name} 
                className="border-l-4 border-l-orange-500 hover:shadow-md transition-all duration-200 opacity-0 animate-slideInUp w-full overflow-hidden"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <UserDetailRow
                    user={user}
                    isExpanded={expandedUser === user.user_name}
                    isExporting={isExporting}
                    onToggleExpand={() => onToggleExpand(user.user_name)}
                    onExportUserDetail={onExportUserDetail}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slideInUp {
            animation: slideInUp 0.5s ease-out forwards;
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default UserSummaryTable;
