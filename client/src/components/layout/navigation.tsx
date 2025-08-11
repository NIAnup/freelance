import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  DollarSign, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  children: React.ReactNode;
}

export function Navigation({ children }: NavigationProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/signout");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      signOut();
      window.location.href = "/";
    },
  });

  const handleSignout = () => {
    signoutMutation.mutate();
  };

  // Helper function to get user initials (max 2 characters)
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const NavItems = ({ mobile = false, onItemClick = () => {} }: { mobile?: boolean; onItemClick?: () => void }) => (
    <nav className={`space-y-1 ${mobile ? 'px-4' : 'px-3'}`}>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
        return (
          <Link key={item.name} href={item.href}>
            <div 
              className={`
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
              onClick={onItemClick}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const UserMenu = ({ mobile = false }: { mobile?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {mobile ? (
          <Button variant="ghost" className="w-full justify-start p-2 h-auto">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{user?.username}
                </p>
              </div>
            </div>
          </Button>
        ) : (
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                {getUserInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">@{user?.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignout} disabled={signoutMutation.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 shadow-xl border-r border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 rounded-lg p-2">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">FreelanceFlow</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4">
            <NavItems />
          </div>

          {/* User profile */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <UserMenu mobile />
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-gray-800">
              <div className="flex flex-col h-full">
                {/* Mobile Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                  <Link href="/dashboard">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-600 rounded-lg p-2">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">FreelanceFlow</span>
                    </div>
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <div className="flex-1 py-4">
                  <NavItems mobile onItemClick={() => setSidebarOpen(false)} />
                </div>

                {/* Mobile User profile */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <UserMenu mobile />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 rounded-lg p-1.5">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">FreelanceFlow</span>
              </div>
            </Link>
          </div>

          <UserMenu />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}