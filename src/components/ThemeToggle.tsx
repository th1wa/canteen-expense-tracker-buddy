
import React from 'react';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 transition-transform hover:rotate-12" />
          Dark
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 transition-transform hover:rotate-12" />
          Light
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
