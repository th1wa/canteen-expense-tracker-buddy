
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { format } from "date-fns";

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

interface UserDetailRowProps {
  user: UserSummary;
  isExpanded: boolean;
  isExporting: boolean;
  onToggleExpand: () => void;
  onExportUserDetail: (userName: string) => void;
}

const UserDetailRow: React.FC<UserDetailRowProps> = ({
  user,
  isExpanded,
  isExporting,
  onToggleExpand,
  onExportUserDetail
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{user.user_name}</h3>
          <Badge variant={user.total_remainder > 0 ? "destructive" : "default"}>
            Balance: Rs. {user.total_remainder.toFixed(2)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportUserDetail(user.user_name)}
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-lg font-semibold">Rs. {user.total_expenses.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Paid</p>
          <p className="text-lg font-semibold text-green-600">Rs. {user.total_paid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className={`text-lg font-semibold ${user.total_remainder > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs. {user.total_remainder.toFixed(2)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Daily Breakdown</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Expense Amount</th>
                  <th className="text-left p-2">Payment Made</th>
                  <th className="text-left p-2">Payment Date</th>
                  <th className="text-left p-2">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {user.daily_records.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{format(new Date(record.expense_date), 'dd/MM/yyyy')}</td>
                    <td className="p-2">Rs. {parseFloat(record.expense_amount.toString()).toFixed(2)}</td>
                    <td className="p-2">
                      <Badge variant={record.payment_made ? "default" : "secondary"}>
                        {record.payment_made ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {record.payment_date ? format(new Date(record.payment_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-2">
                      <span className={parseFloat(record.remainder_amount.toString()) > 0 ? 'text-red-600' : 'text-green-600'}>
                        Rs. {parseFloat(record.remainder_amount.toString()).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailRow;
