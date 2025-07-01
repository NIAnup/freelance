import { users, clients, invoices, expenses, payments, type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type Expense, type InsertExpense, type Payment, type InsertPayment, type ClientWithStats, type InvoiceWithClient, type DashboardStats } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Client methods
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: number): Promise<Client | undefined>;
  deleteClient(id: number, userId: number): Promise<boolean>;
  getClientsWithStats(userId: number): Promise<ClientWithStats[]>;

  // Invoice methods
  getInvoices(userId: number): Promise<InvoiceWithClient[]>;
  getInvoice(id: number, userId: number): Promise<InvoiceWithClient | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: number): Promise<Invoice | undefined>;
  deleteInvoice(id: number, userId: number): Promise<boolean>;

  // Expense methods
  getExpenses(userId: number): Promise<Expense[]>;
  getExpense(id: number, userId: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, userId: number): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: number): Promise<boolean>;

  // Payment methods
  getPayments(userId: number): Promise<Payment[]>;
  getPayment(id: number, userId: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>, userId: number): Promise<Payment | undefined>;

  // Dashboard methods
  getDashboardStats(userId: number): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private clients: Map<number, Client> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private payments: Map<number, Payment> = new Map();
  private currentUserId = 1;
  private currentClientId = 1;
  private currentInvoiceId = 1;
  private currentExpenseId = 1;
  private currentPaymentId = 1;

  constructor() {
    // Create a default user
    const defaultUser: User = {
      id: 1,
      username: "alex",
      password: "password123",
      name: "Alex Johnson",
      email: "alex@freelanceflow.app",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      createdAt: new Date(),
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.userId === userId);
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const client = this.clients.get(id);
    return client?.userId === userId ? client : undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>, userId: number): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client || client.userId !== userId) return undefined;
    
    const updatedClient = { ...client, ...updateData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number, userId: number): Promise<boolean> {
    const client = this.clients.get(id);
    if (!client || client.userId !== userId) return false;
    
    return this.clients.delete(id);
  }

  async getClientsWithStats(userId: number): Promise<ClientWithStats[]> {
    const userClients = await this.getClients(userId);
    const userInvoices = await this.getInvoices(userId);
    
    return userClients.map(client => {
      const clientInvoices = userInvoices.filter(invoice => invoice.clientId === client.id);
      const totalRevenue = clientInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
      const projectCount = clientInvoices.length;
      const lastInvoiceDate = clientInvoices.length > 0 
        ? Math.max(...clientInvoices.map(invoice => new Date(invoice.issueDate).getTime()))
        : undefined;
      
      return {
        ...client,
        totalRevenue,
        projectCount,
        lastInvoiceDate: lastInvoiceDate ? new Date(lastInvoiceDate).toISOString() : undefined,
      };
    });
  }

  // Invoice methods
  async getInvoices(userId: number): Promise<InvoiceWithClient[]> {
    const userInvoices = Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
    const userClients = await this.getClients(userId);
    
    return userInvoices.map(invoice => {
      const client = userClients.find(c => c.id === invoice.clientId)!;
      return { ...invoice, client };
    });
  }

  async getInvoice(id: number, userId: number): Promise<InvoiceWithClient | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.userId !== userId) return undefined;
    
    const client = this.clients.get(invoice.clientId);
    if (!client) return undefined;
    
    return { ...invoice, client };
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      createdAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>, userId: number): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.userId !== userId) return undefined;
    
    const updatedInvoice = { ...invoice, ...updateData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number, userId: number): Promise<boolean> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.userId !== userId) return false;
    
    return this.invoices.delete(id);
  }

  // Expense methods
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async getExpense(id: number, userId: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    return expense?.userId === userId ? expense : undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = {
      ...insertExpense,
      id,
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>, userId: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense || expense.userId !== userId) return undefined;
    
    const updatedExpense = { ...expense, ...updateData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number, userId: number): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense || expense.userId !== userId) return false;
    
    return this.expenses.delete(id);
  }

  // Payment methods
  async getPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }

  async getPayment(id: number, userId: number): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    return payment?.userId === userId ? payment : undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, updateData: Partial<InsertPayment>, userId: number): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment || payment.userId !== userId) return undefined;
    
    const updatedPayment = { ...payment, ...updateData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Dashboard methods
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const userInvoices = Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
    const userExpenses = await this.getExpenses(userId);
    const userClients = await this.getClients(userId);
    const topClients = await this.getClientsWithStats(userId);

    // Calculate total earnings (paid invoices)
    const totalEarnings = userInvoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

    // Calculate pending payments
    const pendingPayments = userInvoices
      .filter(invoice => invoice.status === 'Sent' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

    // Calculate monthly expenses (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = userExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Active clients
    const activeClients = userClients.filter(client => client.status === 'Active').length;

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const monthNum = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = userInvoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate.getMonth() === monthNum && 
                 invoiceDate.getFullYear() === year && 
                 invoice.status === 'Paid';
        })
        .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
      
      monthlyRevenue.push({ month, revenue: monthRevenue });
    }

    return {
      totalEarnings,
      pendingPayments,
      monthlyExpenses,
      activeClients,
      monthlyRevenue,
      topClients: topClients.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
    };
  }
}

export const storage = new MemStorage();
