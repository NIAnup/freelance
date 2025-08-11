import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Plus, DollarSign, CreditCard, CheckCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { z } from "zod";
import type { Payment, Client, Invoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const paymentFormSchema = z.object({
  invoiceId: z.number().min(1, "Please select an invoice"),
  clientId: z.number().min(1, "Please select a client"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().optional(),
  method: z.string().optional(),
  receivedDate: z.date().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentWithDetails extends Payment {
  invoice: Invoice;
  client: Client;
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ["/api/payments"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId: 0,
      clientId: 0,
      amount: "",
      currency: "USD",
      method: "Bank Transfer",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payments", {
        ...data,
        userId: 1, // This should come from auth context
        status: "Received",
        receivedDate: data.receivedDate || new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Payment recorded successfully" });
      setPaymentModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  const filteredPayments = payments.filter((payment: PaymentWithDetails) => {
    const matchesSearch = 
      payment.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.method || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || (payment.status || "").toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleModalClose = () => {
    setPaymentModalOpen(false);
    form.reset();
  };

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const totalPayments = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const receivedCount = payments.filter(p => p.status === 'Received').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.receivedDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  if (paymentsLoading) {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Track and manage incoming payments</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(totalPayments)}</p>
                    <p className="text-xs text-muted-foreground">Total Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(thisMonthTotal)}</p>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{receivedCount}</p>
                    <p className="text-xs text-muted-foreground">Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:flex-1">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setPaymentModalOpen(true)} className="w-full lg:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No payments found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No payments match your filters." 
                    : "Record your first payment to get started."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setPaymentModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-4">
                {filteredPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {payment.invoice?.invoiceNumber || 'N/A'}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {payment.client?.companyName || 'Unknown Client'}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDate(payment.receivedDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">{formatCurrency(parseFloat(payment.amount))}</p>
                          <Badge className={`text-xs mt-1 ${getStatusColor(payment.status || 'Pending')}`}>
                            {payment.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      {payment.method && (
                        <p className="text-sm text-muted-foreground">via {payment.method}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium">
                              {payment.invoice?.invoiceNumber || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {payment.client?.companyName || 'Unknown Client'}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(parseFloat(payment.amount))}
                          </TableCell>
                          <TableCell>{payment.method || 'N/A'}</TableCell>
                          <TableCell>{formatDate(payment.receivedDate)}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(payment.status || 'Pending')}`}>
                              {payment.status || 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}

          {/* Payment Modal */}
          <Dialog open={paymentModalOpen} onOpenChange={handleModalClose}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select invoice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {invoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                {invoice.invoiceNumber} - {formatCurrency(parseFloat(invoice.amount))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
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
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue="Bank Transfer">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleModalClose} type="button">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPaymentMutation.isPending}
                      className="min-w-24"
                    >
                      {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Navigation>
  );
}