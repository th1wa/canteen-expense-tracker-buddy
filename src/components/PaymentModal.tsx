
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaymentHistory from "./PaymentHistory";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  totalExpense: number;
}

const PaymentModal = ({ isOpen, onClose, userName, totalExpense }: PaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_name', userName)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, userName, refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('payments')
        .insert([
          {
            user_name: userName,
            amount: Number(amount),
            payment_date: format(paymentDate, 'yyyy-MM-dd'),
          }
        ]);

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: `Payment of Rs. ${amount} has been recorded for ${userName}`,
      });

      setAmount('');
      setPaymentDate(new Date());
      setRefreshTrigger(prev => prev + 1);
      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Record Payment for {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-muted p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Outstanding Expense</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">Rs. {totalExpense.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm sm:text-base">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
                required
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm sm:text-base",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full text-sm sm:text-base py-2 sm:py-3"
            >
              {isSubmitting ? "Recording Payment..." : "Record Payment"}
            </Button>
          </form>

          <div className="border-t pt-4">
            <PaymentHistory payments={payments} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
