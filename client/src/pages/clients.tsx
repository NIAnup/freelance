import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
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
      <Navigation>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your client relationships and track project history</p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button 
              onClick={() => setClientModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </div>

          {/* Clients Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(client.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-lg truncate">{client.companyName}</CardTitle>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(client.status || 'active')} mt-1`}>
                          {client.status || 'active'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0"
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
            <div className="text-center py-12 col-span-full">
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
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal 
        open={clientModalOpen} 
        onOpenChange={handleModalClose}
        client={selectedClient || undefined}
      />
    </Navigation>
  );
}
