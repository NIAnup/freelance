import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, TrendingDown, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@shared/schema";

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Earnings",
      value: formatCurrency(stats.totalEarnings),
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: DollarSign,
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(stats.pendingPayments),
      change: "5 invoices pending",
      changeType: "neutral" as const,
      icon: Clock,
      bgColor: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(stats.monthlyExpenses),
      change: "-8.2% from last month",
      changeType: "positive" as const,
      icon: TrendingDown,
      bgColor: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      change: "3 new this month",
      changeType: "positive" as const,
      icon: Users,
      bgColor: "bg-primary-100 dark:bg-primary-900/50",
      iconColor: "text-primary-600 dark:text-primary-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className={`text-sm mt-1 flex items-center ${
                  card.changeType === 'positive' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : card.changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {card.changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {card.changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {card.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
