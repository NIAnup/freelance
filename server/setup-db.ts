import { db } from "./db";
import { users } from "@shared/schema";

async function setupDatabase() {
  try {
    // Check if user already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Default user already exists');
      return;
    }

    // Create default user
    const [user] = await db.insert(users).values({
      username: 'demo',
      password: 'demo123', // In production, this should be hashed
      name: 'Demo User',
      email: 'demo@freelanceflow.com',
      avatar: null,
      createdAt: new Date(),
    }).returning();
    
    console.log('Created default user:', user);
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();