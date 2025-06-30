
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Calendar, User, Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useUserApprovals } from "@/hooks/useUserApprovals";
import { useAuth } from "@/contexts/AuthContext";

const UserManagement = () => {
  const { profile } = useAuth();
  const { pendingUsers, loading, updateUserRole, refetch } = useUserApprovals();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'hr' | 'canteen' | 'user') => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      console.log('Role updated successfully');
    } else {
      console.error('Failed to update role:', result.error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'default';
      case 'canteen': return 'secondary';
      case 'user': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'user': return 'Basic User';
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'canteen': return 'Canteen';
      default: return role;
    }
  };

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (!profile || profile.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to manage users. Only admin users can access this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            User Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Basic User</SelectItem>
                  <SelectItem value="canteen">Canteen</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                onClick={refetch}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {pendingUsers.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Click on role buttons to update user permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{user.username}</h3>
                            {(user.first_name || user.last_name) && (
                              <p className="text-sm text-muted-foreground truncate">
                                {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex-shrink-0">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={user.role === 'user' ? 'default' : 'outline'}
                          onClick={() => handleRoleUpdate(user.id, 'user')}
                          disabled={user.role === 'user'}
                          className="flex-1 sm:flex-none"
                        >
                          Basic User
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'canteen' ? 'default' : 'outline'}
                          onClick={() => handleRoleUpdate(user.id, 'canteen')}
                          disabled={user.role === 'canteen'}
                          className="flex-1 sm:flex-none"
                        >
                          Canteen
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'hr' ? 'default' : 'outline'}
                          onClick={() => handleRoleUpdate(user.id, 'hr')}
                          disabled={user.role === 'hr'}
                          className="flex-1 sm:flex-none"
                        >
                          HR
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          onClick={() => handleRoleUpdate(user.id, 'admin')}
                          disabled={user.role === 'admin'}
                          className="flex-1 sm:flex-none"
                        >
                          Admin
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
