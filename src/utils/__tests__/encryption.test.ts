/**
 * Testes para o módulo de criptografia
 * 
 * Este arquivo contém testes para verificar o funcionamento correto
 * das funções de criptografia e descriptografia.
 */

import { 
  encryptData, 
  decryptData, 
  encryptWithLayers, 
  decryptWithLayers 
} from '../encryption';

// Mock para IndexedDB
const mockIndexedDB = () => {
  // Simular o armazenamento
  const storage: Record<string, any> = {};
  
  // Mock para IDBRequest
  class MockIDBRequest {
    result: any = null;
    error: Error | null = null;
    onerror: ((event: any) => void) | null = null;
    onsuccess: ((event: any) => void) | null = null;
    
    constructor(result?: any, error?: Error) {
      this.result = result;
      this.error = error;
    }
    
    triggerSuccess() {
      if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    }
    
    triggerError() {
      if (this.onerror) {
        this.onerror({ target: this });
      }
    }
  }
  
  // Mock para IDBObjectStore
  class MockIDBObjectStore {
    name: string;
    
    constructor(name: string) {
      this.name = name;
    }
    
    get(key: string) {
      const request = new MockIDBRequest(storage[key]);
      setTimeout(() => request.triggerSuccess(), 0);
      return request;
    }
    
    add(value: any) {
      const request = new MockIDBRequest();
      setTimeout(() => {
        storage[value.id] = value;
        request.triggerSuccess();
      }, 0);
      return request;
    }
  }
  
  // Mock para IDBTransaction
  class MockIDBTransaction {
    objectStore(name: string) {
      return new MockIDBObjectStore(name);
    }
  }
  
  // Mock para IDBDatabase
  class MockIDBDatabase {
    objectStoreNames = {
      contains: (name: string) => true
    };
    
    createObjectStore(name: string, options: any) {
      return new MockIDBObjectStore(name);
    }
    
    transaction(storeNames: string[], mode: string) {
      return new MockIDBTransaction();
    }
  }
  
  // Mock para indexedDB.open
  const mockOpen = (name: string, version: number) => {
    const request = new MockIDBRequest(new MockIDBDatabase());
    
    // Simular abertura assíncrona
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      request.triggerSuccess();
    }, 0);
    
    return request;
  };
  
  // Substituir implementação global
  global.indexedDB = {
    open: mockOpen
  } as any;
};

describe('Módulo de Criptografia', () => {
  beforeAll(() => {
    // Configurar mock para IndexedDB
    mockIndexedDB();
    
    // Mock para localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });
  
  describe('Criptografia básica', () => {
    test('encryptData e decryptData devem funcionar corretamente', async () => {
      const testData = 'Dados de teste para criptografia';
      
      // Criptografar os dados
      const encrypted = await encryptData(testData);
      
      // Verificar que os dados criptografados são diferentes dos originais
      expect(encrypted).not.toBe(testData);
      
      // Verificar que os dados criptografados contêm os campos esperados
      const parsedData = JSON.parse(encrypted);
      expect(parsedData).toHaveProperty('ciphertext');
      expect(parsedData).toHaveProperty('iv');
      expect(parsedData).toHaveProperty('hmac');
      
      // Descriptografar os dados
      const decrypted = await decryptData(encrypted);
      
      // Verificar que os dados descriptografados são iguais aos originais
      expect(decrypted).toBe(testData);
    });
    
    test('decryptData deve falhar se os dados forem adulterados', async () => {
      const testData = 'Dados de teste para verificação de integridade';
      
      // Criptografar os dados
      const encrypted = await encryptData(testData);
      
      // Adulterar os dados criptografados
      const parsedData = JSON.parse(encrypted);
      parsedData.hmac = 'hmac_adulterado';
      const tamperedData = JSON.stringify(parsedData);
      
      // Tentar descriptografar os dados adulterados
      await expect(decryptData(tamperedData)).rejects.toThrow('Data integrity verification failed');
    });
  });
  
  describe('Criptografia em camadas', () => {
    test('encryptWithLayers e decryptWithLayers devem funcionar sem senha', async () => {
      const testData = 'Dados de teste para criptografia em camadas';
      
      // Criptografar os dados
      const encrypted = await encryptWithLayers(testData);
      
      // Verificar que os dados criptografados são diferentes dos originais
      expect(encrypted).not.toBe(testData);
      
      // Verificar que os dados criptografados contêm os campos esperados
      const parsedData = JSON.parse(encrypted);
      expect(parsedData).toHaveProperty('ciphertext');
      expect(parsedData).toHaveProperty('layers', 2);
      expect(parsedData).toHaveProperty('iv1');
      expect(parsedData).toHaveProperty('iv2');
      expect(parsedData).toHaveProperty('hmac1');
      expect(parsedData).toHaveProperty('hmac2');
      
      // Descriptografar os dados
      const decrypted = await decryptWithLayers(encrypted);
      
      // Verificar que os dados descriptografados são iguais aos originais
      expect(decrypted).toBe(testData);
    });
    
    test('encryptWithLayers e decryptWithLayers devem funcionar com senha', async () => {
      const testData = 'Dados de teste para criptografia em camadas com senha';
      const password = 'senha_secreta_123';
      
      // Criptografar os dados com senha
      const encrypted = await encryptWithLayers(testData, password);
      
      // Verificar que os dados criptografados são diferentes dos originais
      expect(encrypted).not.toBe(testData);
      
      // Verificar que os dados criptografados contêm os campos esperados
      const parsedData = JSON.parse(encrypted);
      expect(parsedData).toHaveProperty('ciphertext');
      expect(parsedData).toHaveProperty('layers', 3);
      expect(parsedData).toHaveProperty('salt');
      expect(parsedData).toHaveProperty('iv1');
      expect(parsedData).toHaveProperty('iv2');
      expect(parsedData).toHaveProperty('iv3');
      expect(parsedData).toHaveProperty('hmac1');
      expect(parsedData).toHaveProperty('hmac2');
      expect(parsedData).toHaveProperty('hmac3');
      
      // Descriptografar os dados com senha
      const decrypted = await decryptWithLayers(encrypted, password);
      
      // Verificar que os dados descriptografados são iguais aos originais
      expect(decrypted).toBe(testData);
    });
    
    test('decryptWithLayers deve falhar com senha incorreta', async () => {
      const testData = 'Dados de teste para verificação de senha';
      const password = 'senha_correta';
      const wrongPassword = 'senha_incorreta';
      
      // Criptografar os dados com senha
      const encrypted = await encryptWithLayers(testData, password);
      
      // Tentar descriptografar com senha incorreta
      await expect(decryptWithLayers(encrypted, wrongPassword)).rejects.toThrow();
    });
    
    test('decryptWithLayers deve falhar se os dados forem adulterados', async () => {
      const testData = 'Dados de teste para verificação de integridade em camadas';
      
      // Criptografar os dados
      const encrypted = await encryptWithLayers(testData);
      
      // Adulterar os dados criptografados
      const parsedData = JSON.parse(encrypted);
      parsedData.hmac2 = 'hmac_adulterado';
      const tamperedData = JSON.stringify(parsedData);
      
      // Tentar descriptografar os dados adulterados
      await expect(decryptWithLayers(tamperedData)).rejects.toThrow('integrity verification failed');
    });
  });
});
