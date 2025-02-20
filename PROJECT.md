

    Tabela: files
        Descrição: Armazena informações sobre arquivos.
        Colunas:
            id: UUID, chave primária.
            user_id: UUID, referência ao usuário que possui o arquivo.
            filename: Texto, nome do arquivo.
            file_path: Texto, caminho do arquivo.
            content_type: Texto, tipo de conteúdo do arquivo.
            size: Bigint, tamanho do arquivo.
            is_favorite: Booleano, indica se o arquivo é favorito.
            created_at: Timestamp com fuso horário, data de criação.
            updated_at: Timestamp com fuso horário, data de atualização.
            category: Texto, categoria do arquivo (imagem, documento, vídeo, outro).
            folder_id: UUID, referência à pasta onde o arquivo está armazenado.
        Restrições: Chaves estrangeiras para folder_id e user_id.

    Tabela: folders
        Descrição: Armazena informações sobre pastas.
        Colunas:
            id: UUID, chave primária.
            name: Texto, nome da pasta.
            parent_id: UUID, referência à pasta pai.
            user_id: UUID, referência ao usuário que possui a pasta.
            created_at: Timestamp com fuso horário, data de criação.
            icon: Texto, ícone da pasta.
            color: Texto, cor da pasta.
        Restrições: Chaves estrangeiras para parent_id e user_id.

    Tabela: profiles
        Descrição: Armazena informações de perfil dos usuários.
        Colunas:
            id: UUID, chave primária e referência ao usuário.
            username: Texto, nome de usuário.
            avatar_url: Texto, URL do avatar do usuário.
            updated_at: Timestamp com fuso horário, data de atualização.
            created_at: Timestamp com fuso horário, data de criação.
        Restrições: Chave única para username e chave estrangeira para id.

    Tabela: shared_files
        Descrição: Armazena informações sobre arquivos compartilhados.
        Colunas:
            id: UUID, chave primária.
            file_path: Texto, caminho do arquivo compartilhado.
            shared_by: UUID, referência ao usuário que compartilhou o arquivo.
            shared_with: UUID, referência ao usuário com quem o arquivo foi compartilhado.
            custom_url: Texto, URL personalizada para o arquivo.
            is_public: Booleano, indica se o arquivo é público.
            expires_at: Timestamp com fuso horário, data de expiração do compartilhamento.
            password: Texto, senha para acessar o arquivo.
            created_at: Timestamp com fuso horário, data de criação.
            encryption_key: Texto, chave de criptografia do arquivo.
        Restrições: Chaves estrangeiras para file_path, shared_by e shared_with.

    Tabela: storage_providers
        Descrição: Armazena informações sobre provedores de armazenamento.
        Colunas:
            id: UUID, chave primária.
            name: Texto, nome do provedor.
            provider: Tipo público, provedor de armazenamento.
            is_active: Booleano, indica se o provedor está ativo.
            credentials: JSONB, credenciais do provedor.
            created_at: Timestamp com fuso horário, data de criação.
            updated_at: Timestamp com fuso horário, data de atualização.

    Tabela: storage_quotas
        Descrição: Armazena informações sobre as quotas de armazenamento dos usuários.
        Colunas:
            user_id: UUID, chave primária e referência ao usuário.
            total_quota: Bigint, quota total de armazenamento.
            used_quota: Bigint, quota de armazenamento utilizada.
            created_at: Timestamp com fuso horário, data de criação.
            updated_at: Timestamp com fuso horário, data de atualização.
        Restrições: Chave estrangeira para user_id.

    Tabela: user_roles
        Descrição: Armazena informações sobre os papéis dos usuários.
        Colunas:
            id: UUID, chave primária.
            user_id: UUID, referência ao usuário.
            role: Tipo público, papel do usuário.
            created_at: Timestamp com fuso horário, data de criação.
        Restrições: Chave única para a combinação de user_id e role, e chave estrangeira para user_id.

Essas tabelas estão configuradas para armazenar informações relacionadas a arquivos, pastas, perfis de usuários, compartilhamento de arquivos, provedores de armazenamento, quotas de armazenamento e papéis de usuários.