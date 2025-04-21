let prevButton = document.getElementById('prev')
let nextButton = document.getElementById('next')
let container = document.querySelector('.container')
let items = container.querySelectorAll('.list .item')
let indicator = document.querySelector('.indicator')
let dots = indicator.querySelectorAll('ul li')
let list = container.querySelector('.list')

// Variáveis para controle de touch
let touchStartX = 0
let touchEndX = 0
let touchThreshold = 50 // Distância mínima para considerar como swipe

// Função para avançar para o próximo slide
function nextSlide() {
    list.style.setProperty('--calculation', 1)
    active = active + 1 > lastPosition ? 0 : active + 1
    setSlider()
    items[active].classList.add('active')
}

// Função para voltar para o slide anterior
function prevSlide() {
    list.style.setProperty('--calculation', -1)
    active = active - 1 < firstPosition ? lastPosition : active - 1 
    setSlider() 
    items[active].classList.add('active')
}

// Adiciona eventos de touch para o carrossel
list.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
})

list.addEventListener('touchmove', (e) => {
    // Previne o comportamento padrão de scroll da página durante o swipe
    e.preventDefault()
})

list.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX
    handleSwipe()
})

// Função para lidar com o swipe
function handleSwipe() {
    // Calcula a distância do swipe
    const swipeDistance = touchEndX - touchStartX
    
    // Verifica se a distância é suficiente para considerar como swipe
    if (Math.abs(swipeDistance) >= touchThreshold) {
        if (swipeDistance > 0) {
            // Swipe para a direita - slide anterior
            prevSlide()
        } else {
            // Swipe para a esquerda - próximo slide
            nextSlide()
        }
    }
}

const buttonSaiba = document.querySelector('.saiba')
// Pegar elemento do diálogo
const dialog = document.querySelector('.dialog');
const closeButton = document.querySelector('.dialog .close'); // Changed from .fechar to .close
const saibaButtons = document.querySelectorAll('.saiba');

// Adiciona evento de clique para todos os botões "Saiba Mais"
saibaButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Simplesmente abre o modal sem definir posição específica
        // O CSS já está configurado para centralizar o modal na tela
        dialog.showModal();
    });
});

// Fechar diálogo com botão
closeButton.addEventListener('click', () => {
    dialog.close();
});

// Fechar diálogo ao clicar fora
dialog.addEventListener('click', (e) => {
    const dialogDimensions = dialog.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        dialog.close();
    }
});




let active = 0
let firstPosition = 0
let lastPosition = items.length - 1

// Funções do carrinho de compras

// Função para adicionar produto ao carrinho
function adicionarAoCarrinho(produto) {
    // Obter carrinho atual do localStorage
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
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
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Atualizar interface
    atualizarCarrinhoUI();
    
    // Mostrar notificação
    mostrarNotificacao(produto.nome);
    
    // Atualizar contador no ícone do carrinho
    atualizarContadorCarrinho();
}

// Função para atualizar o contador de itens no ícone do carrinho
function atualizarContadorCarrinho() {
    const contadores = document.querySelectorAll('.contador-carrinho');
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Calcular quantidade total de itens
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    // Atualizar todos os contadores na página
    contadores.forEach(contador => {
        contador.textContent = totalItens;
        contador.style.display = totalItens > 0 ? 'flex' : 'none';
    });
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

// Função simplificada para atualizar a interface do carrinho
// Esta versão é chamada em páginas que não são a do carrinho
function atualizarCarrinhoUI() {
    // Se estamos na página do carrinho, a função completa será chamada do carrinho.js
    if (document.getElementById('carrinho-itens')) {
        return;
    }
    
    // Caso contrário, apenas atualiza o contador
    atualizarContadorCarrinho();
}

function setSlider() {
    let itemOld = container.querySelector('.list .item.active')
    itemOld.classList.remove('active')

    let dotaOld = indicator.querySelector('ul li.active')
    dotaOld.classList.remove('active')
    dots[active].classList.add('active')

    indicator.querySelector('.number').innerHTML = '0' + (active + 1)
}

nextButton.onclick = () => {
    nextSlide()
}

prevButton.onclick = () => {
    prevSlide()
}


