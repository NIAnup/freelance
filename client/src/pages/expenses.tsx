import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ExpenseModal from "@/components/modals/expense-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Receipt, Download, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@shared/schema";

export default function Expenses() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const matchesSearch = 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      
      let matchesDate = true;
      if (dateRange !== "all") {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        
        switch (dateRange) {
          case "thisMonth":
            matchesDate = expenseDate.getMonth() === now.getMonth() && 
                         expenseDate.getFullYear() === now.getFullYear();
            break;
          case "lastMonth":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            matchesDate = expenseDate.getMonth() === lastMonth.getMonth() && 
                         expenseDate.getFullYear() === lastMonth.getFullYear();
            break;
          case "thisYear":
            matchesDate = expenseDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (confirm(`Are you sure you want to delete this expense: ${expense.description}?`)) {
      deleteMutation.mutate(expense.id);
    }
  };

  const handleModalClose = () => {
    setExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Tools: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300",
      Transport: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300",
      Marketing: "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300",
      Tax: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300",
      Office: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300",
    };
    return colors[category as keyof typeof colors] || "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 border-r border-border">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border p-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} hidden lg:block transition-all duration-300`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 z-30 lg:hidden">
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Expenses" 
          description="Track and categorize your business expenses for better financial management."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {Object.entries(expensesByCategory).slice(0, 3).map(([category, amount]) => (
              <Card key={category}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{category}</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(amount)}</p>
                    </div>
                    <Badge variant="secondary" className={getCategoryColor(category)}>
                      {Math.round((amount / totalExpenses) * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Tax">Tax</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setExpenseModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Expenses Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(expense.amount), expense.currency)}</TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No receipt</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {expense.notes || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || categoryFilter !== "all" || dateRange !== "all"
                      ? "Try adjusting your search or filters." 
                      : "Start tracking your business expenses to better manage your finances."
                    }
                  </p>
                  {!searchTerm && categoryFilter === "all" && dateRange === "all" && (
                    <Button onClick={() => setExpenseModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Expense
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Expense Modal */}
      <ExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={handleModalClose}
        expense={selectedExpense || undefined}
      />
    </div>
  );
}
