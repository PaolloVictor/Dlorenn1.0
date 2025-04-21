// Configuração do Firebase (deve ser a mesma do login.js)
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

// Inicializar Firebase (se ainda não estiver inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Referências aos serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Elementos DOM
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const userAddress = document.getElementById('user-address');
const editProfileForm = document.getElementById('edit-profile-form');
const logoutBtn = document.getElementById('logout-btn');
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('avatar-preview');

// Verificar se o usuário está autenticado
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário está logado, carregar dados do perfil
        loadUserProfile(user);
    } else {
        // Usuário não está logado, redirecionar para a página de login
        window.location.href = 'login.html';
    }
});

// Carregar dados do perfil do usuário
async function loadUserProfile(user) {
    try {
        // Buscar dados adicionais do usuário no Firestore
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        const userData = userDoc.data() || {};
        
        // Preencher os campos do perfil
        userName.textContent = user.displayName || userData.nome || 'Usuário';
        userEmail.textContent = user.email || userData.email || '';
        userPhone.textContent = userData.telefone || '';
        userAddress.textContent = userData.endereco || 'Nenhum endereço cadastrado';
        
        // Exibir avatar do usuário
        if (user.photoURL) {
            userAvatar.src = user.photoURL;
            avatarPreview.src = user.photoURL;
        } else {
            // Avatar padrão se não houver foto
            userAvatar.src = 'https://via.placeholder.com/150?text=Usuário';
            avatarPreview.src = 'https://via.placeholder.com/150?text=Usuário';
        }
        
        // Preencher formulário de edição
        document.getElementById('edit-name').value = user.displayName || userData.nome || '';
        document.getElementById('edit-phone').value = userData.telefone || '';
        document.getElementById('edit-address').value = userData.endereco || '';
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        alert('Não foi possível carregar os dados do perfil. Tente novamente mais tarde.');
    }
}

// Atualizar perfil do usuário
editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('edit-name').value.trim();
    const telefone = document.getElementById('edit-phone').value.trim();
    const endereco = document.getElementById('edit-address').value.trim();
    
    // Validações
    const errors = [];
    
    if (!nome) {
        errors.push('Nome é obrigatório');
        document.getElementById('edit-name').classList.add('error-field');
    } else {
        document.getElementById('edit-name').classList.remove('error-field');
    }
    
    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (telefone) {
        const telefoneClean = telefone.replace(/\D/g, '');
        if (telefoneClean.length < 10 || telefoneClean.length > 11) {
            errors.push('Telefone inválido');
            document.getElementById('edit-phone').classList.add('error-field');
        } else {
            document.getElementById('edit-phone').classList.remove('error-field');
        }
    }
    
    // Se houver erros, mostrar e interromper
    if (errors.length > 0) {
        showMessage(errors.join('<br>'), 'error');
        return;
    }
    
    try {
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        // Mostrar indicador de carregamento
        const submitBtn = editProfileForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Salvando...';
        submitBtn.disabled = true;
        
        // Atualizar displayName no Auth
        await user.updateProfile({
            displayName: nome
        });
        
        // Atualizar dados no Firestore
        await db.collection('usuarios').doc(user.uid).update({
            nome: nome,
            telefone: telefone,
            endereco: endereco,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        showMessage('Perfil atualizado com sucesso!', 'success');
        
        // Recarregar dados do perfil
        loadUserProfile(user);
        
        // Fechar modal de edição
        const editModal = document.getElementById('edit-profile-modal');
        if (editModal && typeof editModal.close === 'function') {
            editModal.close();
        }
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showMessage('Não foi possível atualizar o perfil. Tente novamente mais tarde.', 'error');
    }
});

// Função para mostrar mensagens
function showMessage(message, type) {
    // Criar elemento de mensagem se não existir
    let messageElement = document.getElementById('profile-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'profile-message';
        document.querySelector('.perfil-details').prepend(messageElement);
    }
    
    // Configurar estilos baseados no tipo
    if (type === 'error') {
        messageElement.style.backgroundColor = '#f8d7da';
        messageElement.style.color = '#721c24';
    } else {
        messageElement.style.backgroundColor = '#d4edda';
        messageElement.style.color = '#155724';
    }
    
    // Estilos comuns
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.marginBottom = '15px';
    messageElement.style.fontSize = '14px';
    
    messageElement.innerHTML = message;
    messageElement.style.display = 'block';
    
    // Rolar para a mensagem
    messageElement.scrollIntoView({ behavior: 'smooth' });
    
    // Esconder após alguns segundos
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, type === 'error' ? 5000 : 3000);
}

// Upload de avatar
avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione uma imagem.');
        return;
    }
    
    // Exibir preview
    const reader = new FileReader();
    reader.onload = (e) => {
        avatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    try {
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        // Upload para o Firebase Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`avatars/${user.uid}/${file.name}`);
        
        await fileRef.put(file);
        const photoURL = await fileRef.getDownloadURL();
        
        // Atualizar photoURL no Auth
        await user.updateProfile({
            photoURL: photoURL
        });
        
        // Atualizar photoURL no Firestore
        await db.collection('usuarios').doc(user.uid).update({
            photoURL: photoURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar avatar na página
        userAvatar.src = photoURL;
        
        alert('Foto de perfil atualizada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Não foi possível atualizar a foto de perfil. Tente novamente mais tarde.');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Não foi possível fazer logout. Tente novamente.');
    }
});