import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats, Expense, InvoiceWithClient } from "@shared/schema";

export default function Reports() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("thisYear");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const isLoading = statsLoading || expensesLoading || invoicesLoading;

  // Calculate expense breakdown by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += parseFloat(expense.amount);
    } else {
      acc.push({ name: expense.category, value: parseFloat(expense.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Calculate monthly profit/loss
  const monthlyProfitLoss = stats?.monthlyRevenue.map(month => {
    const monthExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const monthIndex = stats.monthlyRevenue.findIndex(m => m.month === month.month);
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - (5 - monthIndex));
        return expenseDate.getMonth() === targetDate.getMonth() && 
               expenseDate.getFullYear() === targetDate.getFullYear();
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    return {
      month: month.month,
      revenue: month.revenue,
      expenses: monthExpenses,
      profit: month.revenue - monthExpenses,
    };
  }) || [];

  // Calculate tax information
  const totalRevenue = invoices
    .filter(invoice => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const netIncome = totalRevenue - totalExpenses;
  const estimatedTax = netIncome * 0.25; // Approximate 25% tax rate

  // Invoice status breakdown
  const invoiceStatusBreakdown = invoices.reduce((acc, invoice) => {
    const existing = acc.find(item => item.name === invoice.status);
    if (existing) {
      existing.value += 1;
      existing.amount += parseFloat(invoice.amount);
    } else {
      acc.push({ 
        name: invoice.status, 
        value: 1, 
        amount: parseFloat(invoice.amount) 
      });
    }
    return acc;
  }, [] as { name: string; value: number; amount: number }[]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleExportReport = (type: string) => {
    // In a real application, this would generate and download actual reports
    const reportData = {
      type,
      period: selectedPeriod,
      totalRevenue,
      totalExpenses,
      netIncome,
      estimatedTax,
      generatedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-report-${selectedPeriod}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
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
          title="Reports" 
          description="Analyze your financial performance and generate reports."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExportReport('financial')}>
                <Download className="h-4 w-4 mr-2" />
                Export Financial
              </Button>
              <Button variant="outline" onClick={() => handleExportReport('tax')}>
                <Download className="h-4 w-4 mr-2" />
                Export Tax Report
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income Analysis</TabsTrigger>
              <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
              <TabsTrigger value="tax">Tax Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(netIncome)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                        <p className="text-2xl font-bold text-foreground">
                          {totalRevenue > 0 ? `${Math.round((netIncome / totalRevenue) * 100)}%` : "0%"}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit/Loss Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Profit & Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyProfitLoss}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue" />
                        <Bar dataKey="expenses" fill="hsl(var(--chart-1))" name="Expenses" />
                        <Bar dataKey="profit" fill="hsl(var(--chart-3))" name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoiceStatusBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {invoiceStatusBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string, props: any) => [
                            `${value} invoices (${formatCurrency(props.payload.amount)})`,
                            name
                          ]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [formatCurrency(value), "Amount"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {expensesByCategory.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(category.value)}</p>
                            <p className="text-sm text-muted-foreground">
                              {totalExpenses > 0 ? `${Math.round((category.value / totalExpenses) * 100)}%` : "0%"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tax" className="space-y-6">
              {/* Tax Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Taxable Income</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(netIncome)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Estimated Tax (25%)</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(estimatedTax)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">After-Tax Income</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(netIncome - estimatedTax)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tax Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Report Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Total Revenue</p>
                        <p className="text-lg">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Business Expenses</p>
                        <p className="text-lg">-{formatCurrency(totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Net Business Income</p>
                        <p className="text-lg font-bold">{formatCurrency(netIncome)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Estimated Tax Liability</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(estimatedTax)}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>* This is an estimated tax calculation based on a 25% tax rate.</p>
                      <p>* Please consult with a tax professional for accurate tax planning.</p>
                      <p>* Actual tax liability may vary based on deductions, credits, and tax brackets.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
