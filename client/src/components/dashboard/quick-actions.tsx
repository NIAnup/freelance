import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Receipt, BarChart3, Bot } from "lucide-react";
import AIChat from "@/components/ai-assistant/ai-chat";

interface QuickActionsProps {
  onNewInvoice: () => void;
  onAddClient: () => void;
  onLogExpense: () => void;
}

export default function QuickActions({ onNewInvoice, onAddClient, onLogExpense }: QuickActionsProps) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  const actions = [
    {
      title: "New Invoice",
      description: "Create and send invoices",
      icon: Plus,
      buttonText: "Create Invoice",
      onClick: onNewInvoice,
    },
    {
      title: "Add Client",
      description: "Add new client details",
      icon: UserPlus,
      buttonText: "Add Client",
      onClick: onAddClient,
    },
    {
      title: "Log Expense",
      description: "Track business expenses",
      icon: Receipt,
      buttonText: "Add Expense",
      onClick: onLogExpense,
    },
    {
      title: "View Reports",
      description: "Generate financial reports",
      icon: BarChart3,
      buttonText: "View Reports",
      onClick: () => window.location.href = "/reports",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {actions.map((action, index) => (
          <Card key={index} className="border border-border hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9" 
                onClick={action.onClick}
                variant="outline"
              >
                {action.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border border-border hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm sm:text-base">AI Assistant</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get instant financial insights and advice
                  </p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9" 
              onClick={() => setAiChatOpen(true)}
              variant="outline"
            >
              <Bot className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Open Assistant
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <AIChat open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </>
  );
}