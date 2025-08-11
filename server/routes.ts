import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertExpenseSchema, insertPaymentSchema, signupSchema, signinSchema, profileUpdateSchema } from "@shared/schema";
import { generateInvoicePDF } from "./services/pdf-generator";

// Session middleware for authentication
let currentSession: { userId: number | null } = { userId: null };

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!currentSession.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.userId = currentSession.userId;
    next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Create user (in production, hash the password)
      const user = await storage.createUser({
        username: userData.username,
        password: userData.password, // In production, use bcrypt.hash(userData.password, 10)
        name: userData.name,
        email: userData.email,
        avatar: null,
      });

      // Auto-login after signup
      currentSession.userId = user.id;
      
      res.status(201).json({ 
        user: { id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar },
        message: "Account created successfully" 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid signup data" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const credentials = signinSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(credentials.username);
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Set session
      currentSession.userId = user.id;
      
      res.json({ 
        user: { id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar },
        message: "Signed in successfully" 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid signin data" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    currentSession.userId = null;
    res.json({ message: "Signed out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put("/api/auth/profile", requireAuth, async (req: any, res) => {
    try {
      const updateData = profileUpdateSchema.parse(req.body);
      const user = await storage.updateUser(req.userId, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update profile" });
    }
  });

  // Client routes
  app.get("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const clients = await storage.getClients(req.userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/with-stats", requireAuth, async (req: any, res) => {
    try {
      const clients = await storage.getClientsWithStats(req.userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client stats" });
    }
  });

  app.post("/api/clients", requireAuth, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.parse({ ...req.body, userId: req.userId });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const client = await storage.updateClient(id, updateData, req.userId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete client" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getInvoices(req.userId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, req.userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, userId: req.userId });
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Handle date fields properly
      if (updateData.issueDate) {
        updateData.issueDate = new Date(updateData.issueDate);
      }
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      if (updateData.paidDate) {
        updateData.paidDate = new Date(updateData.paidDate);
      }
      
      const invoice = await storage.updateInvoice(id, updateData, req.userId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      console.error("Invoice update error:", error);
      res.status(400).json({ error: error.message || "Failed to update invoice" });
    }
  });

  app.get("/api/invoices/:id/pdf", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, req.userId);
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
  app.get("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      const expenses = await storage.getExpenses(req.userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({ ...req.body, userId: req.userId });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const expense = await storage.updateExpense(id, updateData, req.userId);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id, req.userId);
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete expense" });
    }
  });

  // Payment routes
  app.get("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const payments = await storage.getPayments(req.userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({ ...req.body, userId: req.userId });
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.userId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats", details: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
