// Script para o painel de administração - D.Lorenn

document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Firebase
    // Configuração do Firebase usando a versão compat (compatibilidade)
    const firebaseConfig = {
        apiKey: "AIzaSyDT-aNgU1x_KE2ZAGNm0n-ybwSLlhFlWug",
        authDomain: "dlorenn-a46ca.firebaseapp.com",
        projectId: "dlorenn-a46ca",
        storageBucket: "dlorenn-a46ca.appspot.com",
        messagingSenderId: "506404020523",
        appId: "1:506404020523:web:a2f6219e6c70699d95e56e",
        measurementId: "G-ZL75PD9788"
    };

    // Inicializar Firebase (verificando se já foi inicializado)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Habilitar analytics se disponível
    if (firebase.analytics) {
        firebase.analytics();
    }

    // Referências aos serviços do Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Referências às coleções
    const produtosRef = db.collection('produtos');
    const categoriasRef = db.collection('categorias');

    // Elementos DOM - Login
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLoginContainer = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');
    const loginError = document.getElementById('login-error');

    // Elementos DOM - Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Elementos DOM - Produtos
    const produtosLista = document.getElementById('produtos-lista');
    const adicionarProdutoBtn = document.getElementById('adicionar-produto-btn');
    const produtoModal = document.getElementById('produto-modal');
    const produtoForm = document.getElementById('produto-form');
    const modalTitulo = document.getElementById('modal-titulo');
    const produtoId = document.getElementById('produto-id');
    const buscaAdmin = document.getElementById('busca-admin');
    const buscaAdminBtn = document.getElementById('busca-admin-btn');

    // Elementos DOM - Categorias
    const categoriasLista = document.getElementById('categorias-lista');
    const adicionarCategoriaBtn = document.getElementById('adicionar-categoria-btn');
    const categoriaModal = document.getElementById('categoria-modal');
    const categoriaForm = document.getElementById('categoria-form');
    const categoriaModalTitulo = document.getElementById('categoria-modal-titulo');

    // Elementos DOM - Confirmação
    const confirmacaoModal = document.getElementById('confirmacao-modal');
    const confirmacaoMensagem = document.getElementById('confirmacao-mensagem');
    const confirmarExclusaoBtn = document.getElementById('confirmar-exclusao');

    // Elementos DOM - Overlay
    const overlay = document.getElementById('overlay');

    // Elementos DOM - Cores
    const coresContainer = document.getElementById('cores-container');
    const adicionarCorBtn = document.getElementById('adicionar-cor');

    // Elementos DOM - Estatísticas
    const totalProdutos = document.getElementById('total-produtos');
    const vendasMes = document.getElementById('vendas-mes');
    const produtosPopulares = document.getElementById('produtos-populares');

    // Verificar estado de autenticação
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Verificar se o usuário é administrador
            db.collection('usuarios').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().isAdmin) {
                        // Mostrar painel de administração
                        adminLoginContainer.style.display = 'none';
                        adminPanel.style.display = 'block';
                        
                        // Carregar dados iniciais
                        carregarProdutos();
                        carregarCategorias();
                        carregarEstatisticas();
                    } else {
                        // Não é administrador, fazer logout
                        auth.signOut();
                        mostrarErro('Você não tem permissão de administrador.');
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar permissões:', error);
                    mostrarErro('Erro ao verificar permissões de administrador.');
                });
        } else {
            // Usuário não autenticado, mostrar tela de login
            adminLoginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
        }
    });

    // Função para mostrar mensagem de erro
    function mostrarErro(mensagem) {
        loginError.textContent = mensagem;
        loginError.style.display = 'block';
    }

    // Login de administrador
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('admin-email').value;
            const senha = document.getElementById('admin-senha').value;
            
            loginError.style.display = 'none';
            
            auth.signInWithEmailAndPassword(email, senha)
                .catch(error => {
                    console.error('Erro de login:', error);
                    mostrarErro('Credenciais inválidas. Verifique seu email e senha.');
                });
        });
    }

    // Alternar entre as abas
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

    // Funções para gerenciar modais
    function abrirModal(modal) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    function fecharModal(modal) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    // Fechar modais ao clicar no botão de fechar ou no overlay
    document.querySelectorAll('.fechar-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-modal').forEach(modal => {
                fecharModal(modal);
            });
        });
    });

    overlay.addEventListener('click', () => {
        document.querySelectorAll('.admin-modal').forEach(modal => {
            fecharModal(modal);
        });
    });

    document.querySelectorAll('.cancelar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-modal').forEach(modal => {
                fecharModal(modal);
            });
        });
    });

    // Adicionar nova cor
    if (adicionarCorBtn) {
        adicionarCorBtn.addEventListener('click', () => {
            const corItem = document.createElement('div');
            corItem.className = 'cor-item';
            corItem.innerHTML = `
                <input type="color" class="cor-input" value="#ffffff">
                <button type="button" class="remover-cor"><i class="fas fa-times"></i></button>
            `;
            
            // Inserir antes do botão de adicionar
            coresContainer.insertBefore(corItem, adicionarCorBtn);
            
            // Adicionar evento para remover cor
            corItem.querySelector('.remover-cor').addEventListener('click', () => {
                corItem.remove();
            });
        });
    }

    // Remover cor (para cores existentes)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remover-cor')) {
            e.target.closest('.cor-item').remove();
        }
    });

    // Carregar produtos
    function carregarProdutos() {
        produtosRef.get()
            .then(snapshot => {
                produtosLista.innerHTML = '';
                
                if (snapshot.empty) {
                    produtosLista.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado</td></tr>';
                    return;
                }
                
                snapshot.forEach(doc => {
                    const produto = doc.data();
                    produto.id = doc.id;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <img src="${produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : 'img/d.lorem1.png'}" alt="${produto.nome}">
                        </td>
                        <td>${produto.nome}</td>
                        <td>${produto.categoria}</td>
                        <td>R$ ${produto.preco.toFixed(2)}</td>
                        <td>
                            ${produto.cores ? produto.cores.map(cor => `<span class="cor" style="background-color: ${cor}; display: inline-block; width: 15px; height: 15px; border-radius: 50%; margin-right: 3px;"></span>`).join('') : ''}
                        </td>
                        <td>${produto.tamanhos ? produto.tamanhos.join(', ') : ''}</td>
                        <td>
                            <div class="acoes-btns">
                                <button class="editar-btn" data-id="${produto.id}"><i class="fas fa-edit"></i></button>
                                <button class="excluir-btn" data-id="${produto.id}"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    `;
                    
                    produtosLista.appendChild(row);
                });
                
                // Atualizar contador de produtos
                if (totalProdutos) {
                    totalProdutos.textContent = snapshot.size;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar produtos:', error);
                produtosLista.innerHTML = '<tr><td colspan="7" class="text-center">Erro ao carregar produtos</td></tr>';
            });
    }

    // Carregar categorias
    function carregarCategorias() {
        categoriasRef.get()
            .then(snapshot => {
                categoriasLista.innerHTML = '';
                
                if (snapshot.empty) {
                    categoriasLista.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma categoria encontrada</td></tr>';
                    return;
                }
                
                snapshot.forEach(doc => {
                    const categoria = doc.data();
                    categoria.id = doc.id;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${categoria.nome}</td>
                        <td>${categoria.descricao || ''}</td>
                        <td>${categoria.produtosCount || 0}</td>
                        <td>
                            <div class="acoes-btns">
                                <button class="editar-categoria-btn" data-id="${categoria.id}"><i class="fas fa-edit"></i></button>
                                <button class="excluir-categoria-btn" data-id="${categoria.id}"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    `;
                    
                    categoriasLista.appendChild(row);
                });
                
                // Atualizar select de categorias no formulário de produto
                const categoriasSelect = document.getElementById('produto-categoria');
                if (categoriasSelect) {
                    // Manter apenas a opção padrão
                    categoriasSelect.innerHTML = '<option value="">Selecione...</option>';
                    
                    snapshot.forEach(doc => {
                        const categoria = doc.data();
                        const option = document.createElement('option');
                        option.value = categoria.nome.toLowerCase();
                        option.textContent = categoria.nome;
                        categoriasSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar categorias:', error);
                categoriasLista.innerHTML = '<tr><td colspan="4" class="text-center">Erro ao carregar categorias</td></tr>';
            });
    }

    // Carregar estatísticas
    function carregarEstatisticas() {
        // Aqui você pode implementar a lógica para carregar estatísticas reais
        // Por enquanto, vamos usar dados de exemplo
        if (produtosPopulares) {
            produtosPopulares.innerHTML = `
                <li><span>Sandália Brilhante</span> <span>32 vendas</span></li>
                <li><span>Sandália Dourada</span> <span>28 vendas</span></li>
                <li><span>Sandália Branca</span> <span>25 vendas</span></li>
                <li><span>Sandália Elegante</span> <span>20 vendas</span></li>
                <li><span>Sandália Conforto</span> <span>18 vendas</span></li>
            `;
        }
        
        if (vendasMes) {
            vendasMes.textContent = 'R$ 5.890,00';
        }
    }

    // Adicionar produto
    if (adicionarProdutoBtn) {
        adicionarProdutoBtn.addEventListener('click', () => {
            // Limpar formulário
            produtoForm.reset();
            produtoId.value = '';
            modalTitulo.textContent = 'Adicionar Produto';
            
            // Limpar preview de imagem
            const imagemPreview = document.getElementById('imagem-preview');
            if (imagemPreview) {
                imagemPreview.innerHTML = '';
            }
            
            // Resetar cores (manter apenas uma)
            const coresItems = document.querySelectorAll('.cor-item');
            coresItems.forEach((item, index) => {
                if (index > 0) item.remove();
            });
            
            // Abrir modal
            abrirModal(produtoModal);
        });
    }

    // Adicionar categoria
    if (adicionarCategoriaBtn) {
        adicionarCategoriaBtn.addEventListener('click', () => {
            // Limpar formulário
            categoriaForm.reset();
            document.getElementById('categoria-id').value = '';
            categoriaModalTitulo.textContent = 'Adicionar Categoria';
            
            // Abrir modal
            abrirModal(categoriaModal);
        });
    }

    // Editar produto
    document.addEventListener('click', function(e) {
        if (e.target.closest('.editar-btn')) {
            const id = e.target.closest('.editar-btn').getAttribute('data-id');
            
            produtosRef.doc(id).get()
                .then(doc => {
                    if (!doc.exists) {
                        console.error('Produto não encontrado');
                        return;
                    }
                    
                    const produto = doc.data();
                    
                    // Preencher formulário
                    produtoId.value = id;
                    document.getElementById('produto-nome').value = produto.nome;
                    document.getElementById('produto-descricao').value = produto.descricao || '';
                    document.getElementById('produto-preco').value = produto.preco;
                    document.getElementById('produto-categoria').value = produto.categoria;
                    
                    // Preencher cores
                    const coresItems = document.querySelectorAll('.cor-item');
                    coresItems.forEach((item, index) => {
                        if (index > 0) item.remove();
                    });
                    
                    if (produto.cores && produto.cores.length > 0) {
                        // Definir a primeira cor
                        document.querySelector('.cor-input').value = produto.cores[0];
                        
                        // Adicionar cores adicionais
                        for (let i = 1; i < produto.cores.length; i++) {
                            const corItem = document.createElement('div');
                            corItem.className = 'cor-item';
                            corItem.innerHTML = `
                                <input type="color" class="cor-input" value="${produto.cores[i]}">
                                <button type="button" class="remover-cor"><i class="fas fa-times"></i></button>
                            `;
                            
                            coresContainer.insertBefore(corItem, adicionarCorBtn);
                            
                            corItem.querySelector('.remover-cor').addEventListener('click', () => {
                                corItem.remove();
                            });
                        }
                    }
                    
                    // Preencher tamanhos
                    const tamanhoCheckboxes = document.querySelectorAll('input[name="tamanhos"]');
                    tamanhoCheckboxes.forEach(checkbox => {
                        checkbox.checked = produto.tamanhos && produto.tamanhos.includes(checkbox.value);
                    });
                    
                    // Preencher preview de imagem
                    const imagemPreview = document.getElementById('imagem-preview');
                    if (imagemPreview && produto.imagens && produto.imagens.length > 0) {
                        imagemPreview.innerHTML = `<img src="${produto.imagens[0]}" alt="${produto.nome}">`;
                    }
                    
                    modalTitulo.textContent = 'Editar Produto';
                    abrirModal(produtoModal);
                })
                .catch(error => {
                    console.error('Erro ao carregar produto:', error);
                });
        }
    });

    // Editar categoria
    document.addEventListener('click', function(e) {
        if (e.target.closest('.editar-categoria-btn')) {
            const id = e.target.closest('.editar-categoria-btn').getAttribute('data-id');
            
            categoriasRef.doc(id).get()
                .then(doc => {
                    if (!doc.exists) {
                        console.error('Categoria não encontrada');
                        return;
                    }
                    
                    const categoria = doc.data();
                    
                    // Preencher formulário
                    document.getElementById('categoria-id').value = id;
                    document.getElementById('categoria-nome').value = categoria.nome;
                    document.getElementById('categoria-descricao').value = categoria.descricao || '';
                    
                    categoriaModalTitulo.textContent = 'Editar Categoria';
                    abrirModal(categoriaModal);
                })
                .catch(error => {
                    console.error('Erro ao carregar categoria:', error);
                });
        }
    });

    // Excluir produto
    document.addEventListener('click', function(e) {
        if (e.target.closest('.excluir-btn')) {
            const id = e.target.closest('.excluir-btn').getAttribute('data-id');
            const row = e.target.closest('tr');
            const nomeProduto = row.querySelector('td:nth-child(2)').textContent;
            
            confirmacaoMensagem.textContent = `Tem certeza que deseja excluir o produto "${nomeProduto}"?`;
            
            confirmarExclusaoBtn.onclick = function() {
                produtosRef.doc(id).delete()
                    .then(() => {
                        fecharModal(confirmacaoModal);
                        carregarProdutos();
                    })
                    .catch(error => {
                        console.error('Erro ao excluir produto:', error);
                    });
            };
            
            abrirModal(confirmacaoModal);
        }
    });

    // Excluir categoria
    document.addEventListener('click', function(e) {
        if (e.target.closest('.excluir-categoria-btn')) {
            const id = e.target.closest('.excluir-categoria-btn').getAttribute('data-id');
            const row = e.target.closest('tr');
            const nomeCategoria = row.querySelector('td:nth-child(1)').textContent;
            
            confirmacaoMensagem.textContent = `Tem certeza que deseja excluir a categoria "${nomeCategoria}"?`;
            
            confirmarExclusaoBtn.onclick = function() {
                categoriasRef.doc(id).delete()
                    .then(() => {
                        fecharModal(confirmacaoModal);
                        carregarCategorias();
                    })
                    .catch(error => {
                        console.error('Erro ao excluir categoria:', error);
                    });
            };
            
            abrirModal(confirmacaoModal);
        }
    });

    // Salvar produto
    if (produtoForm) {
        produtoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = produtoId.value;
            const nome = document.getElementById('produto-nome').value;
            const descricao = document.getElementById('produto-descricao').value;
            const preco = parseFloat(document.getElementById('produto-preco').value);
            const categoria = document.getElementById('produto-categoria').value;
            
            // Obter cores selecionadas
            const coresInputs = document.querySelectorAll('.cor-input');
            const cores = Array.from(coresInputs).map(input => input.value);
            
            // Obter tamanhos selecionados
            const tamanhoCheckboxes = document.querySelectorAll('input[name="tamanhos"]:checked');
            const tamanhos = Array.from(tamanhoCheckboxes).map(checkbox => checkbox.value);
            
            // Criar objeto do produto
            const produto = {
                nome,
                descricao,
                preco,
                categoria,
                cores,
                tamanhos,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Verificar se há uma imagem para upload
            const imagemInput = document.getElementById('produto-imagem');
            
            if (imagemInput.files.length > 0) {
                // Upload da imagem
                const file = imagemInput.files[0];
                const storageRef = storage.ref(`produtos/${id || Date.now()}_${file.name}`);
                
                storageRef.put(file)
                    .then(snapshot => snapshot.ref.getDownloadURL())
                    .then(downloadURL => {
                        produto.imagens = [downloadURL];
                        salvarProduto(id, produto);
                    })
                    .catch(error => {
                        console.error('Erro ao fazer upload da imagem:', error);
                        // Salvar produto mesmo sem imagem
                        salvarProduto(id, produto);
                    });
            } else {
                // Salvar produto sem alterar a imagem
                salvarProduto(id, produto);
            }
        });
    }

    // Função para salvar produto
    function salvarProduto(id, produto) {
        let promise;
        
        if (id) {
            // Atualizar produto existente
            promise = produtosRef.doc(id).update(produto);
        } else {
            // Adicionar timestamp de criação para novos produtos
            produto.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = produtosRef.add(produto);
        }
        
        promise
            .then(() => {
                fecharModal(produtoModal);
                carregarProdutos();
            })
            .catch(error => {
                console.error('Erro ao salvar produto:', error);
            });
    }

    // Salvar categoria
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('categoria-id').value;
            const nome = document.getElementById('categoria-nome').value;
            const descricao = document.getElementById('categoria-descricao').value;
            
            const categoria = {
                nome,
                descricao,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            let promise;
            
            if (id) {
                // Atualizar categoria existente
                promise = categoriasRef.doc(id).update(categoria);
            } else {
                // Adicionar timestamp de criação para novas categorias
                categoria.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                categoria.produtosCount = 0;
                promise = categoriasRef.add(categoria);
            }
            
            promise
                .then(() => {
                    fecharModal(categoriaModal);
                    carregarCategorias();
                })
                .catch(error => {
                    console.error('Erro ao salvar categoria:', error);
                });
        });
    }

    // Preview de imagem
    const produtoImagem = document.getElementById('produto-imagem');
    if (produtoImagem) {
        produtoImagem.addEventListener('change', function() {
            const imagemPreview = document.getElementById('imagem-preview');
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagemPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Busca de produtos
    if (buscaAdminBtn) {
        buscaAdminBtn.addEventListener('click', function() {
            const termo = buscaAdmin.value.toLowerCase().trim();
            
            if (termo === '') {
                carregarProdutos();
                return;
            }
            
            produtosRef.get()
                .then(snapshot => {
                    produtosLista.innerHTML = '';
                    
                    let encontrados = 0;
                    
                    snapshot.forEach(doc => {
                        const produto = doc.data();
                        produto.id = doc.id;
                        
                        if (produto.nome.toLowerCase().includes(termo) || 
                            produto.categoria.toLowerCase().includes(termo) || 
                            (produto.descricao && produto.descricao.toLowerCase().includes(termo))) {
                            
                            encontrados++;
                            
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>
                                    <img src="${produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : 'img/d.lorem1.png'}" alt="${produto.nome}">
                                </td>
                                <td>${produto.nome}</td>
                                <td>${produto.categoria}</td>
                                <td>R$ ${produto.preco.toFixed(2)}</td>
                                <td>
                                    ${produto.cores ? produto.cores.map(cor => `<span class="cor" style="background-color: ${cor}; display: inline-block; width: 15px; height: 15px; border-radius: 50%; margin-right: 3px;"></span>`).join('') : ''}
                                </td>
                                <td>${produto.tamanhos ? produto.tamanhos.join(', ') : ''}</td>
                                <td>
                                    <div class="acoes-btns">
                                        <button class="editar-btn" data-id="${produto.id}"><i class="fas fa-edit"></i></button>
                                        <button class="excluir-btn" data-id="${produto.id}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            `;
                            
                            produtosLista.appendChild(row);
                        }
                    });
                    
                    if (encontrados === 0) {
                        produtosLista.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado para a busca</td></tr>';
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar produtos:', error);
                    produtosLista.innerHTML = '<tr><td colspan="7" class="text-center">Erro ao buscar produtos</td></tr>';
                });
        });
        
        // Busca ao pressionar Enter
        buscaAdmin.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscaAdminBtn.click();
            }
        });
    }

    // Menu hambúrguer e menu móvel
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuMobile = document.querySelector('.menu-mobile');
    
    if (menuHamburguer && menuMobile) {
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
    }