import { formatCurrency, formatDate } from "@/lib/utils";
import type { 
  DashboardStats, 
  InvoiceWithClient, 
  Expense, 
  ClientWithStats, 
  Payment 
} from "@shared/schema";

export interface ReportData {
  stats: DashboardStats;
  invoices: InvoiceWithClient[];
  expenses: Expense[];
  clients: ClientWithStats[];
  payments: Payment[];
}

export function generateCSVReport(data: ReportData): string {
  const { stats, invoices, expenses, clients, payments } = data;
  
  let csv = "FreelanceFlow Financial Report\n\n";
  
  // Summary Stats
  csv += "FINANCIAL SUMMARY\n";
  csv += "Metric,Value\n";
  csv += `Total Earnings,${formatCurrency(stats.totalEarnings)}\n`;
  csv += `Pending Payments,${formatCurrency(stats.pendingPayments)}\n`;
  csv += `Monthly Expenses,${formatCurrency(stats.monthlyExpenses)}\n`;
  csv += `Active Clients,${stats.activeClients}\n\n`;
  
  // Invoices
  csv += "INVOICES\n";
  csv += "Invoice Number,Client,Title,Amount,Status,Issue Date,Due Date,Paid Date\n";
  invoices.forEach(invoice => {
    csv += `${invoice.invoiceNumber},"${invoice.client.companyName}","${invoice.title}",${formatCurrency(parseFloat(invoice.amount))},${invoice.status || 'Draft'},${formatDate(invoice.issueDate)},${formatDate(invoice.dueDate)},${invoice.paidDate ? formatDate(invoice.paidDate) : 'Not Paid'}\n`;
  });
  
  csv += "\nEXPENSES\n";
  csv += "Date,Description,Amount,Category,Notes\n";
  expenses.forEach(expense => {
    csv += `${formatDate(expense.date)},"${expense.description}",${formatCurrency(parseFloat(expense.amount))},"${expense.category}","${expense.notes || 'No notes'}"\n`;
  });
  
  // Clients
  csv += "\nCLIENTS\n";
  csv += "Company Name,Contact Person,Email,Phone,Total Revenue,Project Count,Status\n";
  clients.forEach(client => {
    csv += `"${client.companyName}","${client.contactPerson || 'Not specified'}","${client.email || 'Not specified'}","${client.phone || 'Not specified'}",${formatCurrency(client.totalRevenue)},${client.projectCount},"${client.status || 'Active'}"\n`;
  });
  
  // Payments
  csv += "\nPAYMENTS\n";
  csv += "Client,Amount,Method,Status,Received Date\n";
  payments.forEach(payment => {
    const client = clients.find(c => c.id === payment.clientId);
    csv += `"${client?.companyName || 'Unknown'}",${formatCurrency(parseFloat(payment.amount))},"${payment.method || 'Not specified'}","${payment.status || 'Pending'}",${payment.receivedDate ? formatDate(payment.receivedDate) : 'Not received'}\n`;
  });
  
  return csv;
}

export function downloadCSV(data: ReportData, filename: string = 'freelance-financial-report.csv') {
  const csv = generateCSVReport(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function generatePDFContent(data: ReportData): string {
  const { stats, invoices, expenses, clients } = data;
  
  return `
    <html>
      <head>
        <title>Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FreelanceFlow Financial Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2>Financial Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Earnings</h3>
              <p>${formatCurrency(stats.totalEarnings)}</p>
            </div>
            <div class="stat-card">
              <h3>Pending Payments</h3>
              <p>${formatCurrency(stats.pendingPayments)}</p>
            </div>
            <div class="stat-card">
              <h3>Monthly Expenses</h3>
              <p>${formatCurrency(stats.monthlyExpenses)}</p>
            </div>
            <div class="stat-card">
              <h3>Active Clients</h3>
              <p>${stats.activeClients}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Recent Invoices</h2>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.slice(0, 10).map(invoice => `
                <tr>
                  <td>${invoice.invoiceNumber}</td>
                  <td>${invoice.client.companyName}</td>
                  <td>${formatCurrency(parseFloat(invoice.amount))}</td>
                  <td>${invoice.status || 'Draft'}</td>
                  <td>${formatDate(invoice.dueDate)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Recent Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.slice(0, 10).map(expense => `
                <tr>
                  <td>${formatDate(expense.date)}</td>
                  <td>${expense.description}</td>
                  <td>${formatCurrency(parseFloat(expense.amount))}</td>
                  <td>${expense.category}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Top Clients</h2>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Total Revenue</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              ${clients.slice(0, 10).map(client => `
                <tr>
                  <td>${client.companyName}</td>
                  <td>${client.contactPerson || 'Not specified'}</td>
                  <td>${formatCurrency(client.totalRevenue)}</td>
                  <td>${client.projectCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
}

export function downloadPDF(data: ReportData, filename: string = 'freelance-financial-report.pdf') {
  const htmlContent = generatePDFContent(data);
  
  // Create a new window to print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Add event listener to print when loaded
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  } else {
    // Fallback: create a blob and download as HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.pdf', '.html'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}