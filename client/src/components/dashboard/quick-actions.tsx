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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={action.onClick}
                variant="outline"
              >
                {action.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant financial insights and advice
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Sample Question:</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "Who are my top 3 clients this month?"
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => setAiChatOpen(true)}>
              Open AI Chat
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <AIChat open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </>
  );
}