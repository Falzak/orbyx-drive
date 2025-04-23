import { getFileUrl } from "@/utils/storage";
import { FileData } from "@/types";

/**
 * Armazena as URLs em cache para evitar requisições repetidas
 */
const urlCache = new Map<string, { url: string; timestamp: number }>();

// Define o tempo de expiração do cache em 30 minutos
const CACHE_EXPIRATION = 30 * 60 * 1000;

/**
 * Obtém a URL de visualização para um arquivo, utilizando cache quando possível
 */
export async function getPreviewUrl(file: FileData): Promise<string | null> {
  // Se o arquivo não tiver um caminho, não podemos gerar uma URL
  if (!file.file_path) {
    console.warn("Arquivo sem caminho:", file.id, file.filename);
    return null;
  }

  const cacheKey = `preview_${file.id}`;

  // Verificar se temos uma URL em cache que ainda não expirou
  const cachedItem = urlCache.get(cacheKey);
  const now = Date.now();

  if (cachedItem && now - cachedItem.timestamp < CACHE_EXPIRATION) {
    console.log("Usando URL em cache para:", file.filename);
    return cachedItem.url;
  }

  try {
    // Gerar nova URL
    console.log("Gerando nova URL para:", file.filename);
    const url = await getFileUrl(file.file_path);

    if (url) {
      // Armazenar no cache
      urlCache.set(cacheKey, { url, timestamp: now });
      return url;
    }

    return null;
  } catch (error) {
    console.error("Erro ao gerar URL para:", file.filename, error);
    return null;
  }
}

/**
 * Limpa o cache de URLs
 */
export function clearUrlCache(): void {
  urlCache.clear();
}

/**
 * Verifica se um arquivo pode ser visualizado diretamente
 */
export function isPreviewable(contentType: string): boolean {
  // Garantir que o tipo de conteúdo esteja definido
  if (!contentType) return false;

  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    contentType === "application/pdf" ||
    contentType.includes("officedocument") ||
    contentType === "application/msword" ||
    contentType === "text/plain"
  );
}
