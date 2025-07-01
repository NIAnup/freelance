import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { ClientWithStats } from "@shared/schema";

interface TopClientsProps {
  clients: ClientWithStats[];
}

export default function TopClients({ clients }: TopClientsProps) {
  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
      "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
      "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
      "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
      "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400",
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.slice(0, 5).map((client, index) => (
            <div key={client.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(index)}>
                    {getInitials(client.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{client.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.projectCount} project{client.projectCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(client.totalRevenue)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">+15%</p>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No clients yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
