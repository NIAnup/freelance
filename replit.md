# FreelanceFlow - Freelancer Finance & Payment Manager

## Overview

FreelanceFlow is a comprehensive full-stack web application designed to help freelancers manage their finances, track earnings, handle client relationships, generate invoices, and monitor expenses. The application provides a modern, intuitive interface for solopreneurs and small agencies to streamline their financial operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Driver**: Neon Database serverless driver
- **Storage**: DatabaseStorage class with full PostgreSQL integration
- **PDF Generation**: Custom PDF generation service for invoices

### Project Structure
- `client/` - Frontend React application
- `server/` - Backend Express API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### 1. Client Management Module
- CRUD operations for client data
- Client status tracking (Active/Inactive)
- Revenue statistics per client
- Contact information management

### 2. Invoice Management System
- Invoice generation with unique numbering
- Status tracking (Draft, Sent, Paid, Overdue)
- PDF generation and download
- Client-invoice relationships

### 3. Expense Tracking
- Categorized expense logging
- Receipt upload capability
- Multi-currency support
- Date-based filtering

### 4. Payment Processing
- Payment status monitoring
- Invoice-payment linking
- Multiple payment methods support
- Payment history tracking

### 5. Dashboard & Analytics
- Revenue overview with charts
- Monthly statistics
- Top clients analysis
- Quick action buttons

### 6. Reporting System
- Financial reports generation
- Export capabilities (PDF/Excel)
- Profit/loss calculations
- Tax reporting features

## Data Flow

1. **User Interaction**: Users interact with React components in the frontend
2. **API Communication**: TanStack Query manages API calls to Express backend
3. **Data Validation**: Zod schemas validate data on both client and server
4. **Database Operations**: Drizzle ORM handles PostgreSQL interactions
5. **Real-time Updates**: Query invalidation ensures fresh data across components

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured for Neon serverless)
- **Drizzle ORM**: Type-safe database operations
- **Connection**: Environment variable `DATABASE_URL` required

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Consistent iconography
- **Recharts**: Chart visualization

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Development
- Frontend served by Vite dev server
- Backend runs on Express with hot reload
- In-memory storage for rapid prototyping

### Production Build
- Frontend: `vite build` outputs to `dist/public`
- Backend: `esbuild` bundles server code to `dist/index.js`
- Static file serving integrated with Express

### Database Setup
- **Database**: PostgreSQL with persistent storage
- **Migrations**: `npm run db:push`
- **Schema**: `shared/schema.ts` with full relations
- **Initial User**: Demo user (demo/demo123) created automatically
- **Connection**: Managed via DATABASE_URL environment variable

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment detection (development/production)

## Changelog

```
Changelog:
- July 01, 2025. Initial setup with in-memory storage
- July 01, 2025. Added PostgreSQL database integration with full persistence
  - Created DatabaseStorage class replacing MemStorage
  - Added database schema with proper relations between all entities
  - Set up demo user and sample data for testing
  - All financial data now persists between sessions
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```