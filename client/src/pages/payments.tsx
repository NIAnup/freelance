import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Plus, DollarSign } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { z } from "zod";
import type { Payment, Client, Invoice } from "../../shared/schema";

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

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: invoices = [] } = useQuery({
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
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: 1, // This should come from auth context
          status: "Received",
          receivedDate: data.receivedDate || new Date(),
        }),
      });
      if (!response.ok) throw new Error("Failed to create payment");
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

  const filteredPayments = (payments as PaymentWithDetails[]).filter((payment: PaymentWithDetails) => {
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

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:flex-1">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
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
            <Button 
              onClick={() => setPaymentModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </div>

          {/* Payments Table - Desktop */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date Received</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: PaymentWithDetails) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.invoice?.invoiceNumber || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">#{payment.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{payment.client?.companyName || "N/A"}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(parseFloat(payment.amount), payment.currency || "USD")}</TableCell>
                        <TableCell>{payment.method || "Bank Transfer"}</TableCell>
                        <TableCell>{payment.receivedDate ? formatDate(payment.receivedDate) : "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(payment.status || "received")}>
                            {payment.status || "Received"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Payments Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredPayments.map((payment: PaymentWithDetails) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg">{payment.invoice?.invoiceNumber || "N/A"}</h3>
                      <p className="text-sm text-muted-foreground">#{payment.id}</p>
                      <p className="text-sm font-medium mt-1">{payment.client?.companyName || "N/A"}</p>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(payment.status || "received")}>
                      {payment.status || "Received"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold font-mono">{formatCurrency(parseFloat(payment.amount), payment.currency || "USD")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-medium">{payment.method || "Bank Transfer"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Date Received</p>
                      <p className="font-medium">{payment.receivedDate ? formatDate(payment.receivedDate) : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms." : "Start tracking your incoming payments."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setPaymentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Your First Payment
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

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
                        {(clients as Client[]).map((client: Client) => (
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
                        {(invoices as Invoice[]).map((invoice: Invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id.toString()}>
                            {invoice.invoiceNumber} - {formatCurrency(parseFloat(invoice.amount), invoice.currency || "USD")}
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
                      <Input placeholder="0.00" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="receivedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Navigation>
  );
}