
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import UserDetailRow from './UserDetailRow';

interface ExpenseSummary {
  user_name: string;
  expense_date: string;
  expense_amount: number;
  payment_made: boolean;
  payment_date: string | null;
  remainder_amount: number;
}

interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
  daily_records: ExpenseSummary[];
}

interface UserSummaryTableProps {
  filteredData: UserSummary[];
  searchTerm: string;
  expandedUser: string | null;
  isExporting: boolean;
  onToggleExpand: (userName: string) => void;
  onExportUserDetail: (userName: string) => void;
}

const UserSummaryTable: React.FC<UserSummaryTableProps> = ({
  filteredData,
  searchTerm,
  expandedUser,
  isExporting,
  onToggleExpand,
  onExportUserDetail
}) => {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          User Summary
          {filteredData.length > 0 && (
            <span className="ml-auto text-xs sm:text-sm font-normal bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
              {filteredData.length} user{filteredData.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredData.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12 px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📊</div>
            <h3 className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              {searchTerm ? 'No users found' : 'No data available'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No data found for the selected month.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredData.map((user, index) => (
              <Card 
                key={user.user_name} 
                className="border-l-4 border-l-orange-500 hover:shadow-md transition-all duration-200 opacity-0 animate-slideInUp"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <CardContent className="p-3 sm:p-4">
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
