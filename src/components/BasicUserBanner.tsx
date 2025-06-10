
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BasicUserBanner = () => {
  const { profile } = useAuth();

  // Only show for basic users
  if (!profile || profile.role !== 'user') {
    return null;
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-medium">Welcome! You have limited access as a Basic User.</span>
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3" />
            <span>To request additional permissions, please contact the system administrator.</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BasicUserBanner;
