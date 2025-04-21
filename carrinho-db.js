// Integração do carrinho de compras com o banco de dados - D.Lorenn

// Referência ao banco de dados Firestore
const db = firebase.firestore();

// Coleção de carrinhos de compras
const carrinhosRef = db.collection('carrinhos');

// Funções para gerenciamento do carrinho no banco de dados
const carrinhoDB = {
    // Salvar carrinho do usuário no banco de dados
    salvarCarrinho: async (itens) => {
        const user = firebase.auth().currentUser;
        if (!user) return false; // Não salva se não estiver logado
        
        try {
            await carrinhosRef.doc(user.uid).set({
                itens: itens,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Erro ao salvar carrinho:', error);
            return false;
        }
    },
    
    // Carregar carrinho do usuário do banco de dados
    carregarCarrinho: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return null;
        
        try {
            const doc = await carrinhosRef.doc(user.uid).get();
            if (doc.exists) {
                return doc.data().itens || [];
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            return [];
        }
    },
    
    // Adicionar item ao carrinho e salvar no banco de dados
    adicionarItem: async (produto) => {
        const user = firebase.auth().currentUser;
        if (!user) {
            // Se não estiver logado, apenas retorna o produto para ser adicionado localmente
            return produto;
        }
        
        try {
            // Obter carrinho atual
            const carrinhoRef = carrinhosRef.doc(user.uid);
            const doc = await carrinhoRef.get();
            
            let itens = [];
            if (doc.exists) {
                itens = doc.data().itens || [];
            }
            
            // Verificar se o produto já existe no carrinho
            const index = itens.findIndex(item => 
                item.id === produto.id && 
                item.tamanho === produto.tamanho && 
                item.cor === produto.cor
            );
            
            if (index !== -1) {
                // Atualizar quantidade se o produto já existir
                itens[index].quantidade += produto.quantidade;
            } else {
                // Adicionar novo produto
                itens.push(produto);
            }
            
            // Salvar carrinho atualizado
            await carrinhoRef.set({
                itens: itens,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return produto;
        } catch (error) {
            console.error('Erro ao adicionar item ao carrinho:', error);
            return produto; // Retorna o produto mesmo em caso de erro para adicionar localmente
        }
    },
    
    // Remover item do carrinho e atualizar no banco de dados
    removerItem: async (produtoId, tamanho, cor) => {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        
        try {
            // Obter carrinho atual
            const carrinhoRef = carrinhosRef.doc(user.uid);
            const doc = await carrinhoRef.get();
            
            if (!doc.exists) return false;
            
            let itens = doc.data().itens || [];
            
            // Filtrar o item a ser removido
            itens = itens.filter(item => 
                !(item.id === produtoId && 
                  item.tamanho === tamanho && 
                  item.cor === cor)
            );
            
            // Salvar carrinho atualizado
            await carrinhoRef.set({
                itens: itens,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Erro ao remover item do carrinho:', error);
            return false;
        }
    },
    
    // Atualizar quantidade de um item no carrinho
    atualizarQuantidade: async (produtoId, tamanho, cor, quantidade) => {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        
        try {
            // Obter carrinho atual
            const carrinhoRef = carrinhosRef.doc(user.uid);
            const doc = await carrinhoRef.get();
            
            if (!doc.exists) return false;
            
            let itens = doc.data().itens || [];
            
            // Encontrar e atualizar o item
            const index = itens.findIndex(item => 
                item.id === produtoId && 
                item.tamanho === tamanho && 
                item.cor === cor
            );
            
            if (index !== -1) {
                itens[index].quantidade = quantidade;
                
                // Remover item se quantidade for zero
                if (quantidade <= 0) {
                    itens.splice(index, 1);
                }
                
                // Salvar carrinho atualizado
                await carrinhoRef.set({
                    itens: itens,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            return false;
        }
    },
    
    // Limpar carrinho após finalização da compra
    limparCarrinho: async () => {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        
        try {
            await carrinhosRef.doc(user.uid).set({
                itens: [],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            return false;
        }
    },
    
    // Sincronizar carrinho local com o banco de dados quando o usuário faz login
    sincronizarCarrinho: async (carrinhoLocal) => {
        const user = firebase.auth().currentUser;
        if (!user) return carrinhoLocal;
        
        try {
            // Obter carrinho do banco de dados
            const doc = await carrinhosRef.doc(user.uid).get();
            let carrinhoRemoto = [];
            
            if (doc.exists) {
                carrinhoRemoto = doc.data().itens || [];
            }
            
            // Se não houver carrinho local, retornar o remoto
            if (!carrinhoLocal || carrinhoLocal.length === 0) {
                return carrinhoRemoto;
            }
            
            // Se não houver carrinho remoto, salvar o local e retorná-lo
            if (carrinhoRemoto.length === 0) {
                await carrinhosRef.doc(user.uid).set({
                    itens: carrinhoLocal,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return carrinhoLocal;
            }
            
            // Mesclar os carrinhos (estratégia: manter o mais recente em caso de conflito)
            const carrinhoMesclado = [...carrinhoRemoto];
            
            carrinhoLocal.forEach(itemLocal => {
                const index = carrinhoMesclado.findIndex(item => 
                    item.id === itemLocal.id && 
                    item.tamanho === itemLocal.tamanho && 
                    item.cor === itemLocal.cor
                );
                
                if (index !== -1) {
                    // Item já existe, somar quantidades
                    carrinhoMesclado[index].quantidade += itemLocal.quantidade;
                } else {
                    // Item não existe, adicionar
                    carrinhoMesclado.push(itemLocal);
                }
            });
            
            // Salvar carrinho mesclado
            await carrinhosRef.doc(user.uid).set({
                itens: carrinhoMesclado,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return carrinhoMesclado;
        } catch (error) {
            console.error('Erro ao sincronizar carrinho:', error);
            return carrinhoLocal; // Em caso de erro, manter o carrinho local
        }
    }
};

// Exportar o objeto para uso em outros arquivos
window.carrinhoDB = carrinhoDB;