import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ClientModal from "@/components/modals/client-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Mail, Phone } from "lucide-react";
import { formatCurrency, formatDate, getInitials, getStatusColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClientWithStats } from "@shared/schema";

export default function Clients() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<ClientWithStats[]>({
    queryKey: ["/api/clients/with-stats"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/with-stats"] });
      toast({ title: "Client deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete client", variant: "destructive" });
    },
  });

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClient = (client: ClientWithStats) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };

  const handleDeleteClient = (client: ClientWithStats) => {
    if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleModalClose = () => {
    setClientModalOpen(false);
    setSelectedClient(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
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
          title="Clients" 
          description="Manage your client relationships and track project history."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => setClientModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(client.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{client.companyName}</CardTitle>
                        <Badge variant="secondary" className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.contactPerson && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium">{client.contactPerson}</span>
                      </div>
                    )}
                    
                    {client.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    
                    {client.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{client.phone}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="font-semibold">{formatCurrency(client.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Projects</p>
                        <p className="font-semibold">{client.projectCount}</p>
                      </div>
                    </div>

                    {client.lastInvoiceDate && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Last invoice: {formatDate(client.lastInvoiceDate)}
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        Payment Terms: {client.paymentTerms}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first client."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setClientModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Client Modal */}
      <ClientModal 
        open={clientModalOpen} 
        onOpenChange={handleModalClose}
        client={selectedClient || undefined}
      />
    </div>
  );
}
