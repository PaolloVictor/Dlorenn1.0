// Sistema de pagamento para D.Lorenn - Integração com MercadoPago

// Configuração do MercadoPago
const mercadoPagoConfig = {
    publicKey: 'TEST-12345678-9abc-def0-1234-56789abcdef0', // Substitua pela sua chave pública de teste
    preferenceUrl: 'https://api.mercadopago.com/checkout/preferences', // URL para criar preferências
    // Em produção, esta URL seria chamada pelo backend para proteger suas credenciais
    sandboxMode: true // Modo sandbox para testes
};

// Inicializar MercadoPago quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Carregar o SDK do MercadoPago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = inicializarMercadoPago;
    document.body.appendChild(script);
    
    // Substituir o botão de finalizar compra original
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.removeEventListener('click', window.finalizarCompraOriginal);
        btnFinalizar.addEventListener('click', iniciarCheckout);
    }
});

// Armazenar a função original de finalizar compra
window.finalizarCompraOriginal = function() {
    alert('Compra finalizada com sucesso! Obrigado por escolher D.Lorenn.');
    // Limpar carrinho após finalizar
    localStorage.removeItem('carrinho');
    atualizarCarrinhoUI();
};

// Inicializar o SDK do MercadoPago
function inicializarMercadoPago() {
    // Inicializar o objeto MercadoPago com a chave pública
    window.mp = new MercadoPago(mercadoPagoConfig.publicKey, {
        locale: 'pt-BR'
    });
    
    console.log('MercadoPago inicializado com sucesso');
}

// Função para iniciar o processo de checkout
async function iniciarCheckout() {
    try {
        // Obter itens do carrinho
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        // Mostrar modal de carregamento
        mostrarModalCarregamento();
        
        // Atualizar o resumo do carrinho com o cálculo de frete correto
        const resumo = atualizarResumoComFrete();
        
        // Criar o container para o botão do MercadoPago se não existir
        criarContainerMercadoPago();
        
        // Em um ambiente real, esta chamada seria feita pelo backend
        // Aqui estamos simulando para fins de demonstração
        const preference = await criarPreferencia(carrinho);
        
        // Criar botão de pagamento
        const bricksBuilder = window.mp.bricks();
        
        // Renderizar botão de pagamento
        bricksBuilder.create('wallet', 'mercadopago-container', {
            initialization: {
                preferenceId: preference.id
            },
            callbacks: {
                onReady: () => {
                    // O Brick está pronto para uso
                    ocultarModalCarregamento();
                    
                    // Mostrar mensagem informativa sobre o modo de teste
                    const infoMsg = document.createElement('div');
                    infoMsg.className = 'pagamento-info';
                    infoMsg.innerHTML = '<i class="fas fa-info-circle"></i> Este é um ambiente de teste. Nenhum pagamento real será processado.';
                    
                    const mpContainer = document.getElementById('mercadopago-container');
                    if (mpContainer && !document.querySelector('.pagamento-info')) {
                        mpContainer.parentNode.insertBefore(infoMsg, mpContainer.nextSibling);
                    }
                    
                    // Adicionar estilo para a mensagem informativa
                    if (!document.querySelector('#pagamento-info-style')) {
                        const style = document.createElement('style');
                        style.id = 'pagamento-info-style';
                        style.textContent = `
                            .pagamento-info {
                                margin-top: 15px;
                                padding: 10px 15px;
                                background-color: rgba(255, 193, 7, 0.1);
                                border-left: 3px solid #FFC107;
                                color: #fff;
                                font-size: 0.9rem;
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                            }
                            .pagamento-info i {
                                color: #FFC107;
                                margin-right: 10px;
                                font-size: 1.1rem;
                            }
                        `;
                        document.head.appendChild(style);
                    }
                },
                onSubmit: () => {
                    // Callback chamado quando o usuário clica no botão de pagamento
                    mostrarModalCarregamento();
                },
                onError: (error) => {
                    // Callback chamado para todos os casos de erro do Brick
                    console.error('Erro no MercadoPago Brick:', error);
                    ocultarModalCarregamento();
                    mostrarNotificacaoPagamento('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.', 'erro');
                }
            }
        });
        
        // Atualizar a mensagem de frete grátis
        atualizarMensagemFrete();
        
    } catch (error) {
        console.error('Erro ao iniciar checkout:', error);
        ocultarModalCarregamento();
        mostrarNotificacaoPagamento('Não foi possível iniciar o processo de pagamento. Por favor, tente novamente mais tarde.', 'erro');
    }
}

// Função para criar preferência de pagamento (simulada)
async function criarPreferencia(carrinho) {
    // Em um ambiente real, esta chamada seria feita pelo backend
    // Aqui estamos simulando para fins de demonstração
    
    // Calcular valores
    const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    const frete = calcularFrete(subtotal);
    const total = subtotal + frete;
    
    // Simular resposta da API
    // Em um ambiente de produção, você enviaria estes dados para o backend
    // e o backend criaria a preferência usando a SDK do MercadoPago
    
    // Adicionar informações do comprador (simulado)
    const comprador = {
        name: "Usuário Teste",
        email: "usuario@teste.com"
    };
    
    return {
        id: 'TEST-' + Math.random().toString(36).substr(2, 9),
        items: carrinho.map(item => ({
            id: item.id,
            title: item.nome,
            quantity: item.quantidade,
            unit_price: item.preco,
            currency_id: 'BRL',
            description: `${item.nome} - Cor: ${item.cor}, Tamanho: ${item.tamanho}`
        })),
        payer: comprador,
        shipments: {
            cost: frete,
            mode: 'not_specified',
        },
        total_amount: total,
        back_urls: {
            success: window.location.origin + "/Dlorenn1.0/carrinho.html?status=success",
            failure: window.location.origin + "/Dlorenn1.0/carrinho.html?status=failure",
            pending: window.location.origin + "/Dlorenn1.0/carrinho.html?status=pending"
        },
        auto_return: "approved"
    };
}

// Função para calcular frete
function calcularFrete(subtotal) {
    // Lógica de cálculo de frete
    if (subtotal >= 300) {
        return 0; // Frete grátis para compras acima de R$ 300
    } else if (subtotal >= 150) {
        return 15; // Frete reduzido para compras acima de R$ 150
    } else {
        return 25; // Frete padrão
    }
}

// Função para verificar e exibir mensagem sobre o frete grátis
function verificarEExibirMensagemFreteGratis() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Calcular quanto falta para frete grátis
    const valorRestante = 300 - subtotal;
    
    // Elemento para exibir a mensagem
    const mensagemFreteElement = document.getElementById('mensagem-frete');
    
    if (!mensagemFreteElement) {
        // Criar o elemento se não existir
        const mensagemDiv = document.createElement('div');
        mensagemDiv.id = 'mensagem-frete';
        mensagemDiv.className = 'mensagem-frete';
        
        // Adicionar após o resumo do carrinho
        const resumoCarrinho = document.getElementById('carrinho-resumo');
        if (resumoCarrinho) {
            resumoCarrinho.parentNode.insertBefore(mensagemDiv, resumoCarrinho.nextSibling);
        }
    }
    
    // Atualizar a mensagem
    const mensagemElement = document.getElementById('mensagem-frete');
    if (mensagemElement) {
        if (valorRestante <= 0) {
            mensagemElement.innerHTML = '<i class="fas fa-truck"></i> Você ganhou <span class="destaque">Frete Grátis</span>!';
            mensagemElement.className = 'mensagem-frete frete-gratis';
        } else {
            mensagemElement.innerHTML = `<i class="fas fa-truck"></i> Faltam <span class="destaque">${formatarMoeda(valorRestante)}</span> para você ganhar <span class="destaque">Frete Grátis</span>`;
            mensagemElement.className = 'mensagem-frete';
        }
    }
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('estilo-mensagem-frete')) {
        const style = document.createElement('style');
        style.id = 'estilo-mensagem-frete';
        style.textContent = `
            .mensagem-frete {
                margin-top: 15px;
                padding: 12px 15px;
                background-color: rgba(40, 40, 40, 0.8);
                border-radius: 10px;
                color: #fff;
                font-size: 0.95rem;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .mensagem-frete i {
                margin-right: 10px;
                font-size: 1.1rem;
                color: #8DE2E3;
            }
            
            .mensagem-frete .destaque {
                color: #8DE2E3;
                font-weight: bold;
                margin: 0 3px;
            }
            
            .mensagem-frete.frete-gratis {
                background-color: rgba(76, 175, 80, 0.2);
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .mensagem-frete.frete-gratis i,
            .mensagem-frete.frete-gratis .destaque {
                color: #4CAF50;
            }
        `;
        document.head.appendChild(style);
    }
    
    return valorRestante <= 0;
}

// Função para formatar valor em Reais
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

// Atualizar o cálculo de frete no carrinho.js também
document.addEventListener('DOMContentLoaded', function() {
    // Sobrescrever a função de atualização do carrinho para usar o mesmo cálculo de frete
    const originalAtualizarCarrinhoUI = window.atualizarCarrinhoUI;
    
    if (typeof originalAtualizarCarrinhoUI === 'function') {
        window.atualizarCarrinhoUI = function() {
            // Chamar a função original primeiro
            originalAtualizarCarrinhoUI.apply(this, arguments);
            
            // Agora atualizar o frete com nossa lógica
            const freteElement = document.getElementById('frete');
            const subtotalElement = document.getElementById('subtotal');
            const totalElement = document.getElementById('total');
            
            if (freteElement && subtotalElement && totalElement) {
                // Extrair o valor do subtotal
                const subtotalText = subtotalElement.textContent;
                const subtotalValue = parseFloat(subtotalText.replace('R$ ', '').replace(',', '.'));
                
                // Calcular o frete usando nossa função
                const frete = calcularFrete(subtotalValue);
                
                // Atualizar o elemento de frete
                freteElement.textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
                
                // Atualizar o total
                const total = subtotalValue + frete;
                totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
                
                // Destacar frete grátis se aplicável
                if (frete === 0) {
                    freteElement.innerHTML = '<span style="color: #8DE2E3; font-weight: bold;">Grátis</span>';
                }
                
                // Atualizar a barra de progresso do frete grátis
                atualizarBarraFreteGratis();
            }
        };
    }
});


// Função para verificar se o usuário tem direito a frete grátis
function verificarFreteGratis() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Retorna true se o subtotal for maior ou igual a 300
    return subtotal >= 300;
}

// Atualizar a mensagem de frete grátis na interface
function atualizarMensagemFrete() {
    const freteInfo = document.createElement('div');
    freteInfo.className = 'frete-info';
    freteInfo.innerHTML = `
        <div class="frete-progresso-container">
            <div class="frete-mensagem">Frete grátis para compras acima de R$ 300,00</div>
            <div class="frete-barra-container">
                <div class="frete-barra" id="frete-barra"></div>
            </div>
        </div>
    `;
    
    // Adicionar após o resumo do carrinho
    const resumoCarrinho = document.getElementById('carrinho-resumo');
    if (resumoCarrinho && !document.querySelector('.frete-info')) {
        resumoCarrinho.parentNode.insertBefore(freteInfo, resumoCarrinho.nextSibling);
        
        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .frete-info {
                margin-top: 20px;
                background-color: rgba(40, 40, 40, 0.8);
                border-radius: 10px;
                padding: 15px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .frete-mensagem {
                color: #fff;
                font-size: 0.9rem;
                margin-bottom: 8px;
                text-align: center;
            }
            
            .frete-barra-container {
                background-color: rgba(255, 255, 255, 0.1);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .frete-barra {
                height: 100%;
                background-color: #8DE2E3;
                width: 0%;
                transition: width 0.5s ease;
            }
        `;
        document.head.appendChild(style);
        
        // Atualizar a barra de progresso
        atualizarBarraFreteGratis();
    }
}

// Atualizar a barra de progresso para frete grátis
function atualizarBarraFreteGratis() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    const barraFrete = document.getElementById('frete-barra');
    
    if (barraFrete) {
        // Calcular a porcentagem do progresso (máximo 100%)
        const porcentagem = Math.min(100, (subtotal / 300) * 100);
        barraFrete.style.width = `${porcentagem}%`;
        
        // Mudar a cor quando atingir 100%
        if (porcentagem >= 100) {
            barraFrete.style.backgroundColor = '#4CAF50';
        } else {
            barraFrete.style.backgroundColor = '#8DE2E3';
        }
    }
}

// Verificar status de pagamento quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar o SDK do MercadoPago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = inicializarMercadoPago;
    document.body.appendChild(script);
    
    // Substituir o botão de finalizar compra original
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.removeEventListener('click', window.finalizarCompraOriginal);
        btnFinalizar.addEventListener('click', iniciarCheckout);
    }
    
    // Verificar se há parâmetros de status na URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status) {
        let mensagem = '';
        let tipo = '';
        
        switch(status) {
            case 'success':
                mensagem = 'Pagamento realizado com sucesso! Seu pedido foi confirmado.';
                tipo = 'sucesso';
                // Limpar carrinho após pagamento bem-sucedido
                localStorage.removeItem('carrinho');
                atualizarCarrinhoUI();
                break;
            case 'pending':
                mensagem = 'Seu pagamento está pendente de confirmação. Você receberá uma notificação quando for processado.';
                tipo = 'pendente';
                break;
            case 'failure':
                mensagem = 'Houve um problema com seu pagamento. Por favor, tente novamente ou escolha outro método de pagamento.';
                tipo = 'erro';
                break;
        }
        
        if (mensagem) {
            setTimeout(() => {
                mostrarNotificacaoPagamento(mensagem, tipo);
            }, 1000); // Pequeno atraso para garantir que a página esteja completamente carregada
        }
    }
    
    // Atualizar o resumo do carrinho com o cálculo de frete correto
    atualizarResumoComFrete();
    
    // Atualizar a mensagem de frete grátis
    atualizarMensagemFrete();
});

// Remover o evento de DOMContentLoaded duplicado
// Inicializar MercadoPago quando o documento estiver carregado
// document.addEventListener('DOMContentLoaded', function() {
//     // Carregar o SDK do MercadoPago
//     const script = document.createElement('script');
//     script.src = 'https://sdk.mercadopago.com/js/v2';
//     script.onload = inicializarMercadoPago;
//     document.body.appendChild(script);
//     
//     // Substituir o botão de finalizar compra original
//     const btnFinalizar = document.getElementById('btn-finalizar');
//     if (btnFinalizar) {
//         btnFinalizar.removeEventListener('click', window.finalizarCompraOriginal);
//         btnFinalizar.addEventListener('click', iniciarCheckout);
//     }
// });

// Função para mostrar notificação de status de pagamento
function mostrarNotificacaoPagamento(mensagem, tipo) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `pagamento-notificacao ${tipo}`;
    
    // Definir ícone baseado no tipo
    let icone = 'fa-info-circle';
    if (tipo === 'sucesso') icone = 'fa-check-circle';
    if (tipo === 'erro') icone = 'fa-times-circle';
    if (tipo === 'pendente') icone = 'fa-clock';
    
    // Definir conteúdo
    notificacao.innerHTML = `
        <i class="fas ${icone}"></i>
        <div class="mensagem">${mensagem}</div>
        <button class="fechar-notificacao"><i class="fas fa-times"></i></button>
    `;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(notificacao);
    
    // Mostrar notificação com animação
    setTimeout(() => {
        notificacao.classList.add('ativo');
    }, 100);
    
    // Adicionar evento para fechar notificação
    const btnFechar = notificacao.querySelector('.fechar-notificacao');
    btnFechar.addEventListener('click', () => {
        notificacao.classList.remove('ativo');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    });
    
    // Fechar automaticamente após 8 segundos
    setTimeout(() => {
        if (document.body.contains(notificacao)) {
            notificacao.classList.remove('ativo');
            setTimeout(() => {
                if (document.body.contains(notificacao)) {
                    notificacao.remove();
                }
            }, 300);
        }
    }, 8000);
}

// Atualizar o resumo do carrinho com o cálculo de frete correto
function atualizarResumoComFrete() {
    const subtotalElement = document.getElementById('subtotal');
    const freteElement = document.getElementById('frete');
    const totalElement = document.getElementById('total');
    
    if (!subtotalElement || !freteElement || !totalElement) return;
    
    // Obter carrinho atual
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Calcular subtotal
    const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Calcular frete usando a função de cálculo de frete
    const frete = calcularFrete(subtotal);
    
    // Calcular total
    const total = subtotal + frete;
    
    // Atualizar elementos na interface
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    freteElement.textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    // Adicionar mensagem de frete grátis se aplicável
    if (frete === 0) {
        freteElement.innerHTML = '<span style="color: #8DE2E3; font-weight: bold;">Grátis</span>';
    }
    
    return { subtotal, frete, total };
}

// Funções para manipular o modal de carregamento
function mostrarModalCarregamento() {
    let modal = document.getElementById('modal-carregamento');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-carregamento';
        modal.className = 'modal-carregamento';
        modal.innerHTML = `
            <div class="modal-conteudo">
                <div class="loader"></div>
                <p>Processando pagamento...</p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Adicionar estilos para o modal
        const style = document.createElement('style');
        style.textContent = `
            .modal-carregamento {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .modal-conteudo {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    modal.style.display = 'flex';
}

function ocultarModalCarregamento() {
    const modal = document.getElementById('modal-carregamento');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para criar o container do MercadoPago
function criarContainerMercadoPago() {
    // Verificar se o container já existe
    let container = document.getElementById('mercadopago-container');
    
    if (!container) {
        // Criar o container para o botão do MercadoPago
        container = document.createElement('div');
        container.id = 'mercadopago-container';
        container.className = 'mercadopago-container';
        
        // Adicionar o container após o botão de finalizar compra
        const btnFinalizar = document.getElementById('btn-finalizar');
        if (btnFinalizar && btnFinalizar.parentNode) {
            btnFinalizar.parentNode.insertBefore(container, btnFinalizar.nextSibling);
        }
    }
    
    // Adicionar estilos para o container do MercadoPago
    const style = document.createElement('style');
    style.textContent = `
        .mercadopago-container {
            margin-top: 20px;
            width: 100%;
        }
        
        .pagamento-notificacao {
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: rgba(40, 40, 40, 0.95);
            color: #fff;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            display: flex;
            align-items: center;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            max-width: 400px;
            width: 90%;
        }
        
        .pagamento-notificacao.ativo {
            transform: translateX(0);
        }
        
        .pagamento-notificacao i {
            font-size: 1.5rem;
            margin-right: 15px;
        }
        
        .pagamento-notificacao .mensagem {
            flex: 1;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        
        .pagamento-notificacao .fechar-notificacao {
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            margin-left: 10px;
            transition: color 0.2s;
        }
        
        .pagamento-notificacao .fechar-notificacao:hover {
            color: white;
        }
        
        .pagamento-notificacao.sucesso {
            border-left: 4px solid #4CAF50;
        }
        
        .pagamento-notificacao.sucesso i {
            color: #4CAF50;
        }
        
        .pagamento-notificacao.erro {
            border-left: 4px solid #F44336;
        }
        
        .pagamento-notificacao.erro i {
            color: #F44336;
        }
        
        .pagamento-notificacao.pendente {
            border-left: 4px solid #FFC107;
        }
        
        .pagamento-notificacao.pendente i {
            color: #FFC107;
        }
        
        @media (max-width: 768px) {
            .pagamento-notificacao {
                width: 85%;
                right: 50%;
                transform: translateX(50%) translateY(-100px);
            }
            
            .pagamento-notificacao.ativo {
                transform: translateX(50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    return container;
}