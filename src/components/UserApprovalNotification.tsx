
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Bell } from "lucide-react";
import UserApprovalModal from "./UserApprovalModal";
import { useUserApprovals } from "@/hooks/useUserApprovals";
import { useAuth } from "@/contexts/AuthContext";

const UserApprovalNotification = () => {
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const { pendingUsers, updateUserRole } = useUserApprovals();

  // Only show for admin users
  if (profile?.role !== 'admin') {
    return null;
  }

  // Count users that might need attention (basic users)
  const basicUsers = pendingUsers.filter(user => user.role === 'user');

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          User Management
          {basicUsers.length > 0 && (
            <Badge variant="destructive" className="ml-1 px-1 min-w-[1.2rem] h-5 text-xs">
              {basicUsers.length}
            </Badge>
          )}
        </Button>
        
        {basicUsers.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <UserApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pendingUsers={pendingUsers}
        onUpdateRole={updateUserRole}
      />
    </>
  );
};

export default UserApprovalNotification;
