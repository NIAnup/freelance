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
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl">Recent Invoices</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8">View All</Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          {invoices.slice(0, 5).map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{invoice.client.companyName}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {formatCurrency(parseFloat(invoice.amount))}
                </p>
                <Badge variant="secondary" className={`text-xs ${getStatusColor(invoice.status || 'draft')} mt-1`}>
                  {invoice.status || 'draft'}
                </Badge>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No invoices yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
