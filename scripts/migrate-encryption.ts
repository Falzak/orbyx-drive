/**
 * Script de Migração de Criptografia
 * 
 * Este script migra dados criptografados do formato antigo para o novo formato
 * com verificação de integridade e armazenamento seguro de chaves.
 * 
 * Uso:
 * 1. Execute este script após atualizar o código de criptografia
 * 2. O script detectará automaticamente dados no formato antigo e os atualizará
 * 
 * IMPORTANTE: Faça backup dos dados antes de executar este script!
 */

import { supabase } from '../src/integrations/supabase/client';
import { 
  encryptData as encryptDataNew,
  decryptData as decryptDataOld,
  encryptWithLayers as encryptWithLayersNew,
  decryptWithLayers as decryptWithLayersOld
} from '../src/utils/encryption';

// Versão antiga da função encryptData (para compatibilidade)
const encryptDataOld = (data: string): string => {
  try {
    // Obter a chave do localStorage (como na versão antiga)
    const key = localStorage.getItem('encryption_key') || '';
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Versão antiga da função decryptData (para compatibilidade)
const decryptDataOldCompat = (encryptedData: string): string => {
  try {
    // Verificar se os dados já estão no novo formato (JSON)
    if (encryptedData.startsWith('{') && encryptedData.endsWith('}')) {
      try {
        JSON.parse(encryptedData);
        // Se for JSON válido, provavelmente já está no novo formato
        // Usar a função atual para descriptografar
        return decryptDataOld(encryptedData);
      } catch (e) {
        // Não é JSON válido, continuar com a lógica antiga
      }
    }
    
    // Obter a chave do localStorage (como na versão antiga)
    const key = localStorage.getItem('encryption_key') || '';
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Migra dados criptografados para o novo formato
 * @param encryptedData Dados criptografados no formato antigo
 * @returns Dados criptografados no novo formato
 */
const migrateEncryptedData = async (encryptedData: string): Promise<string> => {
  try {
    // Verificar se os dados já estão no novo formato (JSON com IV e HMAC)
    if (encryptedData.startsWith('{') && encryptedData.endsWith('}')) {
      try {
        const parsed = JSON.parse(encryptedData);
        if (parsed.iv && parsed.hmac) {
          console.log('Dados já estão no novo formato, pulando migração');
          return encryptedData;
        }
      } catch (e) {
        // Não é JSON válido ou não tem os campos esperados
      }
    }
    
    // Descriptografar usando a função antiga
    const decryptedData = decryptDataOldCompat(encryptedData);
    
    // Criptografar novamente usando a nova função
    return await encryptDataNew(decryptedData);
  } catch (error) {
    console.error('Migration error:', error);
    throw new Error('Failed to migrate encrypted data');
  }
};

/**
 * Migra dados criptografados em camadas para o novo formato
 * @param encryptedData Dados criptografados em camadas no formato antigo
 * @param password Senha opcional para a terceira camada
 * @returns Dados criptografados em camadas no novo formato
 */
const migrateLayeredData = async (encryptedData: string, password?: string): Promise<string> => {
  try {
    // Verificar se os dados já estão no novo formato (JSON com IVs e HMACs)
    if (encryptedData.startsWith('{') && encryptedData.endsWith('}')) {
      try {
        const parsed = JSON.parse(encryptedData);
        if (parsed.iv1 && parsed.hmac1) {
          console.log('Dados em camadas já estão no novo formato, pulando migração');
          return encryptedData;
        }
      } catch (e) {
        // Não é JSON válido ou não tem os campos esperados
      }
    }
    
    // Descriptografar usando a função antiga
    const decryptedData = await decryptWithLayersOld(encryptedData, password);
    
    // Criptografar novamente usando a nova função
    return await encryptWithLayersNew(decryptedData, password);
  } catch (error) {
    console.error('Layered migration error:', error);
    throw new Error('Failed to migrate layered encrypted data');
  }
};

/**
 * Migra senhas criptografadas na tabela shared_files
 */
const migrateSharedFilesPasswords = async () => {
  console.log('Migrando senhas criptografadas na tabela shared_files...');
  
  // Buscar todos os registros com senhas criptografadas
  const { data, error } = await supabase
    .from('shared_files')
    .select('id, encrypted_password')
    .not('encrypted_password', 'is', null);
  
  if (error) {
    console.error('Erro ao buscar registros:', error);
    return;
  }
  
  console.log(`Encontrados ${data.length} registros para migrar`);
  
  // Migrar cada registro
  for (const record of data) {
    try {
      // Migrar a senha criptografada
      const migratedPassword = await migrateEncryptedData(record.encrypted_password);
      
      // Atualizar o registro
      const { error: updateError } = await supabase
        .from('shared_files')
        .update({ encrypted_password: migratedPassword })
        .eq('id', record.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar registro ${record.id}:`, updateError);
      } else {
        console.log(`Registro ${record.id} migrado com sucesso`);
      }
    } catch (e) {
      console.error(`Erro ao migrar registro ${record.id}:`, e);
    }
  }
  
  console.log('Migração de senhas concluída');
};

/**
 * Função principal que executa a migração
 */
const runMigration = async () => {
  console.log('Iniciando migração de dados criptografados...');
  
  try {
    // Migrar senhas criptografadas
    await migrateSharedFilesPasswords();
    
    // Adicione aqui outras migrações conforme necessário
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
};

// Executar a migração
runMigration().catch(console.error);
