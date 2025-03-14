
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

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event: CustomEvent) => {
      const { title, description } = event.detail;
      toast(title, {
        description,
        duration: 5000,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    };

    window.addEventListener("toast", handleToast as EventListener);
    return () => {
      window.removeEventListener("toast", handleToast as EventListener);
    };
  }, [trustedDevices]);

  return null;
}
