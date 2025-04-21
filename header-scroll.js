// Script para controlar a opacidade do header ao rolar a página

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    // Função para controlar a opacidade do header ao rolar
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Quando rolar para baixo mais de 100px, adiciona a classe fade-out
        if (scrollTop > 100) {
            header.classList.add('fade-out');
        } else {
            // Quando voltar para o topo, remove a classe fade-out
            header.classList.remove('fade-out');
        }
        
        lastScrollTop = scrollTop;
    }
    
    // Adiciona o evento de scroll
    window.addEventListener('scroll', handleScroll);
});