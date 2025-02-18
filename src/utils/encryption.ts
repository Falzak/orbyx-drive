
import CryptoJS from 'crypto-js';

export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const encryptFile = async (file: File, encryptionKey: string): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
  const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey).toString();
  
  // Criar um novo arquivo com o conteúdo criptografado
  const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });
  return new File([encryptedBlob], file.name, { type: 'application/octet-stream' });
};

export const decryptFile = async (encryptedContent: string, encryptionKey: string, originalType: string, fileName: string): Promise<File> => {
  const decrypted = CryptoJS.AES.decrypt(encryptedContent, encryptionKey);
  const typedArray = convertWordArrayToUint8Array(decrypted);
  
  const blob = new Blob([typedArray], { type: originalType });
  return new File([blob], fileName, { type: originalType });
};

// Função auxiliar para converter WordArray para Uint8Array
function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const arrayOfWords = wordArray.words;
  const length = wordArray.sigBytes;
  const uint8Array = new Uint8Array(length);
  
  let offset = 0;
  for (let i = 0; i < length; i += 4) {
    const word = arrayOfWords[i / 4];
    uint8Array[offset++] = word >> 24;
    uint8Array[offset++] = (word >> 16) & 0xff;
    uint8Array[offset++] = (word >> 8) & 0xff;
    uint8Array[offset++] = word & 0xff;
  }
  
  return uint8Array;
}
