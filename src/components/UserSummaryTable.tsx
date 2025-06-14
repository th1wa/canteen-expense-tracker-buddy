
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>User Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No users found matching your search.' : 'No data found for this month.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((user) => (
              <Card key={user.user_name} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
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
      </CardContent>
    </Card>
  );
};

export default UserSummaryTable;
