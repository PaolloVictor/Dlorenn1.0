# Sistema de Cadastro de Usuários - D.Lorenn

Este projeto implementa um sistema completo de cadastro e autenticação de usuários para o site D.Lorenn, permitindo que os usuários se cadastrem e façam login usando suas contas do Google e Facebook, além do método tradicional com email e senha.

## Funcionalidades Implementadas

- **Autenticação Social**: Login e cadastro via Google e Facebook
- **Autenticação Tradicional**: Login e cadastro com email e senha
- **Perfil de Usuário**: Visualização e edição de informações pessoais
- **Upload de Avatar**: Possibilidade de alterar a foto de perfil
- **Recuperação de Senha**: Sistema para redefinir senha via email
- **Persistência de Dados**: Armazenamento de informações no Firebase Firestore

## Configuração do Firebase

Para que o sistema funcione corretamente, é necessário configurar o Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative a Autenticação e habilite os provedores:
   - Email/Senha
   - Google
   - Facebook
3. Configure o Firestore Database para armazenar os dados dos usuários
4. Configure o Storage para armazenar as imagens de perfil
5. Obtenha as credenciais do projeto e substitua no código:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "seu-messaging-id",
    appId: "seu-app-id"
};
```

## Configuração do Facebook Developer

Para o login com Facebook funcionar:

1. Crie um aplicativo no [Facebook Developers](https://developers.facebook.com/)
2. Configure o OAuth redirect URI para seu domínio
3. Obtenha o App ID e App Secret e configure no Firebase

## Estrutura de Arquivos

- **login.html**: Página de login e cadastro
- **login.css**: Estilos da página de login
- **login.js**: Lógica de autenticação e cadastro
- **perfil.html**: Página de perfil do usuário
- **perfil.css**: Estilos da página de perfil
- **perfil.js**: Lógica de gerenciamento do perfil

## Banco de Dados

O sistema utiliza o Firestore com a seguinte estrutura:

- **Coleção `usuarios`**:
  - `uid`: ID único do usuário (gerado pelo Firebase Auth)
  - `email`: Email do usuário
  - `displayName`: Nome completo
  - `phoneNumber`: Telefone/WhatsApp
  - `photoURL`: URL da foto de perfil
  - `endereco`: Endereço principal
  - `authProvider`: Provedor de autenticação (google, facebook, email)
  - `createdAt`: Data de criação da conta
  - `lastLogin`: Data do último login
  - `termsAccepted`: Aceitação dos termos de uso
  - `termsAcceptedAt`: Data de aceitação dos termos

## Segurança

Implementamos as seguintes práticas de segurança:

- Validação de senhas
- Confirmação de email (opcional)
- Proteção contra múltiplas tentativas de login
- Armazenamento seguro de senhas (gerenciado pelo Firebase)
- Regras de segurança no Firestore e Storage

## Personalização

O sistema foi desenvolvido seguindo a identidade visual do site D.Lorenn, com cores e estilos consistentes com o restante do site.