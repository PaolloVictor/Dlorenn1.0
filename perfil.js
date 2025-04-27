// Script para gerenciamento de perfil do usuário - D.Lorenn

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
    const storage = firebase.storage();
    
    // Elementos DOM
    const perfilForm = document.getElementById('perfil-form');
    const fotoPerfilInput = document.getElementById('foto-perfil');
    const fotoPerfilPreview = document.getElementById('foto-perfil-preview');
    const nomeUsuario = document.getElementById('nome-usuario');
    const emailUsuario = document.getElementById('email-usuario');
    const telefoneUsuario = document.getElementById('telefone-usuario');
    const enderecoUsuario = document.getElementById('endereco-usuario');
    const cidadeUsuario = document.getElementById('cidade-usuario');
    const estadoUsuario = document.getElementById('estado-usuario');
    const cepUsuario = document.getElementById('cep-usuario');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');
    const mensagemErro = document.getElementById('mensagem-erro');
    const btnSair = document.getElementById('btn-sair');
    
    // Verificar estado de autenticação
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Usuário está logado, carregar dados do perfil
            carregarDadosPerfil(user);
        } else {
            // Usuário não está logado, redirecionar para página de login
            window.location.href = 'login.html';
        }
    });
    
    // Carregar dados do perfil
    function carregarDadosPerfil(user) {
        // Exibir email do usuário
        if (emailUsuario) {
            emailUsuario.value = user.email;
        }
        
        // Buscar dados adicionais no Firestore
        db.collection('usuarios').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const dados = doc.data();
                    
                    // Preencher campos do formulário
                    if (nomeUsuario) nomeUsuario.value = dados.nome || '';
                    if (telefoneUsuario) telefoneUsuario.value = dados.telefone || '';
                    if (enderecoUsuario) enderecoUsuario.value = dados.endereco || '';
                    if (cidadeUsuario) cidadeUsuario.value = dados.cidade || '';
                    if (estadoUsuario) estadoUsuario.value = dados.estado || '';
                    if (cepUsuario) cepUsuario.value = dados.cep || '';
                    
                    // Exibir foto de perfil se existir
                    if (fotoPerfilPreview && dados.fotoURL) {
                        fotoPerfilPreview.innerHTML = `<img src="${dados.fotoURL}" alt="Foto de perfil">`;
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados do perfil:', error);
                mostrarErro('Erro ao carregar dados do perfil. Tente novamente mais tarde.');
            });
    }
    
    // Upload de foto de perfil
    if (fotoPerfilInput) {
        fotoPerfilInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Verificar se é uma imagem
            if (!file.type.match('image.*')) {
                mostrarErro('Por favor, selecione uma imagem válida.');
                return;
            }
            
            // Exibir preview
            const reader = new FileReader();
            reader.onload = function(e) {
                fotoPerfilPreview.innerHTML = `<img src="${e.target.result}" alt="Preview da foto de perfil">`;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Salvar perfil
    if (perfilForm) {
        perfilForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = auth.currentUser;
            if (!user) {
                mostrarErro('Você precisa estar logado para atualizar seu perfil.');
                return;
            }
            
            // Mostrar indicador de carregamento
            const btnSalvar = perfilForm.querySelector('button[type="submit"]');
            const btnTextoOriginal = btnSalvar.textContent;
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';
            
            // Dados do perfil
            const dadosPerfil = {
                nome: nomeUsuario ? nomeUsuario.value : '',
                telefone: telefoneUsuario ? telefoneUsuario.value : '',
                endereco: enderecoUsuario ? enderecoUsuario.value : '',
                cidade: cidadeUsuario ? cidadeUsuario.value : '',
                estado: estadoUsuario ? estadoUsuario.value : '',
                cep: cepUsuario ? cepUsuario.value : '',
                atualizado: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Verificar se há uma nova foto
            const file = fotoPerfilInput.files[0];
            
            // Função para salvar os dados no Firestore
            function salvarDadosPerfil(dadosComFoto) {
                db.collection('usuarios').doc(user.uid).update(dadosComFoto)
                    .then(() => {
                        mostrarSucesso('Perfil atualizado com sucesso!');
                        btnSalvar.disabled = false;
                        btnSalvar.textContent = btnTextoOriginal;
                    })
                    .catch(error => {
                        console.error('Erro ao atualizar perfil:', error);
                        mostrarErro('Erro ao atualizar perfil. Tente novamente mais tarde.');
                        btnSalvar.disabled = false;
                        btnSalvar.textContent = btnTextoOriginal;
                    });
            }
            
            // Se houver uma nova foto, fazer upload
            if (file) {
                const storageRef = storage.ref();
                const fotoRef = storageRef.child(`perfil/${user.uid}/${file.name}`);
                
                fotoRef.put(file)
                    .then(snapshot => snapshot.ref.getDownloadURL())
                    .then(downloadURL => {
                        // Adicionar URL da foto aos dados do perfil
                        dadosPerfil.fotoURL = downloadURL;
                        salvarDadosPerfil(dadosPerfil);
                    })
                    .catch(error => {
                        console.error('Erro ao fazer upload da foto:', error);
                        mostrarErro('Erro ao fazer upload da foto. Tente novamente mais tarde.');
                        btnSalvar.disabled = false;
                        btnSalvar.textContent = btnTextoOriginal;
                    });
            } else {
                // Salvar sem alterar a foto
                salvarDadosPerfil(dadosPerfil);
            }
        });
    }
    
    // Logout
    if (btnSair) {
        btnSair.addEventListener('click', function() {
            auth.signOut()
                .then(() => {
                    window.location.href = 'login.html';
                })
                .catch(error => {
                    console.error('Erro ao fazer logout:', error);
                    mostrarErro('Erro ao fazer logout. Tente novamente mais tarde.');
                });
        });
    }
    
    // Funções para exibir mensagens
    function mostrarSucesso(mensagem) {
        if (mensagemSucesso) {
            mensagemSucesso.textContent = mensagem;
            mensagemSucesso.style.display = 'block';
            
            // Esconder após 5 segundos
            setTimeout(() => {
                mensagemSucesso.style.display = 'none';
            }, 5000);
        }
    }
    
    function mostrarErro(mensagem) {
        if (mensagemErro) {
            mensagemErro.textContent = mensagem;
            mensagemErro.style.display = 'block';
            
            // Esconder após 5 segundos
            setTimeout(() => {
                mensagemErro.style.display = 'none';
            }, 5000);
        }
    }
});