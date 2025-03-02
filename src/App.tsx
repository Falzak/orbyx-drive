
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./integrations/supabase/client";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Share from "./pages/Share";
import NotFound from "./pages/NotFound";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import TwoFactor from "@/pages/TwoFactor";

const queryClient = new QueryClient();

type AuthContextType = {
  session: Session | null;
};

export const AuthContext = createContext<AuthContextType>({ session: null });

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const TwoFactorProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check2FAStatus = async () => {
      if (!session) {
        setIsChecking(false);
        return;
      }

      try {
        const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp.length > 0 ? factors.totp[0] : null;

        if (mfaData?.currentLevel === 'aal1' && 
            mfaData?.nextLevel === 'aal2' && 
            totpFactor) {
          setRequires2FA(true);
          navigate('/two-factor');
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    check2FAStatus();
  }, [session, navigate]);

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (requires2FA) {
    return null;
  }

  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure session persistence
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ session }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route 
                  path="/auth" 
                  element={session ? <Navigate to="/" replace /> : <Auth />} 
                />
                <Route path="/share/:id" element={<Share />} />
                <Route path="/two-factor" element={<TwoFactor />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <TwoFactorProtectedRoute>
                        <Index />
                      </TwoFactorProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/:section?"
                  element={
                    <ProtectedRoute>
                      <TwoFactorProtectedRoute>
                        <Settings />
                      </TwoFactorProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <TwoFactorProtectedRoute>
                        <Admin />
                      </TwoFactorProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
