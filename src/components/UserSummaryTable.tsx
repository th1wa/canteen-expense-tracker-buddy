
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Download, User } from "lucide-react";
import { UserSummary, UserSummaryTableProps } from '@/types/summary';
import { useIsMobile } from "@/hooks/use-mobile";

const UserSummaryTable: React.FC<UserSummaryTableProps> = ({
  filteredData,
  searchTerm,
  expandedUser,
  isExporting,
  onToggleExpand,
  onExportUserDetail
}) => {
  const [localExpandedUser, setLocalExpandedUser] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleToggleExpand = (userName: string) => {
    setLocalExpandedUser(localExpandedUser === userName ? null : userName);
    onToggleExpand(userName);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getStatusBadge = (user: UserSummary) => {
    if (user.total_remainder <= 0) {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">Settled</Badge>;
    }
    const paymentRate = user.total_expenses > 0 ? (user.total_paid / user.total_expenses) * 100 : 0;
    if (paymentRate >= 80) {
      return <Badge variant="secondary" className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white">Nearly Done</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">Pending</Badge>;
  };

  if (isMobile) {
    return (
      <div className="space-y-3 p-4">
        {filteredData.map((user) => (
          <Card key={user.user_name} className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{user.user_name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(user)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleExpand(user.user_name)}
                    className="h-8 w-8 p-0"
                  >
                    {localExpandedUser === user.user_name ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Expenses</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(user.total_expenses)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(user.total_paid)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Outstanding</p>
                  <p className="font-medium text-red-600">{formatCurrency(user.total_remainder)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Progress</p>
                  <p className="font-medium text-blue-600">
                    {user.total_expenses > 0 ? ((user.total_paid / user.total_expenses) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {localExpandedUser === user.user_name && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Records</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExportUserDetail(user.user_name)}
                      disabled={isExporting}
                      className="text-xs h-8"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {user.daily_records.map((record, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                        <span>{record.expense_date}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(Number(record.expense_amount))}</span>
                          <Badge variant={record.payment_made ? "default" : "destructive"} className="text-xs">
                            {record.payment_made ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900">
            <TableHead className="w-12"></TableHead>
            <TableHead className="font-semibold">User Name</TableHead>
            <TableHead className="font-semibold text-right">Total Expenses</TableHead>
            <TableHead className="font-semibold text-right">Total Paid</TableHead>
            <TableHead className="font-semibold text-right">Outstanding</TableHead>
            <TableHead className="font-semibold text-center">Progress</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((user) => (
            <React.Fragment key={user.user_name}>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleExpand(user.user_name)}
                    className="h-8 w-8 p-0"
                  >
                    {localExpandedUser === user.user_name ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{user.user_name}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(user.total_expenses)}</TableCell>
                <TableCell className="text-right font-medium text-green-600">{formatCurrency(user.total_paid)}</TableCell>
                <TableCell className="text-right font-medium text-red-600">{formatCurrency(user.total_remainder)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${user.total_expenses > 0 ? Math.min(100, (user.total_paid / user.total_expenses) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {user.total_expenses > 0 ? ((user.total_paid / user.total_expenses) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(user)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExportUserDetail(user.user_name)}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </TableCell>
              </TableRow>
              
              {localExpandedUser === user.user_name && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-gray-50 dark:bg-gray-900 p-0">
                    <div className="p-4">
                      <h4 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Daily Records</h4>
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {user.daily_records.map((record, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{record.expense_date}</span>
                              <span className="text-sm">{formatCurrency(Number(record.expense_amount))}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={record.payment_made ? "default" : "destructive"} className="text-xs">
                                {record.payment_made ? "Paid" : "Pending"}
                              </Badge>
                              {record.payment_date && (
                                <span className="text-xs text-gray-500">
                                  Paid: {record.payment_date}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserSummaryTable;
