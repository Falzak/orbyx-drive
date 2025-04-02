
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ToastEvent {
  detail: {
    title: string;
    description: string;
  };
}

export default function TrustedDeviceToast() {
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastEvent["detail"]>) => {
      const { title, description } = event.detail;
      
      toast({
        title: title || t("device.recognized"),
        description: description || t("device.twoFactorSkipped"),
        duration: 5000,
      });
    };

    window.addEventListener("toast", handleToast as EventListener);

    return () => {
      window.removeEventListener("toast", handleToast as EventListener);
    };
  }, [toast, t]);

  return null;
}
