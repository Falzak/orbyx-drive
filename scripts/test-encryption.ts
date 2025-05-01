/**
 * Script de Teste de Criptografia
 * 
 * Este script testa as funções de criptografia para garantir que estão funcionando corretamente.
 * Ele também pode ser usado para verificar a compatibilidade com dados criptografados anteriormente.
 */

import { 
  encryptData, 
  decryptData, 
  encryptWithLayers, 
  decryptWithLayers,
  encryptFile,
  decryptFile
} from '../src/utils/encryption';

/**
 * Testa a criptografia básica
 */
const testBasicEncryption = async () => {
  console.log('\n=== Testando criptografia básica ===');
  
  const testData = 'Dados de teste para criptografia';
  console.log(`Dados originais: ${testData}`);
  
  // Criptografar os dados
  console.log('Criptografando dados...');
  const encrypted = await encryptData(testData);
  console.log(`Dados criptografados: ${encrypted}`);
  
  // Descriptografar os dados
  console.log('Descriptografando dados...');
  const decrypted = await decryptData(encrypted);
  console.log(`Dados descriptografados: ${decrypted}`);
  
  // Verificar se os dados descriptografados são iguais aos originais
  if (decrypted === testData) {
    console.log('✅ Teste de criptografia básica passou!');
  } else {
    console.error('❌ Teste de criptografia básica falhou!');
  }
};

/**
 * Testa a criptografia em camadas
 */
const testLayeredEncryption = async () => {
  console.log('\n=== Testando criptografia em camadas ===');
  
  const testData = 'Dados de teste para criptografia em camadas';
  console.log(`Dados originais: ${testData}`);
  
  // Criptografar os dados sem senha
  console.log('Criptografando dados em camadas (sem senha)...');
  const encrypted = await encryptWithLayers(testData);
  console.log(`Dados criptografados: ${encrypted}`);
  
  // Descriptografar os dados
  console.log('Descriptografando dados em camadas...');
  const decrypted = await decryptWithLayers(encrypted);
  console.log(`Dados descriptografados: ${decrypted}`);
  
  // Verificar se os dados descriptografados são iguais aos originais
  if (decrypted === testData) {
    console.log('✅ Teste de criptografia em camadas (sem senha) passou!');
  } else {
    console.error('❌ Teste de criptografia em camadas (sem senha) falhou!');
  }
  
  // Criptografar os dados com senha
  const password = 'senha_secreta_123';
  console.log(`\nCriptografando dados em camadas (com senha: ${password})...`);
  const encryptedWithPassword = await encryptWithLayers(testData, password);
  console.log(`Dados criptografados com senha: ${encryptedWithPassword}`);
  
  // Descriptografar os dados com senha
  console.log('Descriptografando dados em camadas com senha...');
  const decryptedWithPassword = await decryptWithLayers(encryptedWithPassword, password);
  console.log(`Dados descriptografados: ${decryptedWithPassword}`);
  
  // Verificar se os dados descriptografados são iguais aos originais
  if (decryptedWithPassword === testData) {
    console.log('✅ Teste de criptografia em camadas (com senha) passou!');
  } else {
    console.error('❌ Teste de criptografia em camadas (com senha) falhou!');
  }
  
  // Tentar descriptografar com senha incorreta
  try {
    console.log('\nTentando descriptografar com senha incorreta...');
    await decryptWithLayers(encryptedWithPassword, 'senha_incorreta');
    console.error('❌ Teste de senha incorreta falhou! Deveria ter lançado um erro.');
  } catch (error) {
    console.log('✅ Teste de senha incorreta passou! Erro capturado:', error.message);
  }
};

/**
 * Testa a verificação de integridade
 */
const testIntegrityVerification = async () => {
  console.log('\n=== Testando verificação de integridade ===');
  
  const testData = 'Dados de teste para verificação de integridade';
  console.log(`Dados originais: ${testData}`);
  
  // Criptografar os dados
  console.log('Criptografando dados...');
  const encrypted = await encryptData(testData);
  console.log(`Dados criptografados: ${encrypted}`);
  
  // Adulterar os dados criptografados
  console.log('Adulterando dados criptografados...');
  const parsedData = JSON.parse(encrypted);
  parsedData.hmac = 'hmac_adulterado';
  const tamperedData = JSON.stringify(parsedData);
  console.log(`Dados adulterados: ${tamperedData}`);
  
  // Tentar descriptografar os dados adulterados
  try {
    console.log('Tentando descriptografar dados adulterados...');
    await decryptData(tamperedData);
    console.error('❌ Teste de verificação de integridade falhou! Deveria ter lançado um erro.');
  } catch (error) {
    console.log('✅ Teste de verificação de integridade passou! Erro capturado:', error.message);
  }
};

/**
 * Função principal que executa todos os testes
 */
const runTests = async () => {
  console.log('Iniciando testes de criptografia...');
  
  try {
    await testBasicEncryption();
    await testLayeredEncryption();
    await testIntegrityVerification();
    
    console.log('\n✅ Todos os testes concluídos com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
};

// Executar os testes
runTests().catch(console.error);
