import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import NotFound from "@/pages/not-found";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Layout from "./components/layout";

import Search from "./pages/buyer/search";
import ListingDetail from "./pages/buyer/listing-detail";
import Deals from "./pages/buyer/deals";
import BuyerAnalytics from "./pages/buyer/analytics";

import Dashboard from "./pages/seller/dashboard";
import Products from "./pages/seller/products";
import Staff from "./pages/seller/staff";

import Chats from "./pages/shared/chats";
import News from "./pages/shared/news";
import Subscription from "./pages/shared/subscription";
import Settings from "./pages/shared/settings";

import AdminHome from "./pages/admin/home";
import AdminUsers from "./pages/admin/users";
import AdminProducts from "./pages/admin/products";
import AdminDevs from "./pages/admin/devs";
import AdminConsole from "./pages/admin/console";
import AdminAudit from "./pages/admin/audit";
import AdminServers from "./pages/admin/servers";
import AdminCode from "./pages/admin/code";
import AdminSellerHistory from "./pages/admin/seller-history";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
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

const ADMIN_ROLES = ["developer", "support"];

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/search">
              <ProtectedRoute component={Search} allowedRoles={["buyer", "developer", "support"]} />
            </Route>
            <Route path="/listing/:id">
              <ProtectedRoute component={ListingDetail} allowedRoles={["buyer", "developer", "support"]} />
            </Route>
            <Route path="/deals">
              <ProtectedRoute component={Deals} allowedRoles={["buyer", "developer", "support"]} />
            </Route>
            <Route path="/analytics">
              <ProtectedRoute component={BuyerAnalytics} allowedRoles={["buyer", "developer", "support"]} />
            </Route>

            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} allowedRoles={["seller", "developer", "support"]} />
            </Route>
            <Route path="/products">
              <ProtectedRoute component={Products} allowedRoles={["seller", "developer", "support"]} />
            </Route>
            <Route path="/staff">
              <ProtectedRoute component={Staff} allowedRoles={["seller", "developer", "support"]} />
            </Route>

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

            <Route path="/admin">
              <ProtectedRoute component={AdminHome} allowedRoles={ADMIN_ROLES} />
            </Route>
            <Route path="/admin/users">
              <ProtectedRoute component={AdminUsers} allowedRoles={ADMIN_ROLES} />
            </Route>
            <Route path="/admin/products">
              <ProtectedRoute component={AdminProducts} allowedRoles={ADMIN_ROLES} />
            </Route>
            <Route path="/admin/devs">
              <ProtectedRoute component={AdminDevs} allowedRoles={["developer"]} />
            </Route>
            <Route path="/admin/console">
              <ProtectedRoute component={AdminConsole} allowedRoles={["developer"]} />
            </Route>
            <Route path="/admin/audit">
              <ProtectedRoute component={AdminAudit} allowedRoles={ADMIN_ROLES} />
            </Route>
            <Route path="/admin/servers">
              <ProtectedRoute component={AdminServers} allowedRoles={["developer"]} />
            </Route>
            <Route path="/admin/code">
              <ProtectedRoute component={AdminCode} allowedRoles={["developer"]} />
            </Route>
            <Route path="/admin/seller-history/:id">
              <ProtectedRoute component={AdminSellerHistory} allowedRoles={ADMIN_ROLES} />
            </Route>

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
