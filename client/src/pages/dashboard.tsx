import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
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
      <Navigation>
        <div className="p-6">
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
      </Navigation>
    );
  }

  if (!stats) {
    return (
      <Navigation>
        <div className="flex h-96 items-center justify-center">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Welcome back! Here's your financial overview.</p>
          </div>

          <StatsCards stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="lg:col-span-2">
              <RevenueChart stats={stats} />
            </div>
            <div className="lg:col-span-1">
              <TopClients clients={stats.topClients} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <RecentInvoices invoices={recentInvoices} />
            <QuickActions
              onNewInvoice={() => setInvoiceModalOpen(true)}
              onAddClient={() => setClientModalOpen(true)}
              onLogExpense={() => setExpenseModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientModal open={clientModalOpen} onOpenChange={setClientModalOpen} />
      <InvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
      <ExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
    </Navigation>
  );
}
