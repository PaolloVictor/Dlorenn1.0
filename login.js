// Configuração do Firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDT-aNgU1x_KE2ZAGNm0n-ybwSLlhFlWug",
  authDomain: "dlorenn-a46ca.firebaseapp.com",
  projectId: "dlorenn-a46ca",
  storageBucket: "dlorenn-a46ca.firebasestorage.app",
  messagingSenderId: "506404020523",
  appId: "1:506404020523:web:a2f6219e6c70699d95e56e",
  measurementId: "G-ZL75PD9788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
function saveUserData(user, additionalData = {}) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.nome || '',
        phoneNumber: user.phoneNumber || additionalData.telefone || '',
        photoURL: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        ...additionalData
    };
    
    return db.collection('usuarios').doc(user.uid).set(userData, { merge: true });
}

// Login com email e senha
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const lembrar = document.getElementById('lembrar').checked;
    
    try {
        // Definir persistência com base na opção "lembrar-me"
        await auth.setPersistence(lembrar ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION
        );
        
        // Fazer login
        const userCredential = await auth.signInWithEmailAndPassword(email, senha);
        
        // Atualizar último login
        await db.collection('usuarios').doc(userCredential.user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccess('Login realizado com sucesso!');
        redirectAfterLogin();
    } catch (error) {
        console.error('Erro no login:', error);
        let errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Email ou senha incorretos.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
        }
        
        showError(errorMessage);
    }
});

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
        return;
    }
    
    try {
        console.log('Tentando criar usuário com email:', email);
        // Criar usuário
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        console.log('Usuário criado com sucesso:', userCredential.user.uid);
        
        // Atualizar perfil do usuário
        console.log('Atualizando perfil com nome:', nome);
        await userCredential.user.updateProfile({
            displayName: nome
        });
        
        // Salvar dados adicionais no Firestore
        console.log('Salvando dados adicionais no Firestore');
        await saveUserData(userCredential.user, {
            nome,
            telefone,
            termsAccepted: true,
            termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccess('Conta criada com sucesso!');
        // Comentado para permitir verificar se o cadastro foi bem-sucedido
        // redirectAfterLogin();
    } catch (error) {
        console.error('Erro no cadastro:', error);
        let errorMessage = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está sendo usado por outra conta.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        }
        
        showError(errorMessage);
    }
});

// Login com Google
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        
        // Verificar se é um novo usuário
        const isNewUser = userCredential.additionalUserInfo.isNewUser;
        
        // Salvar dados do usuário
        await saveUserData(userCredential.user, {
            termsAccepted: true,
            termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            authProvider: 'google'
        });
        
        showSuccess(isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
        redirectAfterLogin();
    } catch (error) {
        console.error('Erro no login com Google:', error);
        showError('Ocorreu um erro ao fazer login com Google. Tente novamente.');
    }
}

// Login com Facebook
async function signInWithFacebook() {
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        
        // Verificar se é um novo usuário
        const isNewUser = userCredential.additionalUserInfo.isNewUser;
        
        // Salvar dados do usuário
        await saveUserData(userCredential.user, {
            termsAccepted: true,
            termsAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            authProvider: 'facebook'
        });
        
        showSuccess(isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
        redirectAfterLogin();
    } catch (error) {
        console.error('Erro no login com Facebook:', error);
        showError('Ocorreu um erro ao fazer login com Facebook. Tente novamente.');
    }
}

// Eventos para botões de login social
googleLoginBtn.addEventListener('click', signInWithGoogle);
facebookLoginBtn.addEventListener('click', signInWithFacebook);
googleSignupBtn.addEventListener('click', signInWithGoogle);
facebookSignupBtn.addEventListener('click', signInWithFacebook);

// Verificar se o usuário já está logado
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário já está logado, redirecionar para a página de perfil
        // Comentado para permitir testes na página de login
        // redirectAfterLogin();
        console.log('Usuário logado:', user.displayName);
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