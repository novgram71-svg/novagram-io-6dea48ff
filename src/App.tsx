import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Messages from "./pages/Messages";
import Create from "./pages/Create";
import Notifications from "./pages/Notifications";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Banned from "./pages/Banned";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to check ban status
const BanCheck = ({ children }: { children: React.ReactNode }) => {
  const { isBanned, loading, user } = useAuth();
  
  if (loading) return null;
  if (user && isBanned) return <Navigate to="/banned" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isBanned, user } = useAuth();
  
  return (
    <Routes>
      <Route path="/banned" element={user && isBanned ? <Banned /> : <Navigate to="/" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<BanCheck><Index /></BanCheck>} />
      <Route path="/profile" element={<BanCheck><Profile /></BanCheck>} />
      <Route path="/profile/:username" element={<BanCheck><Profile /></BanCheck>} />
      <Route path="/search" element={<BanCheck><Search /></BanCheck>} />
      <Route path="/messages" element={<BanCheck><Messages /></BanCheck>} />
      <Route path="/create" element={<BanCheck><Create /></BanCheck>} />
      <Route path="/notifications" element={<BanCheck><Notifications /></BanCheck>} />
      <Route path="/admin" element={<BanCheck><Admin /></BanCheck>} />
      <Route path="/settings" element={<BanCheck><Settings /></BanCheck>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
