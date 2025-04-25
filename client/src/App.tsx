import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Checkout from "@/pages/Checkout";
import OrderStatus from "@/pages/OrderStatus";
import OrderSuccess from "@/pages/OrderSuccess";
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Settings from "@/pages/admin/Settings";
import { useAuth } from "./contexts/AuthContext";
import AdminLayout from "./components/AdminLayout";

function Router() {
  const { isAdmin } = useAuth();
  const [location] = useLocation();
  
  // Check if we're in an admin route
  const isAdminRoute = location.startsWith("/admin");
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-status" component={OrderStatus} />
      <Route path="/order-success" component={OrderSuccess} />
      
      {/* Admin routes - protected */}
      <Route path="/admin">
        {isAdmin ? (
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={Dashboard} />
              <Route path="/admin/orders" component={Orders} />
              <Route path="/admin/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
