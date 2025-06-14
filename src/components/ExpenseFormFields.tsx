
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <div className="w-full">
        <Label htmlFor="amount" className="text-xs sm:text-sm md:text-base">Amount (Rs.)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="200.00"
          className="form-responsive w-full"
          required
        />
      </div>

      <div className="w-full">
        <Label htmlFor="expenseDate" className="text-xs sm:text-sm md:text-base">Date</Label>
        <Input
          id="expenseDate"
          type="date"
          value={expenseDate}
          onChange={(e) => onExpenseDateChange(e.target.value)}
          className="form-responsive w-full"
          required
        />
      </div>

      <div className="w-full sm:col-span-2 lg:col-span-1">
        <Label htmlFor="note" className="text-xs sm:text-sm md:text-base">Meal Type</Label>
        <Select value={note} onValueChange={onNoteChange}>
          <SelectTrigger className="form-responsive w-full">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background">
            {mealOptions.map((option) => (
              <SelectItem key={option.value} value={option.label} className="cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
