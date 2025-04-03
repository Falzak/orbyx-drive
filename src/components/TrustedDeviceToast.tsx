import React from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { CheckCircle2 } from "lucide-react";

// Interface para o formato do dispositivo confiável
interface TrustedDevice {
  userId: string;
  timestamp: number;
  deviceInfo?: string;
}

export default function TrustedDeviceToast() {
  const [trustedDevices] = useLocalStorage<TrustedDevice[]>(
    "trusted_devices_v2",
    []
  );
  
  // Adicione um ref para rastrear toasts recentes e evitar duplicatas
  const recentToasts = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event: CustomEvent) => {
      const { title, description } = event.detail;
      
      // Crie uma chave única para este toast
      const toastKey = `${title}-${description}`;
      
      // Verifique se este toast foi mostrado recentemente
      if (!recentToasts.current.has(toastKey)) {
        // Adicione à lista de toasts recentes
        recentToasts.current.add(toastKey);
        
        // Mostre o toast
        toast(title, {
          description,
          duration: 5000,
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
        
        // Remova da lista após um tempo para permitir que seja mostrado novamente no futuro
        setTimeout(() => {
          recentToasts.current.delete(toastKey);
        }, 5000);
      }
    };

    window.addEventListener("toast", handleToast as EventListener);
    return () => {
      window.removeEventListener("toast", handleToast as EventListener);
    };
  }, [trustedDevices]);

  return null;
}
