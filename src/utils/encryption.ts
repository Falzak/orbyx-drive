
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

// Get secondary encryption key for layered encryption
const getOrCreateSecondaryKey = (): string => {
  let key = localStorage.getItem('secondary_encryption_key');
  if (!key) {
    // Generate a strong random key
    key = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem('secondary_encryption_key', key);
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

// Enhanced encryption with multiple layers
export const encryptWithLayers = (data: string, password?: string): string => {
  try {
    // First layer - default encryption
    const primaryKey = getOrCreateEncryptionKey();
    const firstLayer = CryptoJS.AES.encrypt(data, primaryKey).toString();
    
    // Second layer - secondary key
    const secondaryKey = getOrCreateSecondaryKey();
    const secondLayer = CryptoJS.AES.encrypt(firstLayer, secondaryKey).toString();
    
    // Third layer (optional) - password-based encryption
    if (password && password.length > 0) {
      // Create a key from the password with salt
      const salt = CryptoJS.lib.WordArray.random(128/8);
      const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
      
      // Encrypt with password-derived key
      const thirdLayer = CryptoJS.AES.encrypt(secondLayer, key.toString()).toString();
      
      // Store salt with ciphertext
      return JSON.stringify({
        ciphertext: thirdLayer,
        salt: salt.toString(),
        layers: 3
      });
    }
    
    return JSON.stringify({
      ciphertext: secondLayer,
      layers: 2
    });
  } catch (error) {
    console.error('Layered encryption error:', error);
    throw new Error('Failed to encrypt data with multiple layers');
  }
};

// Decrypt data with multiple layers
export const decryptWithLayers = (encryptedData: string, password?: string): string => {
  try {
    const parsedData = JSON.parse(encryptedData);
    let currentData = parsedData.ciphertext;
    
    // Third layer (optional) - password-based decryption
    if (parsedData.layers === 3) {
      if (!password) throw new Error('Password required for decryption');
      
      // Recreate the key using the stored salt
      const salt = CryptoJS.enc.Hex.parse(parsedData.salt);
      const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
      
      // Decrypt the third layer
      const bytes = CryptoJS.AES.decrypt(currentData, key.toString());
      currentData = bytes.toString(CryptoJS.enc.Utf8);
    }
    
    // Second layer - secondary key
    const secondaryKey = getOrCreateSecondaryKey();
    const secondLayerBytes = CryptoJS.AES.decrypt(currentData, secondaryKey);
    currentData = secondLayerBytes.toString(CryptoJS.enc.Utf8);
    
    // First layer - default encryption
    const primaryKey = getOrCreateEncryptionKey();
    const firstLayerBytes = CryptoJS.AES.decrypt(currentData, primaryKey);
    return firstLayerBytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Layered decryption error:', error);
    throw new Error('Failed to decrypt layered data');
  }
};

// Encrypt a file with optional enhanced security
export const encryptFile = async (
  file: File, 
  options?: { 
    enhancedSecurity?: boolean;
    password?: string;
    compress?: boolean;
  }
): Promise<{ encryptedBlob: Blob, encryptionData: string }> => {
  try {
    // Default options
    const { enhancedSecurity = false, password, compress = false } = options || {};
    
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    let wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
    
    // Compress data if requested (using LZString for better compression)
    let compressed = false;
    if (compress) {
      try {
        const base64 = CryptoJS.enc.Base64.stringify(wordArray);
        const compressedStr = LZString.compressToUTF16(base64);
        wordArray = CryptoJS.enc.Utf8.parse(compressedStr);
        compressed = true;
      } catch (e) {
        console.warn('Compression failed, proceeding without compression', e);
      }
    }
    
    // Generate a unique IV (Initialization Vector) for this file
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = enhancedSecurity ? getOrCreateSecondaryKey() : getOrCreateEncryptionKey();
    
    // Encrypt the file content
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
      iv: iv
    });
    
    // If enhanced security is requested and we have a password, apply an additional layer
    let finalEncrypted = encrypted;
    if (enhancedSecurity && password) {
      // Create a key from the password with salt
      const salt = CryptoJS.lib.WordArray.random(128/8);
      const passwordKey = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
      
      // Apply additional encryption layer
      finalEncrypted = CryptoJS.AES.encrypt(encrypted.toString(), passwordKey.toString(), {
        iv: CryptoJS.lib.WordArray.random(16)
      });
    }
    
    // Store encryption metadata
    const encryptionData = JSON.stringify({
      iv: iv.toString(),
      filename: file.name,
      type: file.type,
      size: file.size,
      enhanced: enhancedSecurity,
      passwordProtected: !!(enhancedSecurity && password),
      compressed,
      salt: (enhancedSecurity && password) ? 
        CryptoJS.lib.WordArray.random(128/8).toString() : undefined
    });
    
    // Convert the encrypted data to a Blob
    const encryptedBase64 = finalEncrypted.toString();
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
  encryptionData: string,
  password?: string
): Promise<{ decryptedBlob: Blob, filename: string, type: string }> => {
  try {
    // Parse the encryption data
    const parsedData = JSON.parse(encryptionData);
    const { 
      iv, filename, type, enhanced = false, 
      passwordProtected = false, compressed = false 
    } = parsedData;
    
    // Read the encrypted blob
    const encryptedBase64 = await blobToBase64(encryptedBlob);
    
    // Remove data URL prefix if present
    const base64Data = encryptedBase64.includes('base64,') 
      ? encryptedBase64.split('base64,')[1] 
      : encryptedBase64;
    
    // Set up the decryption parameters
    let key = enhanced ? getOrCreateSecondaryKey() : getOrCreateEncryptionKey();
    let currentData = base64Data;
    
    // Handle password protected files
    if (passwordProtected) {
      if (!password) throw new Error('Password required for decryption');
      
      // First decrypt the password layer
      const salt = CryptoJS.enc.Hex.parse(parsedData.salt || '');
      const passwordKey = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
      
      const passwordDecrypted = CryptoJS.AES.decrypt(currentData, passwordKey.toString());
      currentData = passwordDecrypted.toString(CryptoJS.enc.Utf8);
    }
    
    // Decrypt the main encryption
    const decrypted = CryptoJS.AES.decrypt(currentData, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    
    // Handle decompression if needed
    let decryptedResult;
    if (compressed) {
      // Decompress the decrypted data
      const base64Str = decrypted.toString(CryptoJS.enc.Utf8);
      const decompressed = LZString.decompressFromUTF16(base64Str);
      if (!decompressed) throw new Error('Decompression failed');
      
      // Convert back from Base64
      const wordArray = CryptoJS.enc.Base64.parse(decompressed);
      decryptedResult = wordArray;
    } else {
      decryptedResult = decrypted;
    }
    
    // Fix: Convert the decrypted data to a Uint8Array manually instead of using toUint8Array
    const wordArray = decryptedResult;
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
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
    
    const decryptedBlob = new Blob([u8], { type });
    
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

// LZString library for compression (minimal implementation)
const LZString = {
  compressToUTF16: (input: string): string => {
    try {
      return btoa(encodeURIComponent(input));
    } catch (e) {
      console.error('Compression error:', e);
      return input;
    }
  },
  decompressFromUTF16: (compressed: string): string => {
    try {
      return decodeURIComponent(atob(compressed));
    } catch (e) {
      console.error('Decompression error:', e);
      return '';
    }
  }
};
