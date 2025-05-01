# Orbyx Drive

Orbyx Drive é uma plataforma segura de armazenamento e compartilhamento de arquivos com criptografia avançada.

## Características Principais

- **Armazenamento Seguro**: Armazene seus arquivos com segurança usando criptografia avançada
- **Compartilhamento Protegido**: Compartilhe arquivos com proteção por senha e links expiráveis
- **Organização Intuitiva**: Organize seus arquivos em pastas com cores e ícones personalizados
- **Interface Moderna**: Interface de usuário elegante e responsiva construída com React e Tailwind CSS
- **Autenticação de Dois Fatores**: Proteção adicional para sua conta

## Segurança

O Orbyx Drive implementa várias camadas de segurança para proteger seus dados:

### Criptografia Avançada

- **AES-256**: Criptografia de padrão militar para todos os dados
- **Criptografia em Camadas**: Múltiplas camadas de criptografia para proteção adicional
- **Verificação de Integridade**: HMAC para detectar qualquer adulteração de dados
- **Armazenamento Seguro de Chaves**: Chaves armazenadas com segurança usando IndexedDB
- **Derivação Segura de Senhas**: PBKDF2 com 100.000 iterações para proteção contra ataques de força bruta

Para mais detalhes sobre a segurança, consulte nossa [Documentação de Segurança](docs/SECURITY.md).

## Tecnologias Utilizadas

Este projeto é construído com:

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - Framer Motion
  - i18next para internacionalização

- **Backend**:
  - Supabase (Autenticação, Banco de Dados, Armazenamento)
  - Funções Serverless

## Desenvolvimento

### Pré-requisitos

- Node.js (v18+)
- npm ou pnpm

### Instalação

```sh
# Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Entre no diretório do projeto
cd orbyx-drive

# Instale as dependências
npm install
# ou
pnpm install

# Inicie o servidor de desenvolvimento
npm run dev
# ou
pnpm dev
```

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a versão de produção localmente
- `npm run lint` - Executa o linter para verificar problemas de código

### Testes de Criptografia

Para testar as funcionalidades de criptografia:

```sh
# Execute o script de teste de criptografia
npx tsx scripts/test-encryption.ts
```

## Contribuição

Contribuições são bem-vindas! Por favor, leia nossas diretrizes de contribuição antes de enviar um pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.
