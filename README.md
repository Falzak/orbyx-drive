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

### Gerenciador de Pacotes (pnpm)

Este projeto utiliza o [pnpm](https://pnpm.io/) como gerenciador de pacotes. O pnpm oferece várias vantagens:

- **Economia de espaço em disco**: Armazena dependências em um único local e cria links simbólicos
- **Instalação mais rápida**: Instalação e atualização de dependências mais rápidas
- **Segurança aprimorada**: Estrutura de node_modules mais segura que evita dependências fantasma
- **Compatibilidade com Monorepos**: Suporte nativo para workspaces e monorepos

### Pré-requisitos

- Node.js (v18+)
- pnpm (v8+)

### Instalação

```sh
# Instale o pnpm globalmente (se ainda não tiver)
npm install -g pnpm

# Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Entre no diretório do projeto
cd orbyx-drive

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm dev
```

### Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Compila o projeto para produção
- `pnpm preview` - Visualiza a versão de produção localmente
- `pnpm lint` - Executa o linter para verificar problemas de código
- `pnpm clean` - Remove os diretórios node_modules e dist
- `pnpm reinstall` - Limpa e reinstala todas as dependências
- `pnpm update` - Atualiza todas as dependências para as versões mais recentes

### Testes de Criptografia

Para testar as funcionalidades de criptografia:

```sh
# Execute o script de teste de criptografia
pnpm test:encryption
```

## Contribuição

Contribuições são bem-vindas! Por favor, leia nossas diretrizes de contribuição antes de enviar um pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.
