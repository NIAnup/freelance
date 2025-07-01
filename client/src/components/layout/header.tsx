import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { Menu, Moon, Sun, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  onMobileMenuToggle: () => void;
}

export default function Header({ title, description, onMobileMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <Select defaultValue="USD">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
