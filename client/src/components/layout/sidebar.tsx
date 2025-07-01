import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  PieChart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: PieChart },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn(
      "bg-sidebar-background border-r border-sidebar-border flex flex-col h-full transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground">FreelanceFlow</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
                alt="User avatar" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground">Alex Johnson</p>
                <p className="text-xs text-sidebar-foreground/60">alex@freelanceflow.app</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
