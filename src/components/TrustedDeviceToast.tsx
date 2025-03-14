
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

/**
 * Componente que escuta eventos para mostrar um toast quando o usuário
 * é automaticamente autenticado em um dispositivo confiável
 */
export function TrustedDeviceToast() {
  const { toast } = useToast();

  useEffect(() => {
    // Função para lidar com o evento custom de toast
    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { title, description } = customEvent.detail;

        toast({
          title,
          description,
          variant: "default",
          // Fix: Replace icon prop with jsx content directly
          children: <Shield className="h-4 w-4 text-primary" />,
        });
      }
    };

    // Adiciona o event listener
    window.addEventListener("toast", handleToastEvent);

    // Limpa o listener quando o componente é desmontado
    return () => {
      window.removeEventListener("toast", handleToastEvent);
    };
  }, [toast]);

  // Este componente não renderiza nada visualmente
  return null;
}

export default TrustedDeviceToast;
