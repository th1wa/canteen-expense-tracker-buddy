import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, Settings, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { profile, signOut } = useAuth();

  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      roles: ['admin', 'hr', 'canteen', 'user']
    },
    {
      title: "Summary Report",
      url: "/summary",
      icon: TrendingUp,
      roles: ['admin', 'hr', 'canteen']
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      roles: ['admin', 'hr']
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      roles: ['admin']
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <nav className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Canteen App</h1>
      </div>
      <ul className="flex-1 overflow-y-auto py-4 space-y-1">
        {items
          .filter(item => item.roles.includes(profile.role))
          .map(item => {
            const Icon = item.icon;
            return (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md ${
                      isActive ? "bg-blue-500 text-white" : ""
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              </li>
            );
          })}
      </ul>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
