import type { 
  User, InsertUser, UpsertUser, Client, InsertClient, Invoice, InsertInvoice, 
  Expense, InsertExpense, Payment, InsertPayment, ClientWithStats, 
  InvoiceWithClient, DashboardStats 
} from "@shared/schema";

export interface IStorage {
  // User methods - Replit Auth compatible
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client methods
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client | undefined>;
  deleteClient(id: number, userId: string): Promise<boolean>;
  getClientsWithStats(userId: string): Promise<ClientWithStats[]>;

  // Invoice methods
  getInvoices(userId: string): Promise<InvoiceWithClient[]>;
  getInvoice(id: number, userId: string): Promise<InvoiceWithClient | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number, userId: string): Promise<boolean>;

  // Expense methods
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: number, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, userId: string): Promise<Expense | undefined>;
  deleteExpense(id: number, userId: string): Promise<boolean>;

  // Payment methods
  getPayments(userId: string): Promise<Payment[]>;
  getPayment(id: number, userId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>, userId: string): Promise<Payment | undefined>;

  // Dashboard methods
  getDashboardStats(userId: string): Promise<DashboardStats>;
}

// Database imports
import { users, clients, invoices, expenses, payments } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Replit Auth compatible methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client methods
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getClientsWithStats(userId: string): Promise<ClientWithStats[]> {
    const clientsWithStats = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        name: clients.name,
        contactPerson: clients.contactPerson,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        paymentTerms: clients.paymentTerms,
        status: clients.status,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`,
        projectCount: sql<number>`COUNT(${invoices.id})`,
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

  // Invoice methods
  async getInvoices(userId: string): Promise<InvoiceWithClient[]> {
    const invoiceList = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        description: invoices.description,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          name: clients.name,
          contactPerson: clients.contactPerson,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          paymentTerms: clients.paymentTerms,
          status: clients.status,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    return invoiceList;
  }

  async getInvoice(id: number, userId: string): Promise<InvoiceWithClient | undefined> {
    const [invoice] = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        description: invoices.description,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          name: clients.name,
          contactPerson: clients.contactPerson,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          paymentTerms: clients.paymentTerms,
          status: clients.status,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
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
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Expense methods
  async getExpenses(userId: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.expenseDate));
  }

  async getExpense(id: number, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updateData: Partial<InsertExpense>, userId: string): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return expense || undefined;
  }

  async deleteExpense(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Payment methods
  async getPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.paymentDate));
  }

  async getPayment(id: number, userId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, userId)));
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: number, updateData: Partial<InsertPayment>, userId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(payments.id, id), eq(payments.userId, userId)))
      .returning();
    return payment || undefined;
  }

  // Dashboard methods
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get total earnings
    const totalEarningsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid")));

    // Get pending payments
    const pendingPaymentsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "sent")));

    // Get monthly expenses
    const monthlyExpensesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.expenseDate} >= date_trunc('month', current_date)`
      ));

    // Get active clients count
    const activeClientsResult = await db
      .select({
        count: count(),
      })
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.status, "active")));

    // Get monthly revenue for the last 6 months
    const monthlyRevenueResult = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, "paid"),
        sql`${invoices.issueDate} >= current_date - interval '6 months'`
      ))
      .groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);

    // Get top clients
    const topClientsResult = await db
      .select({
        id: clients.id,
        userId: clients.userId,
        name: clients.name,
        contactPerson: clients.contactPerson,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        paymentTerms: clients.paymentTerms,
        status: clients.status,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`,
        projectCount: sql<number>`COUNT(${invoices.id})`,
      })
      .from(clients)
      .leftJoin(invoices, eq(clients.id, invoices.clientId))
      .where(eq(clients.userId, userId))
      .groupBy(clients.id)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${invoices.amount} AS DECIMAL)), 0)`))
      .limit(5);

    return {
      totalEarnings: Number(totalEarningsResult[0]?.total || 0),
      pendingPayments: Number(pendingPaymentsResult[0]?.total || 0),
      monthlyExpenses: Number(monthlyExpensesResult[0]?.total || 0),
      activeClients: Number(activeClientsResult[0]?.count || 0),
      monthlyRevenue: monthlyRevenueResult.map(row => ({
        month: row.month,
        revenue: Number(row.revenue),
      })),
      topClients: topClientsResult.map(client => ({
        ...client,
        totalRevenue: Number(client.totalRevenue),
        projectCount: Number(client.projectCount),
      })),
    };
  }
}

export const storage = new DatabaseStorage();