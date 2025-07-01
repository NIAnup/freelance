import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Receipt, BarChart3, Bot } from "lucide-react";

interface QuickActionsProps {
  onNewInvoice: () => void;
  onAddClient: () => void;
  onLogExpense: () => void;
}

export default function QuickActions({ onNewInvoice, onAddClient, onLogExpense }: QuickActionsProps) {
  const actions = [
    {
      title: "New Invoice",
      icon: Plus,
      bgColor: "bg-primary/10 hover:bg-primary/20",
      iconColor: "text-primary",
      onClick: onNewInvoice,
    },
    {
      title: "Add Client",
      icon: UserPlus,
      bgColor: "bg-emerald-50 dark:bg-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/70",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      onClick: onAddClient,
    },
    {
      title: "Log Expense",
      icon: Receipt,
      bgColor: "bg-amber-50 dark:bg-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/70",
      iconColor: "text-amber-600 dark:text-amber-400",
      onClick: onLogExpense,
    },
    {
      title: "View Report",
      icon: BarChart3,
      bgColor: "bg-purple-50 dark:bg-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/70",
      iconColor: "text-purple-600 dark:text-purple-400",
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <Button
                key={action.title}
                variant="ghost"
                className={`flex flex-col h-auto p-4 ${action.bgColor} transition-colors group`}
                onClick={action.onClick}
              >
                <action.icon className={`h-5 w-5 mb-2 ${action.iconColor} group-hover:scale-110 transition-transform`} />
                <span className={`text-sm font-medium ${action.iconColor}`}>{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Preview */}
      <Card className="bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask me anything about your finances</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-background rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground italic">
                "Who are my top 3 clients this month?"
              </p>
            </div>
            <Button className="w-full" onClick={() => alert("AI Assistant feature coming soon!")}>
              Open AI Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
