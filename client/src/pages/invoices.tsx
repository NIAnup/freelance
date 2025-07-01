import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import InvoiceModal from "@/components/modals/invoice-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Download, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceWithClient } from "@shared/schema";

export default function Invoices() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Invoice status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice status", variant: "destructive" });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}/pdf`);
      return response.blob();
    },
    onSuccess: (blob, invoiceId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Invoice downloaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    },
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;
    
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
          title="Invoices" 
          description="Create, manage, and track your invoice payments."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>

          {/* Invoices Table */}
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
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.client.companyName}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(invoice.amount), invoice.currency)}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {getStatusActions(invoice).map((status) => (
                              <DropdownMenuItem 
                                key={status}
                                onClick={() => handleStatusChange(invoice, status)}
                              >
                                Mark as {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter." 
                      : "Get started by creating your first invoice."
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => setInvoiceModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Invoice
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal 
        open={invoiceModalOpen} 
        onOpenChange={handleModalClose}
        invoice={selectedInvoice || undefined}
      />
    </div>
  );
}
