import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Invoices from "@/pages/invoices";
import Expenses from "@/pages/expenses";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import LandingPage from "@/pages/landing";
import SigninPage from "@/pages/signin";
import SignupPage from "@/pages/signup";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={isAuthenticated ? Dashboard : LandingPage} />
      <Route path="/signin" component={SigninPage} />
      <Route path="/signup" component={SignupPage} />
      
      {/* Protected routes - Always define all routes */}
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : SigninPage} />
      <Route path="/clients" component={isAuthenticated ? Clients : SigninPage} />
      <Route path="/invoices" component={isAuthenticated ? Invoices : SigninPage} />
      <Route path="/expenses" component={isAuthenticated ? Expenses : SigninPage} />
      <Route path="/payments" component={isAuthenticated ? Payments : SigninPage} />
      <Route path="/reports" component={isAuthenticated ? Reports : SigninPage} />
      <Route path="/profile" component={isAuthenticated ? ProfilePage : SigninPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="freelanceflow-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
