
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0 text-purple-light" />
      <Switch 
        checked={theme === "dark"} 
        onCheckedChange={toggleTheme} 
        aria-label="Toggle theme" 
      />
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-purple-light" />
    </div>
  );
}
