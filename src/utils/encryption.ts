
import CryptoJS from 'crypto-js';

// Get encryption key from local storage or generate a new one
const getOrCreateEncryptionKey = (): string => {
  let key = localStorage.getItem('encryption_key');
  if (!key) {
    // Generate a strong random key
    key = CryptoJS.lib.WordArray.random(16).toString();
    localStorage.setItem('encryption_key', key);
  }
  return key;
};

// Encrypt data using AES
export const encryptData = (data: string): string => {
  try {
    const key = getOrCreateEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data using AES
export const decryptData = (encryptedData: string): string => {
  try {
    const key = getOrCreateEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Encrypt a file (returns a promise with the encrypted Blob)
export const encryptFile = async (file: File): Promise<{ encryptedBlob: Blob, encryptionData: string }> => {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
    
    // Generate a unique IV (Initialization Vector) for this file
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = getOrCreateEncryptionKey();
    
    // Encrypt the file content
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
      iv: iv
    });
    
    // Store the IV as part of the encryption data (we'll need it for decryption)
    const encryptionData = JSON.stringify({
      iv: iv.toString(),
      filename: file.name,
      type: file.type,
      size: file.size
    });
    
    // Convert the encrypted data to a Blob
    const encryptedBase64 = encrypted.toString();
    const encryptedBlob = base64ToBlob(encryptedBase64, 'application/encrypted');
    
    return { encryptedBlob, encryptionData };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

// Decrypt a file (returns a promise with the decrypted Blob)
export const decryptFile = async (
  encryptedBlob: Blob, 
  encryptionData: string
): Promise<{ decryptedBlob: Blob, filename: string, type: string }> => {
  try {
    // Parse the encryption data
    const parsedData = JSON.parse(encryptionData);
    const { iv, filename, type } = parsedData;
    
    // Read the encrypted blob
    const encryptedBase64 = await blobToBase64(encryptedBlob);
    
    // Remove data URL prefix if present
    const base64Data = encryptedBase64.includes('base64,') 
      ? encryptedBase64.split('base64,')[1] 
      : encryptedBase64;
    
    // Set up the decryption parameters
    const key = getOrCreateEncryptionKey();
    
    // Decrypt the file content
    const decrypted = CryptoJS.AES.decrypt(base64Data, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    
    // Convert the decrypted data to a Blob
    const wordArray = decrypted.toUint8Array(); 
    const decryptedBlob = new Blob([wordArray], { type });
    
    return { decryptedBlob, filename, type };
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

// Helper function to convert a Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string, type: string): Blob => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
};

// Convert a CryptoJS WordArray to a Uint8Array
CryptoJS.lib.WordArray.prototype.toUint8Array = function() {
  const words = this.words;
  const sigBytes = this.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  let offset = 0;
  
  for (let i = 0; i < sigBytes/4; i++) {
    const word = words[i];
    u8[offset++] = (word >>> 24);
    u8[offset++] = (word >>> 16) & 0xff;
    u8[offset++] = (word >>> 8) & 0xff;
    u8[offset++] = word & 0xff;
  }
  
  // Handle remaining bytes
  const remainingBytes = sigBytes % 4;
  if (remainingBytes) {
    const word = words[sigBytes / 4 | 0];
    for (let i = 0; i < remainingBytes; i++) {
      u8[offset++] = (word >>> (24 - 8 * i)) & 0xff;
    }
  }
  
  return u8;
};
