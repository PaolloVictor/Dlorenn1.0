// Script para cadastro de usuários - D.Lorenn

document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDT-aNgU1x_KE2ZAGNm0n-ybwSLlhFlWug",
        authDomain: "dlorenn-a46ca.firebaseapp.com",
        projectId: "dlorenn-a46ca",
        storageBucket: "dlorenn-a46ca.firebasestorage.app",
        messagingSenderId: "506404020523",
        appId: "1:506404020523:web:a2f6219e6c70699d95e56e",
        measurementId: "G-ZL75PD9788"
    };

    // Inicializar Firebase (verificando se já foi inicializado)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Referências aos serviços do Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Elementos DOM
    const cadastroForm = document.getElementById('cadastro-form');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');
    const mensagemErro = document.getElementById('mensagem-erro');
    
    // Verificar estado de autenticação
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Usuário já está logado, redirecionar para a página de perfil
            window.location.href = 'perfil.html';
        }
    });
    
    // Cadastro de usuário
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obter valores do formulário
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const confirmaSenha = document.getElementById('confirma-senha').value;
            
            // Validar senha
            if (senha !== confirmaSenha) {
                mostrarErro('As senhas não coincidem.');
                return;
            }
            
            // Mostrar indicador de carregamento
            const btnCadastrar = cadastroForm.querySelector('button[type="submit"]');
            const btnTextoOriginal = btnCadastrar.textContent;
            btnCadastrar.disabled = true;
            btnCadastrar.textContent = 'Cadastrando...';
            
            // Criar usuário no Firebase Auth
            auth.createUserWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    // Cadastro bem-sucedido
                    const user = userCredential.user;
                    
                    // Salvar dados adicionais no Firestore
                    return db.collection('usuarios').doc(user.uid).set({
                        nome: nome,
                        email: email,
                        dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
                        isAdmin: false // Por padrão, usuários não são administradores
                    });
                })
                .then(() => {
                    // Mostrar mensagem de sucesso
                    mostrarSucesso('Cadastro realizado com sucesso! Redirecionando para o login...');
                    
                    // Fazer logout para que o usuário faça login manualmente
                    return auth.signOut();
                })
                .then(() => {
                    // Redirecionar para a página de login após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                })
                .catch(error => {
                    console.error('Erro no cadastro:', error);
                    
                    // Traduzir mensagens de erro comuns
                    let mensagem = 'Erro ao realizar cadastro. Tente novamente mais tarde.';
                    
                    if (error.code === 'auth/email-already-in-use') {
                        mensagem = 'Este e-mail já está sendo usado por outra conta.';
                    } else if (error.code === 'auth/weak-password') {
                        mensagem = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                    } else if (error.code === 'auth/invalid-email') {
                        mensagem = 'E-mail inválido. Verifique o formato do e-mail.';
                    }
                    
                    mostrarErro(mensagem);
                    btnCadastrar.disabled = false;
                    btnCadastrar.textContent = btnTextoOriginal;
                });
        });
    }
    
    // Funções para exibir mensagens
    function mostrarSucesso(mensagem) {
        if (mensagemSucesso) {
            mensagemSucesso.textContent = mensagem;
            mensagemSucesso.style.display = 'block';
            
            if (mensagemErro) {
                mensagemErro.style.display = 'none';
            }
        }
    }
    
    function mostrarErro(mensagem) {
        if (mensagemErro) {
            mensagemErro.textContent = mensagem;
            mensagemErro.style.display = 'block';
            
            if (mensagemSucesso) {
                mensagemSucesso.style.display = 'none';
            }
        }
    }
});