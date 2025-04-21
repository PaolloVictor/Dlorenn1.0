// Script para gerenciar o carrinho de compras

// Inicializar o carrinho quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar a interface do carrinho
    atualizarCarrinhoUI();
    
    // Botão de finalizar compra
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', function(event) {
            event.preventDefault();
            finalizarCompra();
        });
    }
    
    // Adicionar eventos para os botões de remover e alterar quantidade
    const carrinhoItens = document.getElementById('carrinho-itens');
    if (carrinhoItens) {
        carrinhoItens.addEventListener('click', function(event) {
            // Botão remover item
            if (event.target.classList.contains('btn-remover') || 
                event.target.parentElement.classList.contains('btn-remover')) {
                const itemElement = event.target.closest('.carrinho-item');
                const itemId = itemElement.dataset.id;
                const itemCor = itemElement.dataset.cor;
                const itemTamanho = itemElement.dataset.tamanho;
                removerDoCarrinho(itemId, itemCor, itemTamanho);
            }
            
            // Botões de quantidade
            if (event.target.classList.contains('btn-quantidade')) {
                const itemElement = event.target.closest('.carrinho-item');
                const itemId = itemElement.dataset.id;
                const itemCor = itemElement.dataset.cor;
                const itemTamanho = itemElement.dataset.tamanho;
                const acao = event.target.dataset.acao;
                alterarQuantidade(itemId, itemCor, itemTamanho, acao);
            }
        });
    }
});

// Função para adicionar produto ao carrinho
function adicionarAoCarrinho(produto) {
    // Obter carrinho atual do localStorage
    let carrinho = obterCarrinho();
    
    // Verificar se o produto já existe no carrinho (mesmo produto, cor e tamanho)
    const index = carrinho.findIndex(item => 
        item.id === produto.id && 
        item.cor === produto.cor && 
        item.tamanho === produto.tamanho
    );
    
    if (index !== -1) {
        // Se o produto já existe, apenas atualiza a quantidade
        carrinho[index].quantidade += produto.quantidade;
    } else {
        // Se não existe, adiciona ao carrinho
        carrinho.push(produto);
    }
    
    // Salvar carrinho atualizado
    salvarCarrinho(carrinho);
    
    // Atualizar interface
    atualizarCarrinhoUI();
    
    // Mostrar notificação
    mostrarNotificacao(produto.nome);
}

// Função para remover produto do carrinho
function removerDoCarrinho(id, cor, tamanho) {
    // Obter carrinho atual
    let carrinho = obterCarrinho();
    
    // Encontrar o produto no carrinho
    const index = carrinho.findIndex(item => 
        item.id === id && 
        item.cor === cor && 
        item.tamanho === tamanho
    );
    
    // Se encontrou o produto, remove do carrinho
    if (index !== -1) {
        const nomeProduto = carrinho[index].nome;
        carrinho.splice(index, 1);
        
        // Salvar carrinho atualizado
        salvarCarrinho(carrinho);
        
        // Atualizar interface
        atualizarCarrinhoUI();
        
        // Mostrar notificação de remoção
        mostrarNotificacaoRemocao(`${nomeProduto} foi removido do carrinho`);
    }
}

// Função para alterar a quantidade de um produto
function alterarQuantidade(id, cor, tamanho, acao) {
    // Obter carrinho atual
    let carrinho = obterCarrinho();
    
    // Encontrar o produto no carrinho
    const index = carrinho.findIndex(item => 
        item.id === id && 
        item.cor === cor && 
        item.tamanho === tamanho
    );
    
    // Se encontrou o produto, altera a quantidade
    if (index !== -1) {
        if (acao === 'aumentar') {
            carrinho[index].quantidade += 1;
        } else if (acao === 'diminuir') {
            carrinho[index].quantidade -= 1;
            
            // Se a quantidade for zero ou negativa, remove o produto
            if (carrinho[index].quantidade <= 0) {
                const nomeProduto = carrinho[index].nome;
                carrinho.splice(index, 1);
                mostrarNotificacaoRemocao(`${nomeProduto} foi removido do carrinho`);
            }
        }
        
        // Salvar carrinho atualizado
        salvarCarrinho(carrinho);
        
        // Atualizar interface
        atualizarCarrinhoUI();
    }
}

// Função para finalizar a compra
function finalizarCompra() {
    // Verificar se há itens no carrinho
    const carrinho = obterCarrinho();
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.');
        return;
    }
    
    // Verificar se existe a função de finalização de compra no pagamento.js
    if (typeof window.finalizarCompraOriginal === 'function') {
        window.finalizarCompraOriginal();
    } else {
        // Mostrar mensagem de sucesso
        alert('Compra finalizada com sucesso! Obrigado por escolher D.Lorenn.');
        
        // Limpar carrinho após finalizar
        limparCarrinho();
        atualizarCarrinhoUI();
    }
}

// Função para limpar o carrinho
function limparCarrinho() {
    localStorage.removeItem('carrinho');
    console.log('Carrinho foi limpo completamente');
}

// Função para obter o carrinho do localStorage
function obterCarrinho() {
    return JSON.parse(localStorage.getItem('carrinho')) || [];
}

// Função para salvar o carrinho no localStorage
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Função para calcular o total do carrinho
function calcularTotalCarrinho(carrinho) {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// Função para formatar preço em formato brasileiro
function formatarPreco(preco) {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para atualizar a interface do carrinho
function atualizarCarrinhoUI() {
    try {
        const carrinhoItens = document.getElementById('carrinho-itens');
        const carrinhoVazio = document.getElementById('carrinho-vazio');
        const carrinhoResumo = document.getElementById('carrinho-resumo');
        
        // Se não estamos na página do carrinho, apenas atualizar o contador
        if (!carrinhoItens) {
            atualizarContadorCarrinho();
            return;
        }
        
        // Obter carrinho atual
        const carrinho = obterCarrinho();
        
        // Verificar se o carrinho está vazio
        if (carrinho.length === 0) {
            // Mostrar mensagem de carrinho vazio
            if (carrinhoVazio) carrinhoVazio.style.display = 'block';
            if (carrinhoItens) carrinhoItens.style.display = 'none';
            if (carrinhoResumo) carrinhoResumo.style.display = 'none';
            
            // Atualizar valores no resumo para zero
            const subtotalElement = document.getElementById('subtotal');
            const freteElement = document.getElementById('frete');
            const totalElement = document.getElementById('total');
            
            if (subtotalElement) subtotalElement.textContent = 'R$ 0,00';
            if (freteElement) freteElement.textContent = 'R$ 0,00';
            if (totalElement) totalElement.textContent = 'R$ 0,00';
        } else {
            // Esconder mensagem de carrinho vazio e mostrar itens e resumo
            if (carrinhoVazio) carrinhoVazio.style.display = 'none';
            if (carrinhoItens) carrinhoItens.style.display = 'block';
            if (carrinhoResumo) carrinhoResumo.style.display = 'block';
            
            // Limpar itens atuais
            if (carrinhoItens) carrinhoItens.innerHTML = '';
            
            // Adicionar cada item ao carrinho
            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'carrinho-item';
                itemElement.dataset.id = item.id;
                itemElement.dataset.cor = item.cor || '';
                itemElement.dataset.tamanho = item.tamanho || '';
                
                // Calcular preço total do item
                const precoTotal = item.preco * item.quantidade;
                
                // Criar HTML do item
                itemElement.innerHTML = `
                    <div class="item-imagem">
                        <img src="${item.imagem || 'img/produto-placeholder.jpg'}" alt="${item.nome}">
                    </div>
                    <div class="item-detalhes">
                        <h3>${item.nome}</h3>
                        <p class="item-preco">${formatarPreco(item.preco)}</p>
                        ${item.cor ? `<p class="item-cor">Cor: ${item.cor}</p>` : ''}
                        ${item.tamanho ? `<p class="item-tamanho">Tamanho: ${item.tamanho}</p>` : ''}
                        <div class="item-quantidade">
                            <button class="btn-quantidade" data-acao="diminuir">-</button>
                            <span>${item.quantidade}</span>
                            <button class="btn-quantidade" data-acao="aumentar">+</button>
                        </div>
                        <p class="item-total">Total: ${formatarPreco(precoTotal)}</p>
                        <button class="btn-remover"><i class="fas fa-trash"></i> Remover</button>
                    </div>
                `;
                
                // Adicionar item ao container
                carrinhoItens.appendChild(itemElement);
            });
            
            // Calcular valores do resumo
            const subtotal = calcularTotalCarrinho(carrinho);
            const frete = subtotal > 0 ? 15 : 0; // Frete fixo de R$ 15,00
            const total = subtotal + frete;
            
            // Atualizar valores no resumo
            const subtotalElement = document.getElementById('subtotal');
            const freteElement = document.getElementById('frete');
            const totalElement = document.getElementById('total');
            
            if (subtotalElement) subtotalElement.textContent = formatarPreco(subtotal);
            if (freteElement) freteElement.textContent = formatarPreco(frete);
            if (totalElement) totalElement.textContent = formatarPreco(total);
        }
        
        // Atualizar contador no ícone do carrinho
        atualizarContadorCarrinho();
    } catch (error) {
        console.error('Erro ao atualizar interface do carrinho:', error);
    }
}

// Função para atualizar o contador de itens no carrinho
function atualizarContadorCarrinho() {
    try {
        // Verificar se a função global existe
        if (typeof window.atualizarContadorCarrinho === 'function') {
            window.atualizarContadorCarrinho();
            return;
        }
        
        // Implementação local caso não esteja disponível globalmente
        const contadores = document.querySelectorAll('.contador-carrinho');
        const carrinho = obterCarrinho();
        
        // Calcular quantidade total de itens
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        
        // Atualizar todos os contadores na página
        contadores.forEach(contador => {
            contador.textContent = totalItens;
            contador.style.display = totalItens > 0 ? 'flex' : 'none';
        });
    } catch (error) {
        console.error('Erro ao atualizar contador do carrinho:', error);
    }
}

// Função para mostrar notificação de produto adicionado
function mostrarNotificacao(nomeProduto) {
    // Verificar se já existe uma notificação
    let notificacao = document.querySelector('.carrinho-notificacao');
    
    // Se não existir, criar uma nova
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.className = 'carrinho-notificacao';
        document.body.appendChild(notificacao);
    }
    
    // Definir conteúdo
    notificacao.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div>
            <strong>${nomeProduto}</strong> foi adicionado ao carrinho!
        </div>
    `;
    
    // Mostrar notificação
    setTimeout(() => {
        notificacao.classList.add('ativo');
    }, 100);
    
    // Esconder após 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('ativo');
    }, 3000);
}

// Função para mostrar notificação de remoção de produto
function mostrarNotificacaoRemocao(mensagem) {
    // Verificar se já existe uma notificação
    let notificacao = document.querySelector('.carrinho-notificacao');
    
    // Se não existir, criar uma nova
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.className = 'carrinho-notificacao';
        document.body.appendChild(notificacao);
    }
    
    // Definir conteúdo para remoção
    notificacao.innerHTML = `
        <i class="fas fa-trash-alt" style="color: #ff4d4d;"></i>
        <div>
            ${mensagem}
        </div>
    `;
    
    // Mostrar notificação
    setTimeout(() => {
        notificacao.classList.add('ativo');
    }, 100);
    
    // Esconder após 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('ativo');
    }, 3000);
}

// Exportar funções para uso global
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.atualizarCarrinhoUI = atualizarCarrinhoUI;
window.limparCarrinho = limparCarrinho;
window.obterCarrinho = obterCarrinho;