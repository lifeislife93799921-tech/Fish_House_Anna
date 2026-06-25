document.addEventListener('DOMContentLoaded', () => {
    let productsData = [];
    // Избранное обычно хранится как массив ID товаров, например: ["prod1", "prod2"]
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesEmptyMessage = document.getElementById('favorites-empty-message');

    async function initFavoritesPage() {
        try {
            const response = await fetch('products.json');
            productsData = await response.json();
            renderFavorites();
        } catch (error) {
            console.error('Помилка завантаження даних для обраного:', error);
        }
    }

    function renderFavorites() {
        favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        if (favorites.length === 0) {
            favoritesGrid.style.display = 'none';
            favoritesEmptyMessage.style.display = 'block';
            return;
        }

        favoritesGrid.style.display = 'grid';
        favoritesEmptyMessage.style.display = 'none';
        favoritesGrid.innerHTML = '';

        favorites.forEach(favId => {
            // Ищем данные товара по его ID
            const product = productsData.find(p => p.id === favId);
            if (!product) return;

            // Создаем карточку товара (структура как в твоем каталоге)
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Проверяем наличие акции для красивой цены
            const hasSale = product.badges && product.badges.find(b => b.type === 'sale' && b.active);
            const priceHTML = hasSale && product.oldPrice 
                ? `<div class="product-card__price">${product.price} грн <span class="product-card__old-price" style="text-decoration: line-through; font-size: 0.85rem; color: #64748b; margin-left: 8px;">${product.oldPrice} грн</span></div>`
                : `<div class="product-card__price">${product.price} грн</div>`;

            card.innerHTML = `
                <div class="product-card__img-box">
                    <img src="${product.img}" alt="${product.name}" class="product-card__img" onerror="this.src='images/no-photo.png'">
                    <button class="product-card__fav-btn product-card__fav-btn--active" title="Видалити з обраного" style="color: #ff7a00;">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
                <div class="product-card__info">
                    <h3 class="product-card__title">${product.name}</h3>
                    ${priceHTML}
                    <button class="product-card__buy-btn">
                        <i class="fa-solid fa-basket-shopping"></i> Додати в кошик
                    </button>
                </div>
            `;

            // Логика кнопки «Удалить из избранного» (клик по сердечку)
            const favBtn = card.querySelector('.product-card__fav-btn');
            favBtn.addEventListener('click', () => {
                favorites = favorites.filter(id => id !== product.id);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                renderFavorites(); // Перерисовываем экран
                updateLocalCounters(); // Обновляем цифры в шапке
            });

            // Логика кнопки «Добавить в корзину»
            const buyBtn = card.querySelector('.product-card__buy-btn');
            buyBtn.addEventListener('click', () => {
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const cartItem = cart.find(item => item.id === product.id);

                if (cartItem) {
                    // Если товар уже в корзине, увеличиваем на один минимальный шаг (или на 1)
                    cartItem.quantity = parseFloat(cartItem.quantity) + parseFloat(product.step || 1);
                } else {
                    // Если нет, добавляем стартовое количество (например, равен шагу: 0.5кг или 1 шт)
                    cart.push({
                        id: product.id,
                        quantity: parseFloat(product.step || 1)
                    });
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                updateLocalCounters();
                alert(`Товар "${product.name}" додано до кошика!`);
            });

            favoritesGrid.appendChild(card);
        });
    }

    // Быстрое обновление счетчиков в хедере конкретно для этой страницы при действиях
    function updateLocalCounters() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCount = document.querySelector('.header__cart-count');
        if (cartCount) {
            const total = cart.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
            cartCount.textContent = total.toFixed(1).replace(/\.0$/, '');
        }

        const favs = JSON.parse(localStorage.getItem('favorites')) || [];
        const favCount = document.querySelector('.header__favorites-count');
        if (favCount) {
            favCount.textContent = favs.length;
        }
    }

    initFavoritesPage();
});