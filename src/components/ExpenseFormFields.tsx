
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExpenseFormFieldsProps {
  amount: string;
  onAmountChange: (value: string) => void;
  expenseDate: string;
  onExpenseDateChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
}

const mealOptions = [
  { value: "morning-tea", label: "Morning Tea" },
  { value: "lunch", label: "Lunch" },
  { value: "afternoon-tea", label: "Afternoon Tea" },
  { value: "other", label: "Other" }
];

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
        <Label htmlFor="note" className="text-sm sm:text-base">Meal Type</Label>
        <Select value={note} onValueChange={onNoteChange}>
          <SelectTrigger className="text-sm sm:text-base">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            {mealOptions.map((option) => (
              <SelectItem key={option.value} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
