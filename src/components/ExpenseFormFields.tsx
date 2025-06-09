
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpenseFormFieldsProps {
  amount: string;
  onAmountChange: (value: string) => void;
  expenseDate: string;
  onExpenseDateChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
}

export const ExpenseFormFields = ({
  amount,
  onAmountChange,
  expenseDate,
  onExpenseDateChange,
  note,
  onNoteChange
}: ExpenseFormFieldsProps) => {
  return (
    <>
      <div className="sm:col-span-2 lg:col-span-1">
        <Label htmlFor="amount" className="text-sm sm:text-base">Amount (Rs.)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="200.00"
          className="text-sm sm:text-base"
          required
        />
      </div>

      <div className="sm:col-span-1">
        <Label htmlFor="expenseDate" className="text-sm sm:text-base">Date</Label>
        <Input
          id="expenseDate"
          type="date"
          value={expenseDate}
          onChange={(e) => onExpenseDateChange(e.target.value)}
          className="text-sm sm:text-base"
          required
        />
      </div>

      <div className="sm:col-span-1">
        <Label htmlFor="note" className="text-sm sm:text-base">Note (Optional)</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Tea, Lunch, etc."
          className="text-sm sm:text-base"
        />
      </div>
    </>
  );
};
