import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoryViewerProvider } from "@/contexts/StoryViewerContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationListener } from "@/hooks/usePushNotifications";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SkeletonPage } from "@/components/ui/SkeletonCard";

// Lazy-loaded route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Search = lazy(() => import("./pages/Search"));
const Explore = lazy(() => import("./pages/Explore"));
const Messages = lazy(() => import("./pages/Messages"));
const Create = lazy(() => import("./pages/Create"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Banned = lazy(() => import("./pages/Banned"));
const Settings = lazy(() => import("./pages/Settings"));
const Post = lazy(() => import("./pages/Post"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Component that sets up notification listener
const NotificationSetup = ({ children }: { children: React.ReactNode }) => {
  useNotificationListener();
  useLocationPermission();
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper component to check ban status
const BanCheck = ({ children }: { children: React.ReactNode }) => {
  const { isBanned, loading, user } = useAuth();
  
  if (loading) return null;
  if (user && isBanned) return <Navigate to="/banned" replace />;
  
  return <>{children}</>;
};

// Wrapper for auth required routes
const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
};

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>
    {children}
  </Suspense>
);

const AppRoutes = () => {
  const { isBanned, user } = useAuth();
  
  return (
    <Routes>
      <Route path="/banned" element={<SuspenseWrapper>{user && isBanned ? <Banned /> : <Navigate to="/" replace />}</SuspenseWrapper>} />
      <Route path="/auth" element={<SuspenseWrapper><Auth /></SuspenseWrapper>} />
      <Route path="/" element={<AuthRequired><BanCheck><SuspenseWrapper><Index /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/profile" element={<AuthRequired><BanCheck><SuspenseWrapper><Profile /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/profile/:username" element={<AuthRequired><BanCheck><SuspenseWrapper><Profile /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/search" element={<AuthRequired><BanCheck><SuspenseWrapper><Search /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/explore" element={<AuthRequired><BanCheck><SuspenseWrapper><Explore /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/messages" element={<AuthRequired><BanCheck><SuspenseWrapper><Messages /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/create" element={<AuthRequired><BanCheck><SuspenseWrapper><Create /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/notifications" element={<AuthRequired><BanCheck><SuspenseWrapper><Notifications /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/admin" element={<AuthRequired><BanCheck><SuspenseWrapper><Admin /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/settings" element={<AuthRequired><BanCheck><SuspenseWrapper><Settings /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="/post/:postId" element={<AuthRequired><BanCheck><SuspenseWrapper><Post /></SuspenseWrapper></BanCheck></AuthRequired>} />
      <Route path="*" element={<SuspenseWrapper><NotFound /></SuspenseWrapper>} />
    </Routes>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <StoryViewerProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <NotificationSetup>
                    <AppRoutes />
                  </NotificationSetup>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </StoryViewerProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
