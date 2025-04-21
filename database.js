// Configuração e funções do banco de dados para usuários - D.Lorenn

// Referência ao banco de dados Firestore
const db = firebase.firestore();

// Coleção de usuários
const usuariosRef = db.collection('usuarios');

// Coleção de pedidos
const pedidosRef = db.collection('pedidos');

// Coleção de endereços
const enderecosRef = db.collection('enderecos');

// Funções para gerenciamento de usuários
const usuariosDB = {
    // Obter dados do usuário atual
    obterUsuarioAtual: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return null;
        
        try {
            const doc = await usuariosRef.doc(user.uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            throw error;
        }
    },
    
    // Criar ou atualizar usuário
    salvarUsuario: async (userData) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            // Dados básicos que sempre serão atualizados
            const dadosBasicos = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || userData.nome || '',
                phoneNumber: user.phoneNumber || userData.telefone || '',
                photoURL: user.photoURL || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Mesclar com dados adicionais fornecidos
            const dadosCompletos = { ...dadosBasicos, ...userData };
            
            // Salvar no Firestore com merge (não sobrescreve campos não especificados)
            await usuariosRef.doc(user.uid).set(dadosCompletos, { merge: true });
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
            throw error;
        }
    },
    
    // Atualizar último login
    atualizarUltimoLogin: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        
        try {
            await usuariosRef.doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Erro ao atualizar último login:', error);
            return false;
        }
    },
    
    // Adicionar endereço ao usuário
    adicionarEndereco: async (endereco) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            // Adicionar ID único ao endereço
            const enderecoCompleto = {
                ...endereco,
                id: firebase.firestore.FieldValue.serverTimestamp().toMillis().toString(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Salvar na subcoleção de endereços do usuário
            await enderecosRef.doc(user.uid).collection('lista').add(enderecoCompleto);
            return true;
        } catch (error) {
            console.error('Erro ao adicionar endereço:', error);
            throw error;
        }
    },
    
    // Obter endereços do usuário
    obterEnderecos: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return [];
        
        try {
            const snapshot = await enderecosRef.doc(user.uid).collection('lista').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao obter endereços:', error);
            return [];
        }
    },
    
    // Atualizar endereço
    atualizarEndereco: async (enderecoId, dadosAtualizados) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            await enderecosRef.doc(user.uid).collection('lista').doc(enderecoId).update({
                ...dadosAtualizados,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            throw error;
        }
    },
    
    // Excluir endereço
    excluirEndereco: async (enderecoId) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            await enderecosRef.doc(user.uid).collection('lista').doc(enderecoId).delete();
            return true;
        } catch (error) {
            console.error('Erro ao excluir endereço:', error);
            throw error;
        }
    },
    
    // Salvar pedido do usuário
    salvarPedido: async (pedidoData) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            // Adicionar informações do usuário e timestamp
            const pedidoCompleto = {
                ...pedidoData,
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName,
                status: 'pendente',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Adicionar à coleção de pedidos
            const docRef = await pedidosRef.add(pedidoCompleto);
            
            // Adicionar referência ao pedido na coleção do usuário
            await usuariosRef.doc(user.uid).collection('pedidos').doc(docRef.id).set({
                pedidoId: docRef.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pendente',
                total: pedidoData.total || 0
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            throw error;
        }
    },
    
    // Obter pedidos do usuário
    obterPedidos: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return [];
        
        try {
            const snapshot = await usuariosRef.doc(user.uid).collection('pedidos')
                .orderBy('createdAt', 'desc')
                .get();
                
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao obter pedidos:', error);
            return [];
        }
    },
    
    // Obter detalhes de um pedido específico
    obterDetalhesPedido: async (pedidoId) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            const doc = await pedidosRef.doc(pedidoId).get();
            if (!doc.exists) throw new Error('Pedido não encontrado');
            
            // Verificar se o pedido pertence ao usuário atual
            const pedidoData = doc.data();
            if (pedidoData.userId !== user.uid) {
                throw new Error('Acesso negado a este pedido');
            }
            
            return {
                id: doc.id,
                ...pedidoData
            };
        } catch (error) {
            console.error('Erro ao obter detalhes do pedido:', error);
            throw error;
        }
    },
    
    // Salvar preferências do usuário
    salvarPreferencias: async (preferencias) => {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        try {
            await usuariosRef.doc(user.uid).update({
                preferencias: preferencias,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            throw error;
        }
    },
    
    // Obter preferências do usuário
    obterPreferencias: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return null;
        
        try {
            const doc = await usuariosRef.doc(user.uid).get();
            if (!doc.exists) return null;
            
            return doc.data().preferencias || {};
        } catch (error) {
            console.error('Erro ao obter preferências:', error);
            return null;
        }
    }
};

// Exportar o objeto para uso em outros arquivos
window.usuariosDB = usuariosDB;