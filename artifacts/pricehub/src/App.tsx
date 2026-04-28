import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Layout from "./components/layout";

import Search from "./pages/buyer/search";
import ListingDetail from "./pages/buyer/listing-detail";
import Deals from "./pages/buyer/deals";

import Dashboard from "./pages/seller/dashboard";
import Products from "./pages/seller/products";

import Chats from "./pages/shared/chats";
import News from "./pages/shared/news";
import Subscription from "./pages/shared/subscription";
import Settings from "./pages/shared/settings";

// Placeholder for Admin components
const Placeholder = () => <div className="p-8 text-center text-muted-foreground">В разработке (Admin Module)</div>;

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    setLocation("/");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/:rest*">
        <Layout>
          <Switch>
            {/* Buyer Routes */}
            <Route path="/search">
              <ProtectedRoute component={Search} allowedRoles={["buyer", "developer", "support"]} />
            </Route>
            <Route path="/listing/:id">
              <ProtectedRoute component={ListingDetail} allowedRoles={["buyer", "developer", "support"]} />
            </Route>
            <Route path="/deals">
              <ProtectedRoute component={Deals} allowedRoles={["buyer", "developer", "support"]} />
            </Route>

            {/* Seller Routes */}
            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} allowedRoles={["seller", "developer", "support"]} />
            </Route>
            <Route path="/products">
              <ProtectedRoute component={Products} allowedRoles={["seller", "developer", "support"]} />
            </Route>

            {/* Shared Authenticated Routes */}
            <Route path="/chats">
              <ProtectedRoute component={Chats} />
            </Route>
            <Route path="/news">
              <ProtectedRoute component={News} />
            </Route>
            <Route path="/subscription">
              <ProtectedRoute component={Subscription} />
            </Route>
            <Route path="/settings">
              <ProtectedRoute component={Settings} />
            </Route>

            {/* Admin Routes - Managed by another subagent */}
            <Route path="/admin" component={Placeholder} />
            <Route path="/admin/users" component={Placeholder} />
            <Route path="/admin/products" component={Placeholder} />
            <Route path="/admin/devs" component={Placeholder} />
            <Route path="/admin/console" component={Placeholder} />
            <Route path="/admin/audit" component={Placeholder} />
            <Route path="/admin/servers" component={Placeholder} />
            <Route path="/admin/code" component={Placeholder} />
            <Route path="/admin/seller-history/:id" component={Placeholder} />

            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;