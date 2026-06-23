// Ожидание полной загрузки DOM-дерева
document.addEventListener('DOMContentLoaded', () => {
    
    // Элементы мобильного меню
    const burgerBtn = document.querySelector('.header__burger');
    const headerMenu = document.querySelector('.header__menu');

    // Логика работы бургер-меню
    if (burgerBtn && headerMenu) {
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('header__burger--active');
            headerMenu.classList.toggle('header__menu--active');
        });
    }

});