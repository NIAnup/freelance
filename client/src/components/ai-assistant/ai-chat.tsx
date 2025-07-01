import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats, InvoiceWithClient, Expense, ClientWithStats } from "@shared/schema";

interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChat({ open, onOpenChange }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI finance assistant. I can help you analyze your business data, answer questions about your finances, and provide insights. Try asking me something like 'Who are my top clients?' or 'What are my expenses this month?'",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: invoices = [] } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: clients = [] } = useQuery<ClientWithStats[]>({
    queryKey: ["/api/clients/with-stats"],
  });

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Top clients query
    if (message.includes("top") && (message.includes("client") || message.includes("customer"))) {
      if (clients.length === 0) {
        return "You don't have any clients yet. Start by adding your first client to begin tracking revenue and projects.";
      }
      const topClients = clients
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3);
      
      return `Here are your top 3 clients by revenue:\n\n${topClients
        .map((client, index) => 
          `${index + 1}. **${client.companyName}** - ${formatCurrency(client.totalRevenue)} (${client.projectCount} project${client.projectCount !== 1 ? 's' : ''})`
        )
        .join('\n')}`;
    }

    // Revenue/earnings query
    if (message.includes("revenue") || message.includes("earning") || message.includes("income")) {
      if (!stats) return "I'm still loading your financial data. Please try again in a moment.";
      return `Your current financial summary:\n\n• **Total Earnings**: ${formatCurrency(stats.totalEarnings)}\n• **Pending Payments**: ${formatCurrency(stats.pendingPayments)}\n• **Monthly Expenses**: ${formatCurrency(stats.monthlyExpenses)}\n• **Active Clients**: ${stats.activeClients}`;
    }

    // Expenses query
    if (message.includes("expense") || message.includes("spending")) {
      if (expenses.length === 0) {
        return "You haven't logged any expenses yet. Start tracking your business expenses to get better insights into your spending patterns.";
      }
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
        return acc;
      }, {} as Record<string, number>);
      
      const topCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];
      
      return `Your expense breakdown:\n\n• **Total Expenses**: ${formatCurrency(totalExpenses)}\n• **Biggest Category**: ${topCategory[0]} (${formatCurrency(topCategory[1])})\n• **Number of Expenses**: ${expenses.length}`;
    }

    // Invoices query
    if (message.includes("invoice") || message.includes("bill")) {
      if (invoices.length === 0) {
        return "You haven't created any invoices yet. Create your first invoice to start tracking payments from clients.";
      }
      
      const paidInvoices = invoices.filter(inv => inv.status === "Paid").length;
      const pendingInvoices = invoices.filter(inv => inv.status === "Sent" || inv.status === "Overdue").length;
      const totalInvoiceValue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      
      return `Your invoice summary:\n\n• **Total Invoices**: ${invoices.length}\n• **Paid**: ${paidInvoices}\n• **Pending**: ${pendingInvoices}\n• **Total Value**: ${formatCurrency(totalInvoiceValue)}`;
    }

    // Overdue payments
    if (message.includes("overdue") || message.includes("late")) {
      const overdueInvoices = invoices.filter(inv => inv.status === "Overdue");
      if (overdueInvoices.length === 0) {
        return "Great news! You don't have any overdue invoices at the moment. Keep up the good work with timely follow-ups!";
      }
      
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      return `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? 's' : ''} totaling ${formatCurrency(overdueAmount)}. Consider following up with these clients.`;
    }

    // Profit analysis
    if (message.includes("profit") || message.includes("margin")) {
      if (!stats) return "I'm still loading your financial data. Please try again in a moment.";
      const profit = stats.totalEarnings - stats.monthlyExpenses;
      const margin = stats.totalEarnings > 0 ? (profit / stats.totalEarnings) * 100 : 0;
      
      return `Your profit analysis:\n\n• **Net Profit**: ${formatCurrency(profit)}\n• **Profit Margin**: ${margin.toFixed(1)}%\n• **Revenue**: ${formatCurrency(stats.totalEarnings)}\n• **Expenses**: ${formatCurrency(stats.monthlyExpenses)}`;
    }

    // General help
    if (message.includes("help") || message.includes("what can you do")) {
      return "I can help you with:\n\n• **Financial Overview** - Ask about revenue, expenses, or profits\n• **Client Analysis** - Find your top clients or client insights\n• **Invoice Status** - Check on pending, paid, or overdue invoices\n• **Expense Tracking** - Analyze your spending patterns\n• **Business Insights** - Get recommendations for growth\n\nTry asking specific questions like 'Show me my monthly expenses' or 'Which clients owe me money?'";
    }

    // Default response
    return "I understand you're asking about your business finances. Try asking me about:\n\n• Your top clients\n• Monthly revenue or expenses\n• Invoice status\n• Overdue payments\n• Profit margins\n\nOr type 'help' to see all the ways I can assist you!";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Who are my top 3 clients?",
    "What are my total expenses this month?",
    "Show me my overdue invoices",
    "What's my profit margin?",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>AI Finance Assistant</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Quick questions to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 text-xs text-left justify-start"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card className={`max-w-[80%] ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user" 
                            ? "bg-primary-foreground/20" 
                            : "bg-primary"
                        }`}>
                          {message.role === "user" ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Bot className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <Card className="bg-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Ask me about your finances..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}