// Script para login e autenticação - D.Lorenn
// Firebase já inicializado no firebase-config.js

// Verificar se o Firebase está disponível
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK não está carregado. Verifique se os scripts foram incluídos corretamente.');
} else {
  console.log('Firebase disponível');
  
  // Verificar domínio atual para autenticação OAuth
    const currentDomain = window.location.hostname;
    console.log('Domínio atual:', currentDomain);
    if (currentDomain !== 'localhost' && 
        currentDomain !== '127.0.0.1' && 
        !currentDomain.includes('dlorenn-a46ca.firebaseapp.com') && 
        !currentDomain.includes('dlorenn-a46ca.web.app')) {
      console.warn('Aviso: Este domínio pode não estar autorizado no Firebase Console para autenticação OAuth');
    }
  } else {
    console.log('Firebase já estava inicializado');
  }

  // Habilitar analytics se disponível
  if (firebase.analytics) {
    firebase.analytics();
  }
}

// Verificar se há resultado pendente de redirecionamento (para login social)
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar se há resultado pendente de redirecionamento
    const result = await firebase.auth().getRedirectResult();
    if (result.user) {
      console.log('Login por redirecionamento detectado');
      const user = result.user;
      const isNewUser = result.additionalUserInfo?.isNewUser || false;
      const providerId = result.additionalUserInfo?.providerId || user.providerData[0]?.providerId || '';
      
      console.log('Autenticação por redirecionamento bem-sucedida:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: providerId,
        isNewUser: isNewUser
      });
      
      // Determinar o provedor para armazenar no Firestore
      let authProvider = 'email';
      if (providerId.includes('google')) {
        authProvider = 'google';
      } else if (providerId.includes('facebook')) {
        authProvider = 'facebook';
      }
      
      // Salvar dados do usuário no Firestore
      await saveUserData(user, {
        providerData: providerId,
        authProvider: authProvider,
        isNewUser: isNewUser,
        termsAccepted: true,
        termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showSuccess(isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
      redirectAfterLogin();
    }
  } catch (error) {
    console.error('Erro ao processar resultado de redirecionamento:', error);
    if (error.code === 'auth/account-exists-with-different-credential') {
      // Tratar erro de conta existente com credencial diferente
      const email = error.email;
      const pendingCred = error.credential;
      
      // Buscar métodos de login disponíveis para este email
      const methods = await firebase.auth().fetchSignInMethodsForEmail(email);
      
      // Mostrar mensagem de erro com opções para o usuário
      const errorContainer = document.querySelector('.error-message') || document.createElement('div');
      errorContainer.className = 'error-message';
      errorContainer.innerHTML = `
        <p>Este email já está associado a outra conta. Você pode:</p>
        <ul>
          <li>Fazer login com: ${methods.join(', ')}</li>
          <li><a href="#" id="link-accounts">Vincular estas contas</a></li>
        </ul>
      `;
      
      // Adicionar ao DOM se ainda não estiver
      const messageContainer = document.querySelector('.message-container') || document.querySelector('.form-container');
      if (!document.querySelector('.error-message') && messageContainer) {
        messageContainer.prepend(errorContainer);
      }
      
      // Adicionar evento para vincular contas
      document.getElementById('link-accounts')?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
          // Primeiro método disponível
          const provider = getProviderForId(methods[0]);
          if (!provider) {
            showError('Não foi possível vincular as contas. Método de login não suportado.');
            return;
          }
          
          // Fazer login com o primeiro método
          const result = await firebase.auth().signInWithPopup(provider);
          
          // Vincular a credencial pendente
          await result.user.linkWithCredential(pendingCred);
          
          showSuccess('Contas vinculadas com sucesso!');
          redirectAfterLogin();
        } catch (linkError) {
          console.error('Erro ao vincular contas:', linkError);
          showError('Não foi possível vincular as contas. Por favor, tente novamente.');
        }
      });
    } else if (error.code === 'auth/credential-already-in-use') {
      // Adicionar tratamento específico para credencial já em uso
      showError('Esta conta já está sendo usada. Tente fazer login diretamente.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // Usuário fechou o popup antes de completar o login
      showError('Login cancelado. Tente novamente.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Múltiplas solicitações de popup
      console.warn('Solicitação de popup cancelada');
    } else if (error.code === 'auth/popup-blocked') {
      // Popup bloqueado pelo navegador
      showError('O popup de login foi bloqueado. Por favor, permita popups para este site e tente novamente.');
    } else if (error.code === 'auth/network-request-failed') {
      // Problemas de rede
      showError('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      showError('Ocorreu um erro durante o login. Por favor, tente novamente.');
    }
  }
});

// Configurar provedores de autenticação
const googleProvider = new firebase.auth.GoogleAuthProvider();
// Adicionar escopos necessários para o Google
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Configurar parâmetros adicionais para o Google
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

const facebookProvider = new firebase.auth.FacebookAuthProvider();
// Adicionar escopos necessários para o Facebook
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
// Configurar parâmetros adicionais para o Facebook
facebookProvider.setCustomParameters({
  'display': 'popup',
  'auth_type': 'rerequest'
});

// Referências aos serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos DOM
const loginForm = document.getElementById('login-form');
const cadastroForm = document.getElementById('cadastro-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const googleLoginBtn = document.getElementById('google-login');
const facebookLoginBtn = document.getElementById('facebook-login');
const googleSignupBtn = document.getElementById('google-signup');
const facebookSignupBtn = document.getElementById('facebook-signup');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');
const passwordInput = document.getElementById('cadastro-senha');
const confirmPasswordInput = document.getElementById('cadastro-confirmar-senha');
const strengthIndicator = document.getElementById('strength-indicator');
const strengthText = document.getElementById('strength-text');
const passwordMatch = document.getElementById('password-match');

// Alternar entre as abas de login e cadastro
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remover classe active de todos os botões e conteúdos
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Adicionar classe active ao botão clicado e ao conteúdo correspondente
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Mostrar/ocultar senha
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const inputField = document.getElementById(targetId);
        
        if (inputField.type === 'password') {
            inputField.type = 'text';
            btn.textContent = '🔒';
        } else {
            inputField.type = 'password';
            btn.textContent = '👁️';
        }
    });
});

// Verificar força da senha
passwordInput.addEventListener('input', checkPasswordStrength);

function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]+/)) strength += 20;
    if (password.match(/[A-Z]+/)) strength += 20;
    if (password.match(/[0-9]+/)) strength += 20;
    if (password.match(/[^a-zA-Z0-9]+/)) strength += 20;
    
    strengthIndicator.style.width = `${strength}%`;
    
    if (strength <= 20) {
        strengthIndicator.style.backgroundColor = '#ff4d4d';
        feedback = 'Muito fraca';
    } else if (strength <= 40) {
        strengthIndicator.style.backgroundColor = '#ffa64d';
        feedback = 'Fraca';
    } else if (strength <= 60) {
        strengthIndicator.style.backgroundColor = '#ffff4d';
        feedback = 'Média';
    } else if (strength <= 80) {
        strengthIndicator.style.backgroundColor = '#4dff4d';
        feedback = 'Forte';
    } else {
        strengthIndicator.style.backgroundColor = '#4d4dff';
        feedback = 'Muito forte';
    }
    
    strengthText.textContent = feedback;
    
    // Verificar correspondência se o campo de confirmação tiver valor
    if (confirmPasswordInput.value) {
        checkPasswordMatch();
    }
}

// Verificar se as senhas correspondem
confirmPasswordInput.addEventListener('input', checkPasswordMatch);

function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!confirmPassword) {
        passwordMatch.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        passwordMatch.textContent = 'Senhas correspondem ✓';
        passwordMatch.style.color = '#4dff4d';
    } else {
        passwordMatch.textContent = 'Senhas não correspondem ✗';
        passwordMatch.style.color = '#ff4d4d';
    }
}

// Máscara para o campo de telefone
const telefoneInput = document.getElementById('cadastro-telefone');
if (telefoneInput) {
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        // Formatar o número conforme digita
        if (value.length > 0) {
            // Adicionar parênteses para DDD
            value = '(' + value;
            if (value.length > 3) {
                value = value.slice(0, 3) + ') ' + value.slice(3);
            }
            // Adicionar hífen
            if (value.length > 10) {
                value = value.slice(0, 10) + '-' + value.slice(10);
            }
        }
        
        e.target.value = value;
    });
}

// Função para exibir mensagens de erro
function showError(message) {
    // Criar elemento de erro se não existir
    let errorElement = document.getElementById('form-error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'form-error-message';
        errorElement.className = 'error-message';
        
        // Adicionar estilos
        errorElement.style.backgroundColor = '#f8d7da';
        errorElement.style.color = '#721c24';
        errorElement.style.padding = '10px';
        errorElement.style.borderRadius = '5px';
        errorElement.style.marginBottom = '15px';
        errorElement.style.fontSize = '14px';
        
        // Inserir antes do botão de submit no formulário ativo
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const submitBtn = activeTab.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.parentNode.insertBefore(errorElement, submitBtn);
            }
        }
    }
    
    errorElement.innerHTML = message;
    errorElement.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Função para exibir mensagens de sucesso
function showSuccess(message) {
    // Criar elemento de sucesso se não existir
    let successElement = document.getElementById('form-success-message');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'form-success-message';
        successElement.className = 'success-message';
        
        // Adicionar estilos
        successElement.style.backgroundColor = '#d4edda';
        successElement.style.color = '#155724';
        successElement.style.padding = '10px';
        successElement.style.borderRadius = '5px';
        successElement.style.marginBottom = '15px';
        successElement.style.fontSize = '14px';
        
        // Inserir antes do botão de submit no formulário ativo
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const submitBtn = activeTab.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.parentNode.insertBefore(successElement, submitBtn);
            }
        }
    }
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Esconder após 3 segundos
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

// Função para destacar campos com erro
function highlightField(fieldId, isError) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    if (isError) {
        field.style.borderColor = '#ff4d4d';
        field.style.backgroundColor = '#fff8f8';
    } else {
        field.style.borderColor = '';
        field.style.backgroundColor = '';
    }
}

// Função para redirecionar após login bem-sucedido
function redirectAfterLogin() {
    window.location.href = 'perfil.html'; // Redirecionar para a página de perfil
}

// Função para salvar dados do usuário no Firestore
async function saveUserData(user, additionalData = {}) {
    try {
        if (!user || !user.uid) {
            console.error('Erro ao salvar dados: usuário inválido', user);
            return Promise.reject(new Error('Usuário inválido'));
        }
        
        console.log('Salvando dados do usuário:', user.uid);
        
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || additionalData.nome || '',
            phoneNumber: user.phoneNumber || additionalData.telefone || '',
            photoURL: user.photoURL || '',
            emailVerified: user.emailVerified,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            ...additionalData
        };
        
        // Adicionar createdAt apenas se for um novo usuário ou se não existir
        if (additionalData.isNewUser) {
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Verificar se o documento já existe
        const docRef = db.collection('usuarios').doc(user.uid);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            // Se o documento não existir, garantir que createdAt seja definido
            if (!userData.createdAt) {
                userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            console.log('Criando novo documento de usuário');
        } else {
            console.log('Atualizando documento de usuário existente');
        }
        
        // Salvar os dados com merge para preservar campos existentes
        return await docRef.set(userData, { merge: true });
    } catch (error) {
        console.error('Erro ao salvar dados do usuário:', error);
        return Promise.reject(error);
    }
}

// Função para autenticação com provedor social (Google ou Facebook)
async function signInWithProvider(provider, isSignup = false) {
    try {
        console.log('Iniciando autenticação com provedor:', provider.providerId);
        
        // Mostrar indicador de carregamento
        const activeTab = document.querySelector('.tab-content.active');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Conectando...</p>';
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.margin = '10px 0';
        
        if (activeTab) {
            const socialButtons = activeTab.querySelector('.social-buttons');
            if (socialButtons) {
                socialButtons.appendChild(loadingIndicator);
            }
        }
        
        // Verificar se o provedor está disponível
        if (!provider) {
            throw new Error('Provedor de autenticação não configurado corretamente');
        }
        
        // Verificar domínio atual para autenticação OAuth
        const currentDomain = window.location.hostname;
        console.log('Domínio atual para autenticação:', currentDomain);
        
        // Verificar se estamos em um ambiente móvel
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        let result;
        // Em dispositivos móveis, usar diretamente o redirecionamento para evitar problemas com popups
        if (isMobile) {
            console.log('Dispositivo móvel detectado, usando signInWithRedirect');
            await auth.signInWithRedirect(provider);
            return; // Encerrar função, pois o redirecionamento ocorrerá
        } else {
            try {
                // Em desktop, tentar primeiro com popup (mais rápido)
                result = await auth.signInWithPopup(provider);
                console.log('Login com popup bem-sucedido');
            } catch (popupError) {
                console.warn('Erro no login com popup, tentando com redirect:', popupError);
                // Se falhar com popup, tentar com redirect
                await auth.signInWithRedirect(provider);
                // O resultado será processado após o redirecionamento
                return; // Encerrar função, pois o redirecionamento ocorrerá
            }
        }
        
        const user = result.user;
        const isNewUser = result.additionalUserInfo?.isNewUser || false;
        const providerId = result.additionalUserInfo?.providerId || user.providerData[0]?.providerId || '';
        
        console.log('Autenticação bem-sucedida:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            providerId: providerId,
            isNewUser: isNewUser
        });
        
        // Determinar o provedor para armazenar no Firestore
        let authProvider = 'email';
        if (providerId.includes('google')) {
            authProvider = 'google';
        } else if (providerId.includes('facebook')) {
            authProvider = 'facebook';
        }
        
        // Salvar dados do usuário no Firestore
        await saveUserData(user, {
            providerData: providerId,
            authProvider: authProvider,
            isNewUser: isNewUser,
            termsAccepted: true,
            termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Remover indicador de carregamento
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        showSuccess(isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
        redirectAfterLogin();
    } catch (error) {
        console.error('Erro na autenticação social:', error);
        let errorMessage = 'Ocorreu um erro na autenticação. Tente novamente.';
        
        if (error.code === 'auth/account-exists-with-different-credential') {
            console.log('Erro de credencial existente com outro provedor:', error.email);
            errorMessage = 'Já existe uma conta com este email usando outro método de login. Tente fazer login com ' + 
                          (error.email ? error.email : 'o método usado anteriormente') + '.';
                          
            // Tentar obter os métodos de login disponíveis para este email
            if (error.email) {
                auth.fetchSignInMethodsForEmail(error.email)
                    .then(methods => {
                        console.log('Métodos de login disponíveis para', error.email, ':', methods);
                        if (methods && methods.length > 0) {
                            errorMessage += ' Métodos disponíveis: ' + methods.join(', ');
                            showError(errorMessage);
                        }
                    })
                    .catch(fetchError => {
                        console.error('Erro ao buscar métodos de login:', fetchError);
                    });
            }
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'O processo de login foi cancelado.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Operação cancelada. Tente novamente.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.code === 'auth/operation-not-allowed') {
            console.error('Provedor não habilitado no Firebase Console:', provider.providerId);
            errorMessage = 'Este método de login não está habilitado. Entre em contato com o suporte.';
        } else if (error.code === 'auth/unauthorized-domain') {
            console.error('Domínio não autorizado para autenticação OAuth');
            errorMessage = 'Este site não está autorizado para login social. Entre em contato com o suporte.';
        }
        
        showError(errorMessage);
        
        // Remover indicador de carregamento em caso de erro
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
    }
}

// Login com Google
googleLoginBtn.addEventListener('click', () => signInWithProvider(googleProvider));
googleSignupBtn.addEventListener('click', () => signInWithProvider(googleProvider, true));

// Login com Facebook
facebookLoginBtn.addEventListener('click', () => signInWithProvider(facebookProvider));
facebookSignupBtn.addEventListener('click', () => signInWithProvider(facebookProvider, true));

// Adicionar estilos para o indicador de carregamento
const style = document.createElement('style');
style.textContent = `
.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 15px 0;
}
.spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 3px solid #3498db;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin-bottom: 5px;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

// Login com email e senha
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    if (!email || !senha) {
      showError('Por favor, preencha todos os campos.');
      return;
    }
    
    // Mostrar indicador de carregamento
    const btnLogin = loginForm.querySelector('button[type="submit"]');
    const btnTextoOriginal = btnLogin.textContent;
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';
    
    // Autenticar com Firebase
    auth.signInWithEmailAndPassword(email, senha)
      .then((userCredential) => {
        // Login bem-sucedido
        const user = userCredential.user;
        
        // Atualizar último login no Firestore
        return db.collection('usuarios').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        // Mostrar mensagem de sucesso
        showSuccess('Login realizado com sucesso! Redirecionando...');
        
        // Redirecionar para a página de perfil
        setTimeout(() => {
          window.location.href = 'perfil.html';
        }, 1500);
      })
      .catch((error) => {
        console.error('Erro no login:', error);
        
        // Traduzir mensagens de erro comuns
        let mensagem = 'Erro ao realizar login. Verifique suas credenciais.';
        
        if (error.code === 'auth/user-not-found') {
          mensagem = 'Usuário não encontrado. Verifique seu email.';
        } else if (error.code === 'auth/wrong-password') {
          mensagem = 'Senha incorreta. Tente novamente.';
        } else if (error.code === 'auth/invalid-email') {
          mensagem = 'Email inválido. Verifique o formato do email.';
        } else if (error.code === 'auth/too-many-requests') {
          mensagem = 'Muitas tentativas de login. Tente novamente mais tarde.';
        }
        
        showError(mensagem);
        btnLogin.disabled = false;
        btnLogin.textContent = btnTextoOriginal;
      });
  });
}

// Cadastro com email e senha
cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter valores dos campos
    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const telefone = document.getElementById('cadastro-telefone').value.trim();
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
    const termos = document.getElementById('termos').checked;
    
    // Desabilitar o botão de submit para evitar múltiplos envios
    const submitBtn = cadastroForm.querySelector('.submit-btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Processando...';
    submitBtn.disabled = true;
    
    // Validações mais robustas
    const errors = [];
    
    // Validar nome
    if (!nome) {
        errors.push('Nome é obrigatório');
        highlightField('cadastro-nome', true);
    } else if (nome.length < 3) {
        errors.push('Nome deve ter pelo menos 3 caracteres');
        highlightField('cadastro-nome', true);
    } else {
        highlightField('cadastro-nome', false);
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        errors.push('Email é obrigatório');
        highlightField('cadastro-email', true);
    } else if (!emailRegex.test(email)) {
        errors.push('Email inválido');
        highlightField('cadastro-email', true);
    } else {
        highlightField('cadastro-email', false);
    }
    
    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (telefone) {
        const telefoneClean = telefone.replace(/\D/g, '');
        if (telefoneClean.length < 10 || telefoneClean.length > 11) {
            errors.push('Telefone inválido');
            highlightField('cadastro-telefone', true);
        } else {
            highlightField('cadastro-telefone', false);
        }
    }
    
    // Validar senha
    if (!senha) {
        errors.push('Senha é obrigatória');
        highlightField('cadastro-senha', true);
    } else if (senha.length < 6) {
        errors.push('Senha deve ter pelo menos 6 caracteres');
        highlightField('cadastro-senha', true);
    } else {
        highlightField('cadastro-senha', false);
    }
    
    // Validar confirmação de senha
    if (senha !== confirmarSenha) {
        errors.push('As senhas não coincidem');
        highlightField('cadastro-confirmar-senha', true);
    } else if (confirmarSenha) {
        highlightField('cadastro-confirmar-senha', false);
    }
    
    // Validar termos
    if (!termos) {
        errors.push('Você precisa aceitar os termos de uso e política de privacidade');
        document.querySelector('label[for="termos"]').style.color = '#ff4d4d';
    } else {
        document.querySelector('label[for="termos"]').style.color = '';
    }
    
    // Se houver erros, mostrar e interromper
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        // Restaurar o botão
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        return;
    }
    
    try {
        // Criar usuário
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        
        // Atualizar perfil do usuário
        await userCredential.user.updateProfile({
            displayName: nome
        });
        
        // Salvar dados adicionais no Firestore
        await saveUserData(userCredential.user, {
            nome,
            telefone,
            termsAccepted: true,
            termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Enviar email de verificação
        await userCredential.user.sendEmailVerification();
        
        // Mostrar mensagem de sucesso mais detalhada
        showSuccess('Conta criada com sucesso! Enviamos um email de verificação para ' + email + '. Você será redirecionado para seu perfil em instantes.');
        
        // Dar tempo para o usuário ver a mensagem antes de redirecionar
        setTimeout(() => {
            redirectAfterLogin();
        }, 3000);
    } catch (error) {
        console.error('Erro no cadastro:', error);
        let errorMessage = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está sendo usado por outra conta.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
        
        showError(errorMessage);
        
        // Restaurar o botão
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Verificar se o usuário já está logado
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário já está logado, podemos redirecionar ou mostrar informações
        console.log('Usuário logado:', user.displayName || user.email);
        
        // Atualizar último login no Firestore
        db.collection('usuarios').doc(user.uid).set({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(error => {
            console.error('Erro ao atualizar último login:', error);
        });
        
        // Comentado para permitir testes na página de login
        // redirectAfterLogin();
    } else {
        console.log('Nenhum usuário logado');
    }
});

// Função para recuperar senha com modal mais amigável
document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    
    // Criar modal de recuperação de senha
    const modalHTML = `
        <div class="recovery-modal">
            <div class="recovery-modal-content">
                <h3>Recuperação de Senha</h3>
                <p>Digite seu email para receber um link de recuperação de senha</p>
                <div class="form-group">
                    <input type="email" id="recovery-email" placeholder="Seu email" required>
                </div>
                <div class="recovery-buttons">
                    <button id="cancel-recovery" class="cancel-btn">Cancelar</button>
                    <button id="send-recovery" class="submit-btn">Enviar</button>
                </div>
                <div id="recovery-message" class="message-box"></div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Estilizar modal
    const style = document.createElement('style');
    style.textContent = `
        .recovery-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .recovery-modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 400px;
        }
        .recovery-modal h3 {
            margin-top: 0;
            color: #333;
            font-size: 1.5rem;
        }
        .recovery-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .message-box {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .message-success {
            background-color: #d4edda;
            color: #155724;
            display: block;
        }
        .message-error {
            background-color: #f8d7da;
            color: #721c24;
            display: block;
        }
    `;
    document.head.appendChild(style);
    
    // Adicionar event listeners
    document.getElementById('cancel-recovery').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        document.head.removeChild(style);
    });
    
    document.getElementById('send-recovery').addEventListener('click', async () => {
        const email = document.getElementById('recovery-email').value.trim();
        const messageBox = document.getElementById('recovery-message');
        
        if (!email) {
            messageBox.textContent = 'Por favor, digite seu email';
            messageBox.className = 'message-box message-error';
            return;
        }
        
        try {
            await auth.sendPasswordResetEmail(email);
            messageBox.textContent = 'Email de recuperação enviado. Verifique sua caixa de entrada.';
            messageBox.className = 'message-box message-success';
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                document.body.removeChild(modalContainer);
                document.head.removeChild(style);
            }, 3000);
        } catch (error) {
            console.error('Erro ao enviar email de recuperação:', error);
            let errorMessage = 'Não foi possível enviar o email de recuperação.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Não existe conta com este email.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido. Verifique o formato.';
            }
            
            messageBox.textContent = errorMessage;
            messageBox.className = 'message-box message-error';
        }
    });
});


// Função auxiliar para obter o provedor baseado no ID
function getProviderForId(providerId) {
  if (providerId.includes('google.com')) {
    return googleProvider;
  } else if (providerId.includes('facebook.com')) {
    return facebookProvider;
  } else if (providerId.includes('password')) {
    // Para login com email/senha, precisamos de uma abordagem diferente
    showError('Por favor, faça login com email e senha primeiro, depois tente vincular sua conta.');
    // Mostrar a aba de login
    document.querySelector('[data-tab="login"]').click();
    return null;
  }
  return null;
}