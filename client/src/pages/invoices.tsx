import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import InvoiceModal from "@/components/modals/invoice-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, MoreHorizontal, Download, Eye, Edit, Trash2, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { InvoiceWithClient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/invoices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete invoice", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/invoices/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice status", variant: "destructive" });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/invoices/${id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return blob;
    },
    onSuccess: () => {
      toast({ title: "Invoice downloaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    },
  });

  const filteredInvoices = invoices.filter((invoice: InvoiceWithClient) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || (invoice.status || "").toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEditInvoice = (invoice: InvoiceWithClient) => {
    setSelectedInvoice(invoice);
    setInvoiceModalOpen(true);
  };

  const handleModalClose = () => {
    setInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleStatusChange = (invoice: InvoiceWithClient, status: string) => {
    updateStatusMutation.mutate({ id: invoice.id, status });
  };

  const handleDownloadPDF = (invoice: InvoiceWithClient) => {
    downloadPDFMutation.mutate(invoice.id);
  };

  const handleDeleteInvoice = (invoice: InvoiceWithClient) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(invoice.id);
    }
  };

  const getStatusActions = (invoice: InvoiceWithClient) => {
    switch (invoice.status) {
      case "Draft":
        return ["Sent"];
      case "Sent":
        return ["Paid", "Overdue"];
      case "Overdue":
        return ["Paid"];
      case "Paid":
        return [];
      default:
        return [];
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  const draftCount = invoices.filter(inv => inv.status === 'Draft').length;
  const sentCount = invoices.filter(inv => inv.status === 'Sent').length;
  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;

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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage and track your invoices</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{draftCount}</p>
                    <p className="text-xs text-muted-foreground">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{sentCount}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">{paidCount}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
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
                  placeholder="Search invoices..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setInvoiceModalOpen(true)} className="w-full lg:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No invoices match your filters." 
                    : "Create your first invoice to get started."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setInvoiceModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-4">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-muted-foreground truncate">{invoice.client.companyName}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">{formatCurrency(parseFloat(invoice.amount))}</p>
                          <Badge className={`text-xs mt-1 ${getStatusColor(invoice.status || 'draft')}`}>
                            {invoice.status || 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{invoice.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {getStatusActions(invoice).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(invoice, status)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as {status}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-32">{invoice.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.client.companyName}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(parseFloat(invoice.amount))}
                          </TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(invoice.status || 'draft')}`}>
                              {invoice.status || 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                {getStatusActions(invoice).map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => handleStatusChange(invoice, status)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as {status}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}

          <InvoiceModal
            open={invoiceModalOpen}
            onClose={handleModalClose}
            invoice={selectedInvoice}
          />
        </div>
      </div>
    </Navigation>
  );
}