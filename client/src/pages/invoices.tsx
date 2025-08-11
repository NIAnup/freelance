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
import { Search, Plus, MoreHorizontal, Download, Eye, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { InvoiceWithClient } from "../../shared/schema";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete invoice");
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
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update invoice status");
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

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:flex-1">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setInvoiceModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>

          {/* Invoices Table - Desktop */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: InvoiceWithClient) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-32">{invoice.title}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{invoice.client.companyName}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(parseFloat(invoice.amount), invoice.currency || "USD")}</TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(invoice.status || "draft")}>
                            {invoice.status || "Draft"}
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
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              {getStatusActions(invoice).map((action) => (
                                <DropdownMenuItem 
                                  key={action} 
                                  onClick={() => handleStatusChange(invoice, action)}
                                >
                                  Mark as {action}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => handleDeleteInvoice(invoice)}
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

          {/* Invoices Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {filteredInvoices.map((invoice: InvoiceWithClient) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-muted-foreground truncate">{invoice.title}</p>
                      <p className="text-sm font-medium mt-1">{invoice.client.companyName}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className={getStatusColor(invoice.status || "draft")}>
                        {invoice.status || "Draft"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {getStatusActions(invoice).map((action) => (
                            <DropdownMenuItem 
                              key={action} 
                              onClick={() => handleStatusChange(invoice, action)}
                            >
                              Mark as {action}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => handleDeleteInvoice(invoice)}
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
                      <p className="font-semibold font-mono">{formatCurrency(parseFloat(invoice.amount), invoice.currency || "USD")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms." : "Get started by creating your first invoice."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setInvoiceModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Invoice
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <InvoiceModal 
        open={invoiceModalOpen} 
        onOpenChange={handleModalClose}
        invoice={selectedInvoice || undefined}
      />
    </Navigation>
  );
}