import { db } from "./db";
import { users, clients, invoices, expenses, payments } from "@shared/schema";

async function seedDatabase() {
  try {
    const userId = 1; // Our demo user

    // Create sample clients
    const [client1] = await db.insert(clients).values({
      userId: userId,
      companyName: "Tech Solutions Inc",
      contactPerson: "John Smith",
      email: "john@techsolutions.com",
      phone: "+1-555-0123",
      address: "123 Tech Street, San Francisco, CA 94105",
      paymentTerms: "Net 30",
      status: "Active",
      createdAt: new Date(),
    }).returning();

    const [client2] = await db.insert(clients).values({
      userId: userId,
      companyName: "Digital Marketing Pro",
      contactPerson: "Sarah Johnson",
      email: "sarah@digitalmarketing.com",
      phone: "+1-555-0456",
      address: "456 Marketing Ave, New York, NY 10001",
      paymentTerms: "Net 15",
      status: "Active",
      createdAt: new Date(),
    }).returning();

    // Create sample invoices
    const [invoice1] = await db.insert(invoices).values({
      userId: userId,
      clientId: client1.id,
      invoiceNumber: "INV-2025-001",
      title: "Website Development Project",
      description: "Full-stack web development for e-commerce platform",
      amount: "5000.00",
      currency: "USD",
      status: "Paid",
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-31'),
      paidDate: new Date('2025-01-25'),
      items: JSON.stringify([
        { description: "Frontend Development", quantity: 1, rate: 3000.00, amount: 3000.00 },
        { description: "Backend API Development", quantity: 1, rate: 2000.00, amount: 2000.00 }
      ]),
      createdAt: new Date(),
    }).returning();

    await db.insert(invoices).values({
      userId: userId,
      clientId: client2.id,
      invoiceNumber: "INV-2025-002",
      title: "Digital Marketing Campaign",
      description: "SEO optimization and social media marketing",
      amount: "2500.00",
      currency: "USD",
      status: "Sent",
      issueDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      paidDate: null,
      items: JSON.stringify([
        { description: "SEO Audit & Strategy", quantity: 1, rate: 1500.00, amount: 1500.00 },
        { description: "Social Media Management", quantity: 1, rate: 1000.00, amount: 1000.00 }
      ]),
      createdAt: new Date(),
    });

    // Create sample expenses
    await db.insert(expenses).values({
      userId: userId,
      date: new Date('2025-01-10'),
      description: "Adobe Creative Suite Subscription",
      amount: "52.99",
      category: "Software",
      currency: "USD",
      receipt: null,
      notes: "Monthly subscription for design tools",
      createdAt: new Date(),
    });

    await db.insert(expenses).values({
      userId: userId,
      date: new Date('2025-01-15'),
      description: "Coffee Meeting with Client",
      amount: "25.50",
      category: "Business Meals",
      currency: "USD",
      receipt: null,
      notes: "Project discussion meeting",
      createdAt: new Date(),
    });

    await db.insert(expenses).values({
      userId: userId,
      date: new Date('2025-01-20'),
      description: "Domain Registration",
      amount: "15.99",
      category: "Business Services",
      currency: "USD",
      receipt: null,
      notes: "Annual domain renewal for client project",
      createdAt: new Date(),
    });

    // Create sample payment
    await db.insert(payments).values({
      userId: userId,
      clientId: client1.id,
      invoiceId: invoice1.id,
      amount: "5000.00",
      method: "Bank Transfer",
      status: "Completed",
      currency: "USD",
      receivedDate: new Date('2025-01-25'),
      createdAt: new Date(),
    });

    console.log('Sample data created successfully!');
    console.log('- 2 clients');
    console.log('- 2 invoices');
    console.log('- 3 expenses');
    console.log('- 1 payment');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();