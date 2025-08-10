import type { 
  User, InsertUser, Client, InsertClient, Invoice, InsertInvoice, 
  Expense, InsertExpense, Payment, InsertPayment, ClientWithStats, 
  InvoiceWithClient, DashboardStats 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

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

// Database imports
import { users, clients, invoices, expenses, payments } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        avatar: insertUser.avatar || null,
        createdAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getClients(userId: number): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values({
        ...insertClient,
        contactPerson: insertClient.contactPerson || null,
        email: insertClient.email || null,
        phone: insertClient.phone || null,
        address: insertClient.address || null,
        paymentTerms: insertClient.paymentTerms || null,
        status: insertClient.status || null,
        createdAt: new Date(),
      })
      .returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>, userId: number): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getClientsWithStats(userId: number): Promise<ClientWithStats[]> {
    const clientsWithStats = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        companyName: clients.companyName,
        contactPerson: clients.contactPerson,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        paymentTerms: clients.paymentTerms,
        status: clients.status,
        createdAt: clients.createdAt,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'Paid' THEN ${invoices.amount}::numeric ELSE 0 END), 0)`,
        projectCount: count(invoices.id),
      })
      .from(clients)
      .leftJoin(invoices, eq(clients.id, invoices.clientId))
      .where(eq(clients.userId, userId))
      .groupBy(clients.id);

    return clientsWithStats.map(client => ({
      ...client,
      totalRevenue: Number(client.totalRevenue),
      projectCount: Number(client.projectCount),
    }));
  }

  async getInvoices(userId: number): Promise<InvoiceWithClient[]> {
    return await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        description: invoices.description,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        items: invoices.items,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          companyName: clients.companyName,
          contactPerson: clients.contactPerson,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          paymentTerms: clients.paymentTerms,
          status: clients.status,
          createdAt: clients.createdAt,
        },
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number, userId: number): Promise<InvoiceWithClient | undefined> {
    const [invoice] = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        description: invoices.description,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        items: invoices.items,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          companyName: clients.companyName,
          contactPerson: clients.contactPerson,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          paymentTerms: clients.paymentTerms,
          status: clients.status,
          createdAt: clients.createdAt,
        },
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...insertInvoice,
        description: insertInvoice.description || null,
        currency: insertInvoice.currency || null,
        status: insertInvoice.status || null,
        paidDate: insertInvoice.paidDate || null,
        items: insertInvoice.items || null,
        createdAt: new Date(),
      })
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>, userId: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(updateData)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date));
  }

  async getExpense(id: number, userId: number): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values({
        ...insertExpense,
        currency: insertExpense.currency || null,
        receipt: insertExpense.receipt || null,
        notes: insertExpense.notes || null,
        createdAt: new Date(),
      })
      .returning();
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>, userId: number): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set(updateData)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return expense || undefined;
  }

  async deleteExpense(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getPayments(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number, userId: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, userId)));
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values({
        ...insertPayment,
        method: insertPayment.method || null,
        status: insertPayment.status || null,
        currency: insertPayment.currency || null,
        receivedDate: insertPayment.receivedDate || null,
        createdAt: new Date(),
      })
      .returning();
    return payment;
  }

  async updatePayment(id: number, updateData: Partial<InsertPayment>, userId: number): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(and(eq(payments.id, id), eq(payments.userId, userId)))
      .returning();
    return payment || undefined;
  }

  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const [stats] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'Paid' THEN ${invoices.amount}::numeric ELSE 0 END), 0)`,
        pendingPayments: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('Sent', 'Overdue') THEN ${invoices.amount}::numeric ELSE 0 END), 0)`,
        monthlyExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${expenses.date} >= date_trunc('month', CURRENT_DATE) THEN ${expenses.amount}::numeric ELSE 0 END), 0)`,
        activeClients: sql<number>`COUNT(DISTINCT ${clients.id})`,
      })
      .from(users)
      .leftJoin(invoices, eq(users.id, invoices.userId))
      .leftJoin(expenses, eq(users.id, expenses.userId))
      .leftJoin(clients, eq(users.id, clients.userId))
      .where(eq(users.id, userId));

    // Get monthly revenue data for the chart
    const monthlyRevenue = await db
      .select({
        month: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`,
        revenue: sql<number>`SUM(${invoices.amount}::numeric)`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        sql`${invoices.issueDate} >= date_trunc('month', CURRENT_DATE) - interval '11 months'`
      ))
      .groupBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${invoices.issueDate}, 'YYYY-MM')`);

    // Get top clients
    const topClients = await this.getClientsWithStats(userId);

    return {
      totalEarnings: Number(stats?.totalEarnings || 0),
      pendingPayments: Number(stats?.pendingPayments || 0),
      monthlyExpenses: Number(stats?.monthlyExpenses || 0),
      activeClients: Number(stats?.activeClients || 0),
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.month,
        revenue: Number(item.revenue),
      })),
      topClients: topClients.slice(0, 5),
    };
  }
}

export const storage = new DatabaseStorage();