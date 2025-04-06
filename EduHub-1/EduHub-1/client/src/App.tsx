import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import { DemoProvider } from "@/context/DemoContext";
import Login from "@/pages/auth/Login";
import Home from "@/pages/dashboard/Home";
import Videos from "@/pages/dashboard/Videos";
import Messaging from "@/pages/dashboard/Messaging";
import Books from "@/pages/dashboard/Books";
import Profile from "@/pages/dashboard/Profile";
import DemoModeTimer from "@/components/auth/DemoModeTimer";
import { useAuth } from "@/context/AuthContext";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/videos">
        {() => <ProtectedRoute component={Videos} />}
      </Route>
      <Route path="/messaging">
        {() => <ProtectedRoute component={Messaging} />}
      </Route>
      <Route path="/books">
        {() => <ProtectedRoute component={Books} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <>
      <Router />
      <DemoModeTimer />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoProvider>
          <AppContent />
        </DemoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
