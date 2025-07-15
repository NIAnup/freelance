import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, DollarSign, FileText, TrendingUp, Users, Bot, Shield, Zap } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: FileText,
      title: "Smart Invoice Management",
      description: "Create, send, and track invoices with automated reminders and payment tracking."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Organize client information, track project history, and analyze revenue per client."
    },
    {
      icon: TrendingUp,
      title: "Financial Analytics",
      description: "Get insights into your business with detailed reports and profit analysis."
    },
    {
      icon: DollarSign,
      title: "Expense Tracking",
      description: "Monitor business expenses by category with receipt uploads and tax reporting."
    },
    {
      icon: Bot,
      title: "AI Finance Assistant",
      description: "Get instant answers about your finances with our intelligent AI assistant."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with automatic backups and data protection."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for solo freelancers just getting started",
      features: [
        "Up to 5 clients",
        "10 invoices per month",
        "Basic expense tracking",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$15",
      period: "/month",
      description: "Ideal for growing freelance businesses",
      features: [
        "Unlimited clients",
        "Unlimited invoices",
        "Advanced analytics",
        "AI Finance Assistant",
        "PDF reports",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Agency",
      price: "$39",
      period: "/month",
      description: "Built for agencies and teams",
      features: [
        "Everything in Professional",
        "Team collaboration",
        "Custom branding",
        "API access",
        "Dedicated support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <div className="mr-6 flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="font-bold">FreelanceFlow</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</a>
              <a href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</a>
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => window.location.href = '/api/login'}>
                Sign In
              </Button>
              <Button onClick={() => window.location.href = '/api/login'}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 mx-auto text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Finance Management
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Streamline Your
            <span className="text-primary"> Freelance Finances</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The complete financial management platform for freelancers and agencies. 
            Track earnings, manage clients, and grow your business with intelligent insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => window.location.href = '/api/login'}>
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-16 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything you need to manage your business</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From invoicing to analytics, FreelanceFlow provides all the tools you need to run a successful freelance business.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-none">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container px-4 py-16 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that's right for your business. Upgrade or downgrade at any time.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => window.location.href = '/api/login'}
                >
                  {plan.price === "Free" ? "Get Started" : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 mx-auto text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Ready to take control of your finances?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of freelancers who trust FreelanceFlow to manage their business finances.
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => window.location.href = '/api/login'}>
            Start Your Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">FreelanceFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 FreelanceFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}