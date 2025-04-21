// Script para a página de galeria de produtos

document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidade de busca de produtos
    const buscaInput = document.getElementById('busca-produto');
    const buscaBtn = document.getElementById('busca-btn');
    
    function buscarProdutos() {
        const termoBusca = buscaInput.value.toLowerCase().trim();
        const produtoCards = document.querySelectorAll('.produto-card');
        
        if (termoBusca === '') {
            // Se a busca estiver vazia, mostrar todos os produtos
            produtoCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }
        
        // Filtrar produtos com base no termo de busca
        produtoCards.forEach(card => {
            const titulo = card.querySelector('h3').textContent.toLowerCase();
            const categoria = card.querySelector('.produto-categoria').textContent.toLowerCase();
            
            if (titulo.includes(termoBusca) || categoria.includes(termoBusca)) {
                card.style.display = 'block';
                // Adicionar efeito de destaque temporário
                card.classList.add('produto-destacado');
                setTimeout(() => {
                    card.classList.remove('produto-destacado');
                }, 1500);
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Evento de clique no botão de busca
    if (buscaBtn) {
        buscaBtn.addEventListener('click', buscarProdutos);
    }
    
    // Evento de pressionar Enter no campo de busca
    if (buscaInput) {
        buscaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarProdutos();
            }
        });
    }
    // Menu hambúrguer e menu móvel
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuMobile = document.querySelector('.menu-mobile');
    
    menuHamburguer.addEventListener('click', function() {
        menuHamburguer.classList.toggle('menu-ativo');
        menuMobile.classList.toggle('ativo');
        document.body.classList.toggle('menu-aberto');
    });
    
    // Fechar o menu ao clicar em um link
    const menuLinks = document.querySelectorAll('.menu-mobile a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuHamburguer.classList.remove('menu-ativo');
            menuMobile.classList.remove('ativo');
            document.body.classList.remove('menu-aberto');
        });
    });
    
    // Menu de filtros
    const filtrarBtn = document.getElementById('filtrar-btn');
    const filtrosMenu = document.getElementById('filtros-menu');
    const fecharFiltrosBtn = document.querySelector('.fechar-filtros');
    const aplicarFiltrosBtn = document.querySelector('.aplicar-filtros');
    const filtrosOverlay = document.getElementById('filtros-overlay');
    
    // Abrir menu de filtros
    filtrarBtn.addEventListener('click', function() {
        filtrosMenu.classList.add('ativo');
        filtrosOverlay.classList.add('ativo');
        document.body.classList.add('menu-aberto');
    });
    
    // Fechar menu de filtros
    fecharFiltrosBtn.addEventListener('click', function() {
        filtrosMenu.classList.remove('ativo');
        filtrosOverlay.classList.remove('ativo');
        document.body.classList.remove('menu-aberto');
    });
    
    // Fechar ao clicar no overlay
    filtrosOverlay.addEventListener('click', function() {
        filtrosMenu.classList.remove('ativo');
        filtrosOverlay.classList.remove('ativo');
        document.body.classList.remove('menu-aberto');
    });
    
    // Aplicar filtros e fechar menu
    aplicarFiltrosBtn.addEventListener('click', function() {
        filtrosMenu.classList.remove('ativo');
        filtrosOverlay.classList.remove('ativo');
        document.body.classList.remove('menu-aberto');
    });
    // Elementos da galeria
    const produtoCards = document.querySelectorAll('.produto-card');
    const filtroBotoes = document.querySelectorAll('.filtro-btn');
    const ordenarSelect = document.getElementById('ordenar');
    const paginaBotoes = document.querySelectorAll('.pagina-btn');
    
    // Elementos do modal
    const modal = document.getElementById('produto-modal');
    const fecharModal = document.querySelector('.fechar-modal');
    const verDetalhesBotoes = document.querySelectorAll('.ver-detalhes');
    const modalImg = document.getElementById('modal-img');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalCategoria = document.getElementById('modal-categoria');
    const modalPreco = document.getElementById('modal-preco');
    const modalCores = document.getElementById('modal-cores');
    const tamanhosBotoes = document.querySelectorAll('.tamanho-btn');
    const quantidadeInput = document.getElementById('quantidade');
    const menosBtn = document.querySelector('.qtd-btn.menos');
    const maisBtn = document.querySelector('.qtd-btn.mais');
    const adicionarCarrinhoBtn = document.querySelector('.adicionar-carrinho');
    
    // Configuração para dispositivos móveis (executada apenas uma vez no carregamento)
    function configurarLayoutMobile() {
        const isMobile = window.innerWidth <= 480;
        if (isMobile) {
            const header = document.querySelector('header');
            const galeriaContainer = document.querySelector('.galeria-container');
            
            // Garante que o header fique fixo no topo
            header.style.position = 'fixed';
            header.style.top = '0';
            header.style.left = '0';
            header.style.width = '100%';
            header.style.zIndex = '2500';
            header.style.backgroundColor = '#dd8f7c'; // Restaura a cor original do site (salmão)
            
            // Adiciona uma classe CSS em vez de manipular o estilo diretamente
            // Isso evita que o JavaScript sobrescreva o estilo a cada filtro
            galeriaContainer.classList.add('mobile-layout');
            
            // Definimos um estilo fixo apenas uma vez
            if (!window.mobileGaleriaInitialized) {
                // Cria um estilo para a classe mobile-layout
                const style = document.createElement('style');
                style.textContent = `
                    .galeria-container.mobile-layout {
                        margin-top: 120px !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                `;
                document.head.appendChild(style);
                
                window.mobileGaleriaInitialized = true;
            }
        }
    }
    
    // Executar configuração inicial e adicionar listener para redimensionamento
    configurarLayoutMobile();
    
    // Adiciona um listener para redimensionamento da janela
    window.addEventListener('resize', function() {
        configurarLayoutMobile();
    });
    
    // Adiciona um listener para rolagem da página
    window.addEventListener('scroll', function() {
        const isMobile = window.innerWidth <= 480;
        if (isMobile) {
            const header = document.querySelector('header');
            header.style.position = 'fixed';
            header.style.top = '0';
            header.style.backgroundColor = '#dd8f7c'; // Restaura a cor original do site (salmão)
        }
    });
    
    // Função para aplicar filtros
    function aplicarFiltro(filtro) {
        // Salva a posição atual de rolagem antes de aplicar o filtro
        const scrollPos = window.scrollY;
        
        // Remove a classe active de todos os botões
        filtroBotoes.forEach(b => b.classList.remove('active'));
        
        // Adiciona a classe active ao botão com o data-filter correspondente
        filtroBotoes.forEach(b => {
            if (b.getAttribute('data-filter') === filtro) {
                b.classList.add('active');
            }
        });
        
        // Mostra/esconde os produtos com base no filtro
        produtoCards.forEach(card => {
            if (filtro === 'todos') {
                card.style.display = 'block';
            } else {
                const categorias = card.getAttribute('data-categoria');
                if (categorias.includes(filtro)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
        
        // Tratamento especial para dispositivos móveis
        if (window.innerWidth <= 480) {
            // Não precisamos mais reconfigurar o layout a cada filtro
            // pois agora usamos uma classe CSS fixa
            
            // Desativa temporariamente a rolagem suave
            document.body.style.scrollBehavior = 'auto';
            
            // Restaura a posição de rolagem para manter a galeria no mesmo lugar
            // em vez de voltar ao topo
            setTimeout(() => {
                window.scrollTo(0, scrollPos);
                // Reativa a rolagem suave após um breve delay
                document.body.style.scrollBehavior = '';
            }, 100); // Aumentado para 100ms para garantir que a rolagem seja mantida
        }
    }
    
    // Filtrar produtos - botões no menu lateral
    filtroBotoes.forEach(botao => {
        botao.addEventListener('click', (e) => {
            // Previne o comportamento padrão que pode causar rolagem
            e.preventDefault();
            
            // Salva a posição atual de rolagem antes de aplicar o filtro
            const scrollPos = window.scrollY;
            
            const filtro = botao.getAttribute('data-filter');
            aplicarFiltro(filtro);
            
            // Restaura a posição de rolagem para todos os dispositivos
            setTimeout(() => {
                window.scrollTo(0, scrollPos);
                // Não precisamos mais reconfigurar o layout mobile após a rolagem
                // pois agora usamos uma classe CSS fixa
            }, 100);
        });
    });
    
    // Aplicar filtros ao clicar no botão Aplicar Filtros
    aplicarFiltrosBtn.addEventListener('click', function() {
        // Salva a posição atual de rolagem antes de aplicar o filtro
        const scrollPos = window.scrollY;
        
        const filtroAtivo = document.querySelector('.filtro-btn.active');
        if (filtroAtivo) {
            const filtro = filtroAtivo.getAttribute('data-filter');
            aplicarFiltro(filtro);
            
            // Restaura a posição de rolagem para manter a galeria no mesmo lugar
            setTimeout(() => {
                window.scrollTo(0, scrollPos);
                // Reconfigura o layout mobile novamente após a rolagem
                if (window.innerWidth <= 480) {
                    configurarLayoutMobile();
                }
            }, 50);
        }
    });
    
    // Ordenar produtos
    ordenarSelect.addEventListener('change', () => {
        const valor = ordenarSelect.value;
        const produtos = Array.from(produtoCards);
        
        produtos.sort((a, b) => {
            const precoA = parseFloat(a.querySelector('.produto-preco').textContent.replace('R$ ', '').replace(',', '.'));
            const precoB = parseFloat(b.querySelector('.produto-preco').textContent.replace('R$ ', '').replace(',', '.'));
            const nomeA = a.querySelector('h3').textContent;
            const nomeB = b.querySelector('h3').textContent;
            
            if (valor === 'preco-menor') {
                return precoA - precoB;
            } else if (valor === 'preco-maior') {
                return precoB - precoA;
            } else if (valor === 'nome') {
                return nomeA.localeCompare(nomeB);
            } else {
                // Por padrão, mantém a ordem original (mais recentes)
                return 0;
            }
        });
        
        // Reordena os elementos no DOM
        const produtosGrid = document.querySelector('.produtos-grid');
        produtos.forEach(produto => {
            produtosGrid.appendChild(produto);
        });
    });
    
    // Paginação (simulada)
    paginaBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            if (!botao.classList.contains('next')) {
                paginaBotoes.forEach(b => {
                    if (!b.classList.contains('next')) {
                        b.classList.remove('active');
                    }
                });
                botao.classList.add('active');
                
                // Aqui você poderia implementar a lógica real de paginação
                // Por enquanto, apenas mostra uma mensagem
                const pagina = botao.textContent;
                console.log(`Navegando para a página ${pagina}`);
            } else {
                // Lógica para o botão "próximo"
                const paginaAtual = document.querySelector('.pagina-btn.active');
                const proximaPagina = paginaAtual.nextElementSibling;
                
                if (proximaPagina && !proximaPagina.classList.contains('next')) {
                    paginaAtual.classList.remove('active');
                    proximaPagina.classList.add('active');
                    console.log(`Navegando para a página ${proximaPagina.textContent}`);
                }
            }
        });
    });
    
    // Abrir modal de detalhes do produto
    verDetalhesBotoes.forEach((botao, index) => {
        botao.addEventListener('click', () => {
            const card = produtoCards[index];
            const imagem = card.querySelector('.produto-imagem img').src;
            const titulo = card.querySelector('h3').textContent;
            const categoria = card.querySelector('.produto-categoria').textContent;
            const preco = card.querySelector('.produto-preco').textContent;
            const coresElements = card.querySelectorAll('.cor');
            
            // Preenche o modal com os dados do produto
            modalImg.src = imagem;
            modalTitulo.textContent = titulo;
            modalCategoria.textContent = categoria;
            modalPreco.textContent = preco;
            
            // Limpa e adiciona as cores disponíveis
            modalCores.innerHTML = '';
            coresElements.forEach(cor => {
                const corBtn = document.createElement('button');
                corBtn.className = 'cor-btn';
                corBtn.style.backgroundColor = cor.style.backgroundColor;
                
                corBtn.addEventListener('click', () => {
                    document.querySelectorAll('.cor-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    corBtn.classList.add('selected');
                });
                
                modalCores.appendChild(corBtn);
            });
            
            // Seleciona a primeira cor por padrão
            if (modalCores.firstChild) {
                modalCores.firstChild.classList.add('selected');
            }
            
            // Abre o modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Impede rolagem da página
        });
    });
    
    // Fechar modal
    fecharModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaura rolagem da página
    });
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Selecionar tamanho
    tamanhosBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            tamanhosBotoes.forEach(b => b.classList.remove('selected'));
            botao.classList.add('selected');
        });
    });
    
    // Controles de quantidade
    menosBtn.addEventListener('click', () => {
        const valor = parseInt(quantidadeInput.value);
        if (valor > 1) {
            quantidadeInput.value = valor - 1;
        }
    });
    
    maisBtn.addEventListener('click', () => {
        const valor = parseInt(quantidadeInput.value);
        if (valor < 10) {
            quantidadeInput.value = valor + 1;
        }
    });
    
    // Impede entrada de valores inválidos
    quantidadeInput.addEventListener('change', () => {
        let valor = parseInt(quantidadeInput.value);
        if (isNaN(valor) || valor < 1) {
            valor = 1;
        } else if (valor > 10) {
            valor = 10;
        }
        quantidadeInput.value = valor;
    });
    
    // Adicionar ao carrinho
    adicionarCarrinhoBtn.addEventListener('click', () => {
        const produto = modalTitulo.textContent;
        const quantidade = parseInt(quantidadeInput.value);
        const corSelecionada = document.querySelector('.cor-btn.selected');
        const tamanhoSelecionado = document.querySelector('.tamanho-btn.selected');
        const imagem = modalImg.src;
        const preco = parseFloat(modalPreco.textContent.replace('R$ ', '').replace(',', '.'));
        
        // Verificar se um tamanho foi selecionado
        if (!tamanhoSelecionado) {
            alert('Por favor, selecione um tamanho.');
            return;
        }
        
        // Obter nome da cor selecionada
        const corNome = corSelecionada ? obterNomeCor(corSelecionada.style.backgroundColor) : '';
        
        // Criar objeto do produto
        const produtoObj = {
            id: produto.replace(/\s+/g, '-').toLowerCase(), // Criar ID baseado no nome
            nome: produto,
            quantidade: quantidade,
            cor: corNome,
            tamanho: tamanhoSelecionado.textContent,
            preco: preco,
            imagem: imagem
        };
        
        // Adicionar ao carrinho
        adicionarAoCarrinho(produtoObj);
        
        // Fechar o modal
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Função auxiliar para obter nome da cor a partir do valor RGB/HEX
    function obterNomeCor(cor) {
        // Mapeamento simples de cores
        const cores = {
            'rgb(255, 255, 255)': 'Branco',
            'rgb(0, 0, 0)': 'Preto',
            'rgb(255, 215, 0)': 'Dourado',
            'gold': 'Dourado',
            'silver': 'Prata',
            'rgb(192, 192, 192)': 'Prata',
            'rgb(188, 124, 86)': 'Marrom',
            'rgb(245, 205, 194)': 'Rosa',
            'rgb(141, 226, 227)': 'Azul'
        };
        
        return cores[cor] || cor;
    }
});