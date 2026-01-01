import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MissingInfoDialog } from "@/components/auth/MissingInfoDialog";
import { useNotificationListener } from "@/hooks/usePushNotifications";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Create from "./pages/Create";
import Notifications from "./pages/Notifications";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Banned from "./pages/Banned";
import Settings from "./pages/Settings";
import Post from "./pages/Post";
import NotFound from "./pages/NotFound";

// Component that sets up notification listener
const NotificationSetup = ({ children }: { children: React.ReactNode }) => {
  useNotificationListener();
  return <>{children}</>;
};

const queryClient = new QueryClient();

// Wrapper component to check ban status
const BanCheck = ({ children }: { children: React.ReactNode }) => {
  const { isBanned, loading, user } = useAuth();
  
  if (loading) return null;
  if (user && isBanned) return <Navigate to="/banned" replace />;
  
  return <>{children}</>;
};

// Wrapper to check for missing info (phone number, security question)
const MissingInfoCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const [showMissingInfo, setShowMissingInfo] = useState(false);
  const [missingPhone, setMissingPhone] = useState(false);
  const [missingSecurityQuestion, setMissingSecurityQuestion] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkMissingInfo = async () => {
      if (!user || !profile) {
        setChecked(true);
        return;
      }

      // Check if profile has phone number
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      const hasPhone = !!profileData?.phone_number;

      // Check if user has security question
      const { data: securityData } = await supabase
        .from('security_questions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasSecurityQuestion = !!securityData;

      setMissingPhone(!hasPhone);
      setMissingSecurityQuestion(!hasSecurityQuestion);

      if (!hasPhone || !hasSecurityQuestion) {
        setShowMissingInfo(true);
      }

      setChecked(true);
    };

    checkMissingInfo();
  }, [user, profile]);

  const handleComplete = () => {
    setShowMissingInfo(false);
    setMissingPhone(false);
    setMissingSecurityQuestion(false);
  };

  if (!checked) return null;

  return (
    <>
      {children}
      <MissingInfoDialog
        open={showMissingInfo}
        missingPhone={missingPhone}
        missingSecurityQuestion={missingSecurityQuestion}
        onComplete={handleComplete}
      />
    </>
  );
};

// Wrapper for auth required routes
const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <MissingInfoCheck>{children}</MissingInfoCheck>;
};

const AppRoutes = () => {
  const { isBanned, user } = useAuth();
  
  return (
    <Routes>
      <Route path="/banned" element={user && isBanned ? <Banned /> : <Navigate to="/" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<AuthRequired><BanCheck><Index /></BanCheck></AuthRequired>} />
      <Route path="/profile" element={<AuthRequired><BanCheck><Profile /></BanCheck></AuthRequired>} />
      <Route path="/profile/:username" element={<AuthRequired><BanCheck><Profile /></BanCheck></AuthRequired>} />
      <Route path="/search" element={<AuthRequired><BanCheck><Search /></BanCheck></AuthRequired>} />
      <Route path="/explore" element={<AuthRequired><BanCheck><Explore /></BanCheck></AuthRequired>} />
      <Route path="/messages" element={<AuthRequired><BanCheck><Messages /></BanCheck></AuthRequired>} />
      <Route path="/create" element={<AuthRequired><BanCheck><Create /></BanCheck></AuthRequired>} />
      <Route path="/notifications" element={<AuthRequired><BanCheck><Notifications /></BanCheck></AuthRequired>} />
      <Route path="/admin" element={<AuthRequired><BanCheck><Admin /></BanCheck></AuthRequired>} />
      <Route path="/settings" element={<AuthRequired><BanCheck><Settings /></BanCheck></AuthRequired>} />
      <Route path="/post/:postId" element={<AuthRequired><BanCheck><Post /></BanCheck></AuthRequired>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationSetup>
              <AppRoutes />
            </NotificationSetup>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
