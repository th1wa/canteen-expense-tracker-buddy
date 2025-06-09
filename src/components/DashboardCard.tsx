
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, description, icon: Icon, children, className }: DashboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl truncate">{title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
