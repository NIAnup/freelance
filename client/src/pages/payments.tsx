import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPaymentSchema, type InsertPayment, type Payment, type InvoiceWithClient } from "@shared/schema";
import { z } from "zod";

const paymentFormSchema = insertPaymentSchema.pick({
  invoiceId: true,
  clientId: true,
  amount: true,
  currency: true,
  method: true,
  receivedDate: true,
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: invoices = [] } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId: 0,
      clientId: 0,
      amount: "0",
      currency: "USD",
      method: "",
      receivedDate: new Date().toISOString().split('T')[0],
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const paymentData: InsertPayment = {
        ...data,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        status: "Received",
      };
      const response = await apiRequest("POST", "/api/payments", paymentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Payment recorded successfully" });
      setPaymentModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/payments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Payment status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  const filteredPayments = payments.filter(payment => {
    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
    const matchesSearch = 
      invoice?.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice?.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalReceived = filteredPayments
    .filter(payment => payment.status === "Received")
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const totalPending = filteredPayments
    .filter(payment => payment.status === "Pending")
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case "Received":
        return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "Failed":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
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
          title="Payments" 
          description="Track and manage incoming payments from your clients."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalReceived)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {payments.length > 0 ? Math.round((totalReceived / (totalReceived + totalPending)) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="invoiceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice</FormLabel>
                          <Select onValueChange={(value) => {
                            const invoiceId = parseInt(value);
                            const invoice = invoices.find(inv => inv.id === invoiceId);
                            field.onChange(invoiceId);
                            if (invoice) {
                              form.setValue("clientId", invoice.clientId);
                              form.setValue("amount", invoice.amount);
                              form.setValue("currency", invoice.currency);
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select invoice..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {invoices.filter(inv => inv.status !== "Paid").map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                  {invoice.invoiceNumber} - {invoice.client.companyName} ({formatCurrency(parseFloat(invoice.amount))})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="PayPal">PayPal</SelectItem>
                                <SelectItem value="Stripe">Stripe</SelectItem>
                                <SelectItem value="Check">Check</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="receivedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex space-x-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setPaymentModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" disabled={createPaymentMutation.isPending}>
                        Record Payment
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {invoice?.invoiceNumber || `Invoice #${payment.invoiceId}`}
                        </TableCell>
                        <TableCell>
                          {invoice?.client.companyName || "Unknown Client"}
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(payment.amount), payment.currency)}</TableCell>
                        <TableCell>{payment.method || "-"}</TableCell>
                        <TableCell>
                          {payment.receivedDate ? formatDate(payment.receivedDate) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getPaymentIcon(payment.status)}
                            <Badge variant="secondary" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter." 
                      : "Start recording payments to track your income."
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => setPaymentModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Your First Payment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
