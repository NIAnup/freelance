import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { InvoiceWithClient } from "@shared/schema";

interface RecentInvoicesProps {
  invoices: InvoiceWithClient[];
}

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.slice(0, 5).map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{invoice.client.companyName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(parseFloat(invoice.amount))}
                </p>
                <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
