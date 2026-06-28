document.addEventListener('DOMContentLoaded', () => {
    // 1. ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ПРИЛОЖЕНИЯ
    let productsData = [];       // Сюда загрузим весь JSON
    let filteredProducts = [];   // Отфильтрованные товары
    let currentCategory = 'all'; // Текущая активная категория
    let currentPage = 1;         // Текущая страница пагинации
    const itemsPerPage = 12;     // Строго по 12 товаров на страницу

    // Селекторы DOM элементов
    const catalogGrid = document.getElementById('catalog-grid');
    const productsCountSpan = document.getElementById('products-count');
    const paginationContainer = document.getElementById('catalog-pagination');
    const sortSelect = document.getElementById('sort-select');
    
    // Элементы слайдера цены
    const priceMinSlider = document.getElementById('price-min');
    const priceMaxSlider = document.getElementById('price-max');
    const priceInputMin = document.getElementById('price-input-min');
    const priceInputMax = document.getElementById('price-input-max');

    // Элементы чекбоксов-бейджей
    const badgeSaleCheck = document.getElementById('badge-sale');
    const badgeNewCheck = document.getElementById('badge-new');
    const badgeHitCheck = document.getElementById('badge-hit');

    // Мобильные фильтры
    const mobileToggleBtn = document.querySelector('.catalog__mobile-toggle-btn');
    const sidebar = document.getElementById('catalog-sidebar');

    // 2. ИНИЦИАЛИЗАЦИЯ И ЗАГРУЗКА ДАННЫХ
    async function initCatalog() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error('Ошибка загрузки JSON данных');
            productsData = await response.json();

            // Запускаем кастомный динамический слайдер цен
            setupDynamicPriceSlider();

            // === ПРОВЕРКА АДРЕСНОЙ СТРОКИ (ПОИСК, КАТЕГОРИИ, ФИЛЬТРЫ) ===
const urlParams = new URLSearchParams(window.location.search);
const searchFromUrl = urlParams.get('search');
const categoryParam = urlParams.get('category');
const filterParam = urlParams.get('filter');

// А. Если в ссылке передана категория (?category=...)
if (categoryParam) {
    currentCategory = categoryParam; // Меняем внутреннюю переменную категории на ту, что из ссылки
    
    // Переключаем визуально активный класс на кнопках в сайдбаре
    const activeBtn = document.querySelector('.filter-categories__btn--active');
    if (activeBtn) activeBtn.classList.remove('filter-categories__btn--active');
    
    const targetBtn = document.querySelector(`.filter-categories__btn[data-category="${categoryParam}"]`);
    if (targetBtn) targetBtn.classList.add('filter-categories__btn--active');
}

// Б. Если в ссылке передан фильтр-статус (?filter=...)
if (filterParam) {
    const checkbox = document.getElementById(`badge-${filterParam}`);
    if (checkbox) {
        checkbox.checked = true; // Визуально ставим галочку в чекбокс
    }
}

// В. Логика отрисовки товаров
if (searchFromUrl) {
    // Если пришли с поиска, запускаем поиск
    const searchInput = document.querySelector('.header__search-input');
    if (searchInput) {
        searchInput.value = searchFromUrl;
    }
    window.filterCatalogBySearch(searchFromUrl);
} else {
    // Если поиска нет, просто запускаем фильтрацию (она сама подхватит измененные выше категорию или чекбокс)
    applyFilters();
}

            setupEventListeners();
        } catch (error) {
            console.error('Критическая ошибка каталога:', error);
            catalogGrid.innerHTML = `<div class="catalog__no-results">Не удалось загрузить товары. Попробуйте позже.</div>`;
        }
    }

    // 3. РАБОТА С ИЗЯЩНЫМ ДИНАМИЧЕСКИМ ПОЛЗУНКОМ ЦЕН
    function setupDynamicPriceSlider() {
        if (!productsData.length) return;
        // Находим реальные минимальную и максимальную цены среди всех товаров в JSON
        const prices = productsData.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Устанавливаем границы для ползунков
        priceMinSlider.min = minPrice;
        priceMinSlider.max = maxPrice;
        priceMinSlider.value = minPrice;

        priceMaxSlider.min = minPrice;
        priceMaxSlider.max = maxPrice;
        priceMaxSlider.value = maxPrice;

        // Синхронизируем текстовые поля ввода
        priceInputMin.value = minPrice;
        priceInputMax.value = maxPrice;

        // Добавляем логику движения ползунков
        priceMinSlider.addEventListener('input', () => {
            if (parseInt(priceMinSlider.value) > parseInt(priceMaxSlider.value)) {
                priceMinSlider.value = priceMaxSlider.value;
            }
            priceInputMin.value = priceMinSlider.value;
            applyFilters();
        });

        priceMaxSlider.addEventListener('input', () => {
            if (parseInt(priceMaxSlider.value) < parseInt(priceMinSlider.value)) {
                priceMaxSlider.value = priceMinSlider.value;
            }
            priceInputMax.value = priceMaxSlider.value;
            applyFilters();
        });

        // Слушатели ручного ввода цифр в окошки цены
        priceInputMin.addEventListener('change', () => {
            let val = parseInt(priceInputMin.value);
            if (val < minPrice || isNaN(val)) val = minPrice;
            if (val > parseInt(priceMaxSlider.value)) val = priceMaxSlider.value;
            priceInputMin.value = val;
            priceMinSlider.value = val;
            applyFilters();
        });

        priceInputMax.addEventListener('change', () => {
            let val = parseInt(priceInputMax.value);
            if (val > maxPrice || isNaN(val)) val = maxPrice;
            if (val < parseInt(priceMinSlider.value)) val = priceMinSlider.value;
            priceInputMax.value = val;
            priceMaxSlider.value = val;
            applyFilters();
        });
    }

    // 4. ЛОГИКА СОРТИРОВКИ И ФИЛЬТРАЦИИ
    function applyFilters() {
        const minPrice = parseInt(priceMinSlider.value) || 0;
        const maxPrice = parseInt(priceMaxSlider.value) || 999999;

        filteredProducts = productsData.filter(product => {
            // А. Фильтр категорий (Одиночный выбор)
            if (currentCategory !== 'all' && product.type !== currentCategory) return false;

            // Б. Фильтр по диапазону цен
            if (product.price < minPrice || product.price > maxPrice) return false;

            // В. Фильтр по чекбоксам бейджей
            if (badgeSaleCheck.checked && !product.badges.find(b => b.type === 'sale' && b.active)) return false;
            if (badgeNewCheck.checked && !product.badges.find(b => b.type === 'new' && b.active)) return false;
            if (badgeHitCheck.checked && !product.badges.find(b => b.type === 'hit' && b.active)) return false;

            return true;
        });

        // Применяем сортировку
        applySorting();
        // Сбрасываем пагинацию на первую страницу при любом изменении фильтра
        currentPage = 1;
        productsCountSpan.textContent = filteredProducts.length;

        renderCatalogGrid();
    }

    function applySorting() {
        const sortType = sortSelect.value;
        if (sortType === 'name') {
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortType === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortType === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        }
    }

    // 5. ОТРИСОВКА СЕТКИ ТОВАРОВ И ПАГИНАЦИИ
    function renderCatalogGrid() {
        catalogGrid.innerHTML = '';
        if (!filteredProducts.length) {
            catalogGrid.innerHTML = `<div class="catalog__no-results">Товарів за вашим запитом не знайдено</div>`;
            paginationContainer.innerHTML = '';
            return;
        }

        // Логика разбиения на страницы (пагинация)
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filteredProducts.slice(startIndex, endIndex);

        // Генерация карточек
        pageItems.forEach(product => {
            const card = document.createElement('div');
            card.className = `product-card ${!product.available ? 'product-card--missing' : ''}`;
            card.dataset.id = product.id;

            // Проверяем состояние избранного в LocalStorage
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const isFav = favorites.includes(product.id);

            // Формируем бейджи
            let badgesHTML = '';
            product.badges.forEach(b => {
                if (b.active) {
                    badgesHTML += `<span class="product-card__badge product-card__badge--${b.type}">${b.text}</span>`;
                }
            });

            // Автоматическая акционная цена, если oldPrice не равен null
            const hasPromo = product.oldPrice !== null;
            const priceHTML = hasPromo 
                ? `<span class="product-card__price product-card__price--promo">${product.price} грн</span>
                   <span class="product-card__old-price">${product.oldPrice} грн</span>`
                : `<span class="product-card__price">${product.price} грн</span>`;

            // Шаблон внутренней разметки карточки
            card.innerHTML = `
                <div class="product-card__badges">${badgesHTML}</div>
                <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''}" title="В обране">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <div class="product-card__img-box open-popup-trigger">
                    <img src="${product.img}" alt="${product.name}" class="product-card__img" onerror="this.src='images/no-photo.png'">
                </div>
                <h3 class="product-card__title open-popup-trigger">${product.name}</h3>
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

            // Навешиваем события на элементы карточки
            initCardEvents(card, product);
            catalogGrid.appendChild(card);
        });

        renderPagination();
    }

    // 6. УПРАВЛЕНИЕ СЧЕТЧИКАМИ И КНОПКАМИ НА КАРТОЧКЕ
    function initCardEvents(card, product) {
        // Клик по картинке или названию открывает popup
        card.querySelectorAll('.open-popup-trigger').forEach(el => {
            el.addEventListener('click', () => openProductPopup(product));
        });

        // Клик по сердечку (Избранное)
        const favBtn = card.querySelector('.product-card__favorite');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(product.id, favBtn);
        });

        if (!product.available) return; // Если товара нет в наличии, логика кнопок дальше не нужна

        const plusBtn = card.querySelector('.plus-btn');
        const minusBtn = card.querySelector('.minus-btn');
        const qtyNum = card.querySelector('.product-card__quantity-num');
        const buyBtn = card.querySelector('.buy-btn');

        let currentQty = parseFloat(product.step);
        plusBtn.addEventListener('click', () => {
            currentQty += parseFloat(product.step);
            qtyNum.textContent = currentQty.toFixed(2).replace(/\.00$/, ''); // Изящно убираем лишние нули хвоста
        });

        minusBtn.addEventListener('click', () => {
            if (currentQty > parseFloat(product.step)) {
                currentQty -= parseFloat(product.step);
                qtyNum.textContent = currentQty.toFixed(2).replace(/\.00$/, '');
            }
        });

        // Добавление в кошик
        buyBtn.addEventListener('click', () => {
            addToCart(product, currentQty);
        });
    }

    // 7. ЛОГИКА ОТРИСОВКИ КНОПОК ПАГИНАЦИИ
    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        
        if (totalPages <= 1) return; // Прячем пагинацию, если страниц меньше одной

        // Кнопка "Назад"
        const prevBtn = document.createElement('button');
        prevBtn.className = 'catalog__page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => { currentPage--; renderCatalogGrid(); window.scrollTo({top: 0, behavior: 'smooth'}); });
        paginationContainer.appendChild(prevBtn);

        // Цифровые кнопки страниц
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `catalog__page-btn ${i === currentPage ? 'catalog__page-btn--active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderCatalogGrid();
                window.scrollTo({top: 0, behavior: 'smooth'}); // Плавный скролл наверх каталога при переключении
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Кнопка "Вперед"
        const nextBtn = document.createElement('button');
        nextBtn.className = 'catalog__page-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => { currentPage++; renderCatalogGrid(); window.scrollTo({top: 0, behavior: 'smooth'}); });
        paginationContainer.appendChild(nextBtn);
    }

    // 8. СИСТЕМА ЛОКАЛЬНОГО ХРАНЕНИЯ (LOCALSTORAGE)
    function toggleFavorite(id, btnElement) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const index = favorites.indexOf(id);

        if (index > -1) {
            favorites.splice(index, 1);
            btnElement.classList.remove('product-card__favorite--active');
            btnElement.innerHTML = '<i class="fa-regular fa-heart"></i>';
        } else {
            favorites.push(id);
            btnElement.classList.add('product-card__favorite--active');
            btnElement.innerHTML = '<i class="fa-solid fa-heart"></i>';
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateHeaderCounters();
    }

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

    function updateHeaderCounters() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        const cartCount = document.querySelector('.header__cart-count');
        const favCount = document.querySelector('.header__favorites-count');

        if (cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + parseFloat(item.quantity), 0).toFixed(1).replace(/\.0$/, '');
        if (favCount) favCount.textContent = favorites.length;
    }

    // 9. МОДАЛЬНОЕ ОКНО POPUP (ОТКРЫТИЕ И ЗАКРЫТИЕ)
    const popup = document.getElementById('product-popup');
    const popupBody = document.getElementById('popup-body');
    const popupCloseBtn = document.getElementById('popup-close-btn');

    function openProductPopup(product) {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favorites.includes(product.id);
        const hasPromo = product.oldPrice !== null;

        popupBody.innerHTML = `
            <div class="popup-grid">
                <div class="popup-grid__img-box">
                    <img src="${product.img}" alt="${product.name}" class="popup-grid__img" onerror="this.src='images/no-photo.png'">
                </div>
                <div class="popup-grid__info">
                    <h2 class="popup-grid__title">${product.name}</h2>
                    <div class="product-card__price-box">
                        ${hasPromo ?
                        `<span class="product-card__price product-card__price--promo" style="font-size:1.6rem">${product.price} грн</span>
                                      <span class="product-card__old-price" style="font-size:1.2rem">${product.oldPrice} грн</span>` 
                                   : `<span class="product-card__price" style="font-size:1.6rem">${product.price} грн</span>`}
                        <span class="product-card__unit">/ ${product.unit}</span>
                    </div>
                    <p class="popup-grid__desc">${product.description || 'Опис даного товару буде додано найближчим часом. Свіжа та якісна продукция від Fish House Anna.'}</p>
                    
                    ${product.available ?
                    `
                        <button class="product-card__btn popup-buy-btn" style="margin-top:auto">
                            <i class="fa-solid fa-basket-shopping"></i> Додати в кошик
                        </button>
                    ` : `
                        <div class="product-card__missing-text" style="margin-top:auto">${product.missingText || 'Немає в наявності'}</div>
                    `}
                </div>
            </div>
        `;
        popup.classList.add('popup--open');

        if (product.available) {
            popupBody.querySelector('.popup-buy-btn').addEventListener('click', () => {
                addToCart(product, parseFloat(product.step));
            });
        }
    }

    function closePopup() {
        popup.classList.remove('popup--open');
    }

    // 10. ВСЕ СЛУШАТЕЛИ КЛИКОВ И ИЗМЕНЕНИЙ ИНТЕРФЕЙСА
    function setupEventListeners() {
        // Сортировка
        sortSelect.addEventListener('change', applyFilters);

        // Чекбоксы статусов
        badgeSaleCheck.addEventListener('change', applyFilters);
        badgeNewCheck.addEventListener('change', applyFilters);
        badgeHitCheck.addEventListener('change', applyFilters);

        // Клики по категориям (Одиночный выбор)
        document.querySelectorAll('.filter-categories__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-categories__btn--active').classList.remove('filter-categories__btn--active');
                btn.classList.add('filter-categories__btn--active');
                currentCategory = btn.dataset.category;
                
                // На мобилке закрываем шторку фильтров после выбора категории
                sidebar.classList.remove('catalog__sidebar--open');
                
                applyFilters();
            });
        });

        // Закрытие модального окна тремя путями
        popupCloseBtn.addEventListener('click', closePopup);
        popup.querySelector('.popup__overlay').addEventListener('click', closePopup);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });

        // Управление фильтрами на мобилке (шторка)
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('catalog__sidebar--open');
            });
        }
    }

    // ТВОЯ НОВАЯ ГЛОБАЛЬНАЯ ФУНКЦИЯ ПОИСКА СВЯЗАННАЯ С MAIN.JS
    window.filterCatalogBySearch = function(searchQuery) {
        if (!productsData.length) return;

        filteredProducts = productsData.filter(product => {
            const productName = product.name.toLowerCase();
            const productDesc = product.description ? product.description.toLowerCase() : '';
            return productName.includes(searchQuery.toLowerCase()) || productDesc.includes(searchQuery.toLowerCase());
        });

        // Синхронизируем сортировку и счетчик количества
        applySorting();
        currentPage = 1;
        productsCountSpan.textContent = filteredProducts.length;

        // Выводим только найденное
        renderCatalogGrid();
    };

    // Запускаем каталог при загрузке DOM
    initCatalog();
});