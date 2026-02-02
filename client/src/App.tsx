import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Readings from "./pages/Readings";
import Statistics from "./pages/Statistics";
import { Button } from "./components/ui/button";
import { Home, BookOpen, BarChart3 } from "lucide-react";

function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/readings", label: "القراءات", icon: BookOpen },
    { path: "/statistics", label: "الإحصائيات", icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg md:relative md:border-0 md:shadow-none z-50">
      <div className="container">
        <div className="flex justify-around md:justify-start md:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`flex-col md:flex-row gap-1 h-auto py-2 px-4 ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs md:text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="hidden md:block">
        <Navigation />
      </div>
      
      <div className="flex-1 pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/readings" component={Readings} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
