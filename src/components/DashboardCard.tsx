
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export const DashboardCard = ({ title, description, icon: Icon, children }: DashboardCardProps) => {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 transition-colors group">
          <Icon className="w-5 h-5 transition-transform group-hover:rotate-12" />
          {title}
        </CardTitle>
        <CardDescription className="transition-colors">{description}</CardDescription>
      </CardHeader>
      <CardContent className="transition-all duration-200">{children}</CardContent>
    </Card>
  );
};
