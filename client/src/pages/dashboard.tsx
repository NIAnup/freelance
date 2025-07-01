import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import TopClients from "@/components/dashboard/top-clients";
import RecentInvoices from "@/components/dashboard/recent-invoices";
import QuickActions from "@/components/dashboard/quick-actions";
import ClientModal from "@/components/modals/client-modal";
import InvoiceModal from "@/components/modals/invoice-modal";
import ExpenseModal from "@/components/modals/expense-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats, InvoiceWithClient } from "@shared/schema";

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ["/api/invoices"],
  });

  if (statsLoading) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Skeleton className="xl:col-span-2 h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
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
          title="Dashboard" 
          description="Welcome back! Here's your financial overview."
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <RevenueChart stats={stats} />
            <TopClients clients={stats.topClients} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <RecentInvoices invoices={recentInvoices} />
            <QuickActions
              onNewInvoice={() => setInvoiceModalOpen(true)}
              onAddClient={() => setClientModalOpen(true)}
              onLogExpense={() => setExpenseModalOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <ClientModal open={clientModalOpen} onOpenChange={setClientModalOpen} />
      <InvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
      <ExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </div>
  );
}
