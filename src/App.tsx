import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
import Landing from "@/pages/Landing";
import { useLocalStorage } from "./hooks/use-local-storage";
import ResetPassword from "./pages/ResetPassword";
import TrustedDeviceToast from "./components/TrustedDeviceToast";

const queryClient = new QueryClient();

type AuthContextType = {
  session: Session | null;
};

// Interface para o formato do dispositivo confiável
interface TrustedDevice {
  userId: string;
  timestamp: number;
  deviceInfo?: string;
}

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

const TwoFactorProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [trustedDevicesV2] = useLocalStorage<TrustedDevice[]>(
    "trusted_devices_v2",
    []
  );

  // Também verificar o formato antigo, como fallback
  const [trustedDevicesLegacy] = useLocalStorage<string[]>(
    "trusted_devices",
    []
  );

  useEffect(() => {
    const check2FAStatus = async () => {
      if (!session) {
        setIsChecking(false);
        return;
      }

      try {
        const { data: mfaData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp.length > 0 ? factors.totp[0] : null;

        // Check if current authentication level is already AAL2 (2FA passed)
        if (mfaData?.currentLevel === "aal2") {
          setRequires2FA(false);
          setIsChecking(false);
          return;
        }

        // Check if user needs 2FA (has totp factor and next level is AAL2)
        if (mfaData?.nextLevel === "aal2" && totpFactor) {
          // Check if this device is trusted
          const userId = session.user.id;

          // Verificar primeiro no novo formato
          let isTrusted = trustedDevicesV2.some(
            (device) => device.userId === userId
          );

          // Se não encontrar, verificar no formato antigo (para compatibilidade)
          if (!isTrusted && trustedDevicesLegacy.length > 0) {
            isTrusted = trustedDevicesLegacy.some((item) => {
              try {
                // Tenta como JSON
                const parsed = JSON.parse(item);
                return parsed.userId === userId;
              } catch {
                // Tenta como string simples
                return item === userId;
              }
            });
          }

          if (isTrusted) {
            console.log("Dispositivo confiável detectado, pulando 2FA");
            // Este dispositivo é confiável, não precisa de 2FA
            setRequires2FA(false);

            // Verificar se o usuário está na página de 2FA e redirecionar se necessário
            if (location.pathname === "/two-factor") {
              navigate("/dashboard", { replace: true });
            }

            // Use uma flag para garantir que o toast seja mostrado apenas uma vez
            const toastShownKey = `toast_shown_${userId}_${new Date().toDateString()}`;
            if (!sessionStorage.getItem(toastShownKey)) {
              sessionStorage.setItem(toastShownKey, "true");
              
              // Atraso para garantir que o toast apareça após a navegação
              setTimeout(() => {
                const toastEvent = new CustomEvent("toast", {
                  detail: {
                    title: "Dispositivo reconhecido",
                    description:
                      "Autenticação em dois fatores pulada para este dispositivo",
                  },
                });
                window.dispatchEvent(toastEvent);
              }, 1000);
            }
          } else {
            console.log("Dispositivo não confiável, redirecionando para 2FA");
            // Não é um dispositivo confiável, redirecionar para 2FA
            setRequires2FA(true);

            // Só redireciona se não estiver já na página de two-factor
            if (location.pathname !== "/two-factor") {
              navigate("/two-factor", { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    check2FAStatus();
  }, [
    session,
    navigate,
    trustedDevicesV2,
    trustedDevicesLegacy,
    location.pathname,
  ]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (requires2FA) {
    return null;
  }

  return <>{children}</>;
};

// Componente para verificar e redirecionar dispositivos confiáveis na página de 2FA
const TwoFactorRedirector = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [trustedDevicesV2] = useLocalStorage<TrustedDevice[]>(
    "trusted_devices_v2",
    []
  );
  const [trustedDevicesLegacy] = useLocalStorage<string[]>(
    "trusted_devices",
    []
  );
  const [isChecking, setIsChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Evitar verificações múltiplas se já estiver redirecionando
    if (isRedirecting) return;
    
    const checkTrustedDevice = async () => {
      if (!session) {
        setIsChecking(false);
        return;
      }

      try {
        const userId = session.user.id;

        // Verificar se o dispositivo é confiável
        let isTrusted = trustedDevicesV2.some(
          (device) => device.userId === userId
        );

        if (!isTrusted && trustedDevicesLegacy.length > 0) {
          isTrusted = trustedDevicesLegacy.some((item) => {
            try {
              const parsed = JSON.parse(item);
              return parsed.userId === userId;
            } catch {
              return item === userId;
            }
          });
        }

        if (isTrusted) {
          console.log("Dispositivo confiável detectado no TwoFactorRedirector");
          setIsRedirecting(true);
          // Se for dispositivo confiável, tentar atualizar o nível de autenticação
          const { data: mfaData } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          // Se já estiver no nível AAL2 ou não precisar de 2FA, redirecionar
          if (
            mfaData?.currentLevel === "aal2" ||
            mfaData?.nextLevel !== "aal2"
          ) {
            navigate("/dashboard", { replace: true });

            // Mostrar toast
            setTimeout(() => {
              const toastEvent = new CustomEvent("toast", {
                detail: {
                  title: "Dispositivo reconhecido",
                  description:
                    "Autenticação em dois fatores pulada para este dispositivo",
                },
              });
              window.dispatchEvent(toastEvent);
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error checking trusted device status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkTrustedDevice();
  }, [session, trustedDevicesV2, trustedDevicesLegacy, navigate, isRedirecting]);

  // Mostrar loading apenas enquanto verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Renderizar o componente TwoFactor normal
  return <TwoFactor />;
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ session }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <TrustedDeviceToast />
            <BrowserRouter>
              <Routes>
                {/* Landing Page como página inicial pública */}
                <Route
                  path="/"
                  element={
                    session ? <Navigate to="/dashboard" replace /> : <Landing />
                  }
                />

                {/* Dashboard quando logado */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <TwoFactorProtectedRoute>
                        <Index />
                      </TwoFactorProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/auth"
                  element={
                    session ? <Navigate to="/dashboard" replace /> : <Auth />
                  }
                />
                <Route path="/share/:id" element={<Share />} />
                <Route path="/two-factor" element={<TwoFactorRedirector />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
