document.addEventListener('DOMContentLoaded', () => {
    let productsData = [];
    const favoritesGrid = document.getElementById('favorites-grid'); // Твой контейнер в favorites.html

    // 1. Инициализация и загрузка данных
    async function initFavorites() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error('Ошибка загрузки JSON');
            productsData = await response.json();

            renderFavorites();
        } catch (error) {
            console.error('Ошибка избранного:', error);
            if (favoritesGrid) {
                favoritesGrid.innerHTML = `<div class="catalog__no-results">Не вдалося завантажити товари.</div>`;
            }
        }
    }

    // 2. Отрисовка карточек избранного
    function renderFavorites() {
        if (!favoritesGrid) return;
        favoritesGrid.innerHTML = '';

        const favoritesIds = JSON.parse(localStorage.getItem('favorites')) || [];

        // Фильтруем только те товары, которые есть в массиве избранного
        const favoriteProducts = productsData.filter(p => favoritesIds.includes(p.id));

        if (!favoriteProducts.length) {
            favoritesGrid.innerHTML = `<div class="catalog__no-results">У вас немає обраних товарів</div>`;
            return;
        }

        favoriteProducts.forEach(product => {
            const card = document.createElement('div');
            // Добавляем класс product-card--fav-page, чтобы кнопки светились всегда
            card.className = `product-card product-card--fav-page ${!product.available ? 'product-card--missing' : ''}`;
            card.dataset.id = product.id;

            // Формируем бейджи
            let badgesHTML = '';
            product.badges.forEach(b => {
                if (b.active) {
                    badgesHTML += `<span class="product-card__badge product-card__badge--${b.type}">${b.text}</span>`;
                }
            });

            // Цена (обычная или промо)
            const hasPromo = product.oldPrice !== null;
            const priceHTML = hasPromo 
                ? `<span class="product-card__price product-card__price--promo">${product.price} грн</span>
                   <span class="product-card__old-price">${product.oldPrice} грн</span>`
                : `<span class="product-card__price">${product.price} грн</span>`;

            // HTML структура один в один как в products.js
            card.innerHTML = `
                <div class="product-card__badges">${badgesHTML}</div>
                <button class="product-card__favorite product-card__favorite--active" title="Видалити з обраного">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <div class="product-card__img-box">
                    <img src="${product.img}" alt="${product.name}" class="product-card__img" onerror="this.src='images/no-photo.png'">
                </div>
                <h3 class="product-card__title">${product.name}</h3>
                <div class="product-card__price-box">
                    ${priceHTML}
                    <span class="product-card__unit">/ ${product.unit}</span>
                </div>
                
                ${product.available ?
                `
                    <div class="product-card__quantity">
                        <button class="product-card__quantity-btn minus-btn">-</button>
                        <span class="product-card__quantity-num">${product.step}</span>
                        <button class="product-card__quantity-btn plus-btn">+</button>
                    </div>
                    <button class="product-card__btn buy-btn">
                        <i class="fa-solid fa-basket-shopping"></i> Додати в кошик
                    </button>
                ` : `
                    <div class="product-card__missing-text">${product.missingText || 'Немає в наявності'}</div>
                `}
            `;

            initCardEvents(card, product);
            favoritesGrid.appendChild(card);
        });
    }

    // 3. Обработка кликов на кнопки внутри карточки
    function initCardEvents(card, product) {
        // Клик по сердечку — удаляет товар и убирает карточку
        const favBtn = card.querySelector('.product-card__favorite');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromFavorites(product.id);
        });

        if (!product.available) return;

        const plusBtn = card.querySelector('.plus-btn');
        const minusBtn = card.querySelector('.minus-btn');
        const qtyNum = card.querySelector('.product-card__quantity-num');
        const buyBtn = card.querySelector('.buy-btn');

        let currentQty = parseFloat(product.step);

        plusBtn.addEventListener('click', () => {
            currentQty += parseFloat(product.step);
            qtyNum.textContent = currentQty.toFixed(2).replace(/\.00$/, '');
        });

        minusBtn.addEventListener('click', () => {
            if (currentQty > parseFloat(product.step)) {
                currentQty -= parseFloat(product.step);
                qtyNum.textContent = currentQty.toFixed(2).replace(/\.00$/, '');
            }
        });

        buyBtn.addEventListener('click', () => {
            addToCart(product, currentQty);
        });
    }

    // 4. Удаление из Избранного (карточка сразу исчезает)
    function removeFromFavorites(id) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites = favorites.filter(favId => favId !== id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        updateHeaderCounters();
        renderFavorites(); // Перерисовываем сетку, товар улетает
    }

    // 5. Добавление в корзину
    function addToCart(product, qty) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity = parseFloat(existingItem.quantity) + qty;
        } else {
            cart.push({ id: product.id, quantity: qty });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateHeaderCounters();
        alert(`Товар додано в кошик в кількості: ${qty.toFixed(2).replace(/\.00$/, '')}`);
    }

    // 6. Обновление цифр в шапке сайта
    function updateHeaderCounters() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        const cartCount = document.querySelector('.header__cart-count');
        const favCount = document.querySelector('.header__favorites-count');

        if (cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + parseFloat(item.quantity), 0).toFixed(1).replace(/\.0$/, '');
        if (favCount) favCount.textContent = favorites.length;
    }

    initFavorites();
});