import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertExpenseSchema, insertPaymentSchema } from "@shared/schema";
import { generateInvoicePDF } from "./services/pdf-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  const currentUserId = 1; // For demo purposes, using fixed user ID

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients(currentUserId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/with-stats", async (req, res) => {
    try {
      const clients = await storage.getClientsWithStats(currentUserId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client stats" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse({ ...req.body, userId: currentUserId });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const client = await storage.updateClient(id, updateData, currentUserId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id, currentUserId);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete client" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices(currentUserId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, currentUserId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, userId: currentUserId });
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const invoice = await storage.updateInvoice(id, updateData, currentUserId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Failed to update invoice" });
    }
  });

  app.get("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, currentUserId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      const pdfBuffer = await generateInvoicePDF(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses(currentUserId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({ ...req.body, userId: currentUserId });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const expense = await storage.updateExpense(id, updateData, currentUserId);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id, currentUserId);
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete expense" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments(currentUserId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({ ...req.body, userId: currentUserId });
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(currentUserId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // AI Assistant route
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ 
          error: 'AI Assistant not configured. Please add PERPLEXITY_API_KEY to environment variables.' 
        });
      }
      
      // Get user's financial data for context
      const [stats, invoices, expenses, clients] = await Promise.all([
        storage.getDashboardStats(currentUserId),
        storage.getInvoices(currentUserId),
        storage.getExpenses(currentUserId),
        storage.getClientsWithStats(currentUserId)
      ]);
      
      const systemPrompt = `You are a helpful AI finance assistant for a freelancer. You have access to their financial data:
      
      Financial Summary:
      - Total Earnings: $${stats.totalEarnings}
      - Pending Payments: $${stats.pendingPayments}
      - Monthly Expenses: $${stats.monthlyExpenses}
      - Active Clients: ${stats.activeClients}
      
      Top Clients: ${clients.slice(0, 3).map(c => `${c.companyName} ($${c.totalRevenue})`).join(', ')}
      
      Recent Invoices: ${invoices.slice(0, 5).map(i => `${i.invoiceNumber} - ${i.client.companyName}: $${i.amount} (${i.status})`).join(', ')}
      
      Recent Expenses: ${expenses.slice(0, 5).map(e => `${e.description}: $${e.amount} (${e.category})`).join(', ')}
      
      Answer questions about their business finances, provide insights, and give actionable advice. Be concise and helpful.`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.2,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';
      
      res.json({ response: aiResponse });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to get AI response. Please make sure the Perplexity API key is configured.' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
