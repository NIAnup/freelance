import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import ExpenseModal from "@/components/modals/expense-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "../../shared/schema";

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const filteredExpenses = (expenses as Expense[]).filter((expense: Expense) => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || (expense.category || "").toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleModalClose = () => {
    setExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(expense.id);
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "office":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "travel":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "software":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "marketing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "meals":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <Navigation>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Track and manage your business expenses</p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:flex-1">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setExpenseModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {/* Expenses Table - Desktop */}
          <div className="hidden md:block">
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
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense: Expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-48">{expense.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                            {expense.category || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(parseFloat(expense.amount), expense.currency || "USD")}</TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          {expense.receipt ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={expense.receipt} target="_blank" rel="noopener noreferrer">
                                <Receipt className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">No receipt</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteExpense(expense)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredExpenses.map((expense: Expense) => (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg">{expense.description}</h3>
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{expense.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                          {expense.category || "Other"}
                        </Badge>
                        {expense.receipt && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={expense.receipt} target="_blank" rel="noopener noreferrer">
                              <Receipt className="h-3 w-3 mr-1" />
                              Receipt
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteExpense(expense)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold font-mono">{formatCurrency(parseFloat(expense.amount), expense.currency || "USD")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(expense.date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms." : "Start tracking your business expenses."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setExpenseModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Expense
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={handleModalClose}
        expense={selectedExpense || undefined}
      />
    </Navigation>
  );
}