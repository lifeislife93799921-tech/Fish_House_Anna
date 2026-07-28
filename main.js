// Ожидание полной загрузки DOM-дерева
document.addEventListener('DOMContentLoaded', () => {
    let allProducts = []; // сюда будем складывать все товары

    // Загрузка товаров для поиска (на всех страницах)
    async function loadProducts() {
        try {
            const response = await fetch('products.json');
            const products = await response.json();
            allProducts = products;
            window.products = products; // Сохраняем в глобальный массив window.products
            // После загрузки товаров — рисуем 4top
            render4Top();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    // ============================================================
    // 4TOP БЛОКИ СЛЕВА И СПРАВА ОТ ВИДЕО
    // ============================================================

    function render4Top() {
        const topIds = window.top4Ids || (typeof top4Ids !== 'undefined' ? top4Ids : null);

        // Проверяем, есть ли массив top4Ids
        if (!topIds || !Array.isArray(topIds) || topIds.length < 4) {
            console.warn('4top: массив top4Ids не найден или недостаточно ID');
            return;
        }

        const leftContainer = document.querySelector('.hero__side--left');
        const rightContainer = document.querySelector('.hero__side--right');

        if (!leftContainer || !rightContainer) {
            return;
        }

        // Очищаем контейнеры перед вставкой
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';

        // Функция получения товара по ID
        function getProductById(id) {
            const productList = window.products || allProducts;
            return productList.find(p => p.id === id) || null;
        }

        // Функция создания карточки
        function createCard(product) {
            const card = document.createElement('div');
            card.className = 'hero-side-card';

            if (!product) {
                card.classList.add('hero-side-card--unavailable');
                card.dataset.productId = 'unavailable';
                card.innerHTML = `
                    <div class="hero-side-card__img-box">
                        <div class="hero-side-card__unavailable-box">
                            <i class="fa-solid fa-box-open" style="font-size:1.3rem;margin-bottom:4px;color:#64748b;"></i>
                            <span>Товар тимчасово недоступний</span>
                        </div>
                    </div>
                    <div class="hero-side-card__body">
                        <div class="hero-side-card__title" style="color:#64748b;">Немає в наявності</div>
                    </div>
                `;
                return card;
            }

            card.dataset.productId = product.id;

            // Формируем цену
            let priceText = product.price ? `${product.price} грн` : 'Ціна не вказана';
            let unitText = product.unit ? product.unit : '';
            let oldPriceHtml = '';
            if (product.oldPrice && product.oldPrice > product.price) {
                oldPriceHtml = `<span style="text-decoration:line-through;color:#64748b;font-size:0.7rem;margin-left:4px;">${product.oldPrice} грн</span>`;
            }

            card.innerHTML = `
                <div class="hero-side-card__img-box">
                    <img src="${product.img || 'images/no-photo.png'}" alt="${product.name || 'Товар'}" class="hero-side-card__img" loading="lazy" onerror="this.src='images/no-photo.png'">
                </div>
                <div class="hero-side-card__body">
                    <div class="hero-side-card__title">${product.name || 'Без назви'}</div>
                    <div class="hero-side-card__price-row">
                        <span class="hero-side-card__price">${priceText}</span>
                        ${oldPriceHtml}
                        ${unitText ? `<span class="hero-side-card__unit">${unitText}</span>` : ''}
                    </div>
                </div>
            `;

            // Клик по доступной карточке — попап
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                openAddToCartPopup(product);
            });

            return card;
        }

        // Функция открытия попапа
        function openAddToCartPopup(product) {
            let popup = document.querySelector('.popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.className = 'popup';
                popup.innerHTML = `
                    <div class="popup__overlay"></div>
                    <div class="popup__content">
                        <button class="popup__close" aria-label="Закрити">&times;</button>
                        <h3 class="popup__title">Додати товар до кошика?</h3>
                        <p class="popup__subtitle">Додається мінімальна кількість. Змінити можна буде в кошику.</p>
                        <div class="popup__buttons">
                            <button class="popup__confirm-btn">Так</button>
                            <button class="popup__cancel-btn">Ні</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(popup);

                popup.querySelector('.popup__close').addEventListener('click', () => closePopup(popup));
                popup.querySelector('.popup__overlay').addEventListener('click', () => closePopup(popup));
            }

            const confirmBtn = popup.querySelector('.popup__confirm-btn');
            const cancelBtn = popup.querySelector('.popup__cancel-btn');

            const newConfirm = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
            newConfirm.addEventListener('click', function() {
                addToCart(product);
                closePopup(popup);
            });

            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newCancel.addEventListener('click', function() {
                closePopup(popup);
            });

            popup.classList.add('popup--open');
            document.body.style.overflow = 'hidden';
        }

        function closePopup(popup) {
            popup.classList.remove('popup--open');
            document.body.style.overflow = '';
        }

        // Функция добавления в корзину
        function addToCart(product) {
            let quantity = 1;
            if (product.step && typeof product.step === 'number' && product.step > 0) {
                quantity = product.step;
            }

            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity = parseFloat(existingItem.quantity) + quantity;
            } else {
                cart.push({ id: product.id, quantity: quantity });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateHeaderCounters();
        }

        // Рендерим 4 карточки по порядку: [0, 1] - левая колонка, [2, 3] - правая колонка
        const ids = topIds.slice(0, 4);
        const products = ids.map(id => getProductById(id));

        const leftItems = products.slice(0, 2);
        const rightItems = products.slice(2, 4);

        leftItems.forEach(product => {
            leftContainer.appendChild(createCard(product));
        });

        rightItems.forEach(product => {
            rightContainer.appendChild(createCard(product));
        });
    }

    // Запускаем загрузку товаров
    loadProducts();
    // 1. ЛОГИКА РАБОТЫ МОБИЛЬНОГО БУРГЕР-МЕНЮ
    const burgerBtn = document.querySelector('.header__burger');
    const headerMenu = document.querySelector('.header__menu');

    if (burgerBtn && headerMenu) {
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('header__burger--active');
            headerMenu.classList.toggle('header__menu--active');
        });
    }

    // 2. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ СЧЕТЧИКОВ КОРЗИНЫ И ИЗБРАННОГО В ХЕДЕРЕ
    function updateHeaderCounters() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCountElement = document.querySelector('.header__cart-count');
        if (cartCountElement) {
            const totalQuantity = cart.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
            cartCountElement.textContent = totalQuantity.toFixed(1).replace(/\.0$/, '');
        }

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const favoritesCountElement = document.querySelector('.header__favorites-count');
        if (favoritesCountElement) {
            favoritesCountElement.textContent = favorites.length;
        }
    }
    
    // Запускаем счетчики сразу при загрузке любой страницы
    updateHeaderCounters();
    
    // Синхронизация данных между вкладками браузера
    window.addEventListener('storage', updateHeaderCounters);


    // 3. УМНЫЙ ПОИСК ДЛЯ ВСЕХ СТРАНИЦ (Ищет только товары)
    const searchDictionary = {
        "черная": "Чорна",
        "чёрная": "Чорна",
        // --- Рыба и морепродукты ---
    "осьминог": "Восмініг",
    "восьминог": "Восмініг",
    "селедка": "Оселедець",
    "сельдь": "Оселедець",
    "икра": "Ікра",
    "лосось": "Лосось",
    "креветка": "Креветка",
    "форель": "Форель",
    "кальмар": "Кальмар",
    "мидии": "Мідії",
    "мидия": "Мідія",
    "щука": "Щука",
    "толстолоб": "Толстолоба",
    "скумбрия": "Скумбрія",
    "хек": "Хек",
    "тунец": "Тунець",
    "мойва": "Мойва",
    "бычок": "Бичок",
    "камбала": "Камбала",
    "краб": "Крабове",
    "лангустин": "Лангустін",
    "сибас": "Сібас",
    "дорадо": "Дорадо",
    "палтус": "Палтус",
    "сайра": "Сайра",
    "шпроты": "Шпроти",
    "анчоус": "Анчоуси",
    "раки": "Рак",
    "устрицы": "Устричний",

    // --- Полуфабрикаты ---
    "вареники": "Вареники",
    "пельмени": "Пельмені",
    "блины": "Млинці",
    "блинчики": "Млинці",
    "котлеты": "Котлети",
    "голубцы": "Голубці",
    "чебурек": "Чебурек",
    "бендерики": "Бендерики",
    "сырники": "Сирники",
    "хинкали": "Хінкалі",
    "лазанья": "Лазання",
    "люля": "Люля-кебаб",

    // --- Бакалея и консервация ---
    "сыр": "Сир",
    "масло": "Масло",
    "сливочное": "Вершкове",
    "чай": "Чай",
    "соль": "Сіль",
    "макароны": "Макарони",
    "спагетти": "Спагеті",
    "оливки": "Оливки",
    "маслины": "Маслини",
    "соус": "Соус",
    "майонез": "Майонез",
    "аджика": "Аджика",
    "кукуруза": "Кукурудза",
    "горошек": "Горошек",
    "ананас": "Ананас",
    "грибы": "Гриби",
    "шампиньоны": "Печериці",
    "сгущенка": "Згущене",
    "каперсы": "Каперси",
    "капуста": "Капуста",
    "картофель": "Картопля",
    "уксус": "Оцет",
    "рис": "Рис",
    "фунчоза": "Фунчоза",

    // --- Снэки и закуски ---
    "арахис": "Арахіс",
    "фисташки": "Фісташки",
    "гренки": "Грінки",
    "сухарики": "Сухарі",
    "чипсы": "Чіпси",
    "кабаноси": "Кабаноси",
    "снэки": "СНЕК",
    "брускетта": "Брушетто",
    "джерки": "Джерка",
    // --- креветка ---
    "креветки": "Креветка",
    "гренландия": "Гренландія",
    "сирая": "СИРА",
    "тигровая": "Тигрова",
    "черноморка": "черноморка",
    "черный тигр": "чорний Тигр",

    // --- копчен и солен ---
    "копченая": "копчення",
    "соленая": "солен",
    "балык": "Балик",
    "масляная": "масляний",
    "маслянка": "масляний",
    "мараканка": "Мараканка",
    "саварин": "Саварин",
    "рулет": "Три риби х/к рулет",
    "хамса": "Хамса",
    "матиас": "матіас",
    
    // --- вяленая ---
    "вяленая": "в'ялена",
    "вяленый": "в'ялений",
    "атерина": "Атерина",
    "верховодка": "Верховодка",
    "кубики толстолобика": "кубики толстолоба б/с",
    "лещ": "Лящ",
    "тарань": "Тарань",

    // --- мясо ---
    "мясо": "м'ясо",
    "бекон": "Бекон",
    "кабаноси": "Кабанос",
    "кабаносы": "Кабанос",
    "курица": "КУРИ",
    "куры": "КУРИ",
    "прошутто": "Прошутто",
    "салями": "Салями",
    "конина": "Коніна",
    "солонина": "Солонина",
    "филейка": "Філейка",
    "фримеса": "Фрімеса",
    "индюк": "індик",
    "индейка": "індик",
    "фует": "Фуєт",

    // --- консерва ---
    "консерва": "Консерва",
    "килька": "кілька",
    "томат": "томатному",
    "печень трески": "Печінка тріски",

    // --- пресерва ---
    "пресерва": "Пресерва",
    "морской коктейль": "МОРСЬКИЙ КОКТЕЙЛЬ",
    "саламур": "Саламур",

    // --- сира риба ---
    "сырая рыба": "сира риба",
    "кинг клип": "Кінг Кліп",
    "обрезь": "Обрізь",
    "карп": "КОРОПА",
    "треска": "Тріска",
    "фарш": "Фарш",
    "тилапия": "тілапії",
    "брюшки": "Черевця",
    "кусочки": "ШМАТКИ",

    // --- красная охол ---
    "красная": "красная охол",
    "стейк": "стейк",

    // --- СНЕК ---
    "снек": "СНЕК",
    "чипсы": "чіпси",
    "джерки": "Джерка",
    "утка": "качка",
    "полосатик": "полосатик",
    "корюшка": "корюшки",
    "соломка": "соломка",
    "кутум": "кутум",
    "спинка": "Спинка",
    "янтарная": "Янтарная",

    // --- суши ---
    "суши": "суши",
    "имбирь": "Імбир",
    "нори": "Норі",
    "уксус": "Оцет",
    "рис": "Рис",
    "рисовая бумага": "Рисовий папір",
    "хияши": "Хіяші",
    "чука": "Хіяші",
    "соевый соус": "Соєвий соус",
    "тереяки": "Тереяки",
    "сухари": "Сухарі",
    "панко": "Панко",
    "фунчоза": "Фунчоза",
    "лапша": "локшина",
    "лук": "Цибуля"
    };

    function adaptSearchQuery(originalQuery) {
        let query = originalQuery.toLowerCase().trim();
        let words = query.split(' ');
        let adaptedWords = words.map(word => searchDictionary[word] || word);
        return adaptedWords.join(' ');
    }

    const searchInput = document.querySelector('.header__search-input');
    const searchBtn = document.querySelector('.header__search-btn');

    if (searchInput) {
        const handleSearchSubmit = () => {
            const rawValue = searchInput.value.trim();
            if (!rawValue) return;

            // Переводим запрос, если он был на русском языке
            const adaptedQuery = adaptSearchQuery(rawValue);

            // Проверяем, находится ли пользователь на странице каталога products.html
            if (window.location.pathname.includes('products.html')) {
                // Если мы УЖЕ в каталоге, вызываем функцию фильтрации из products.js без перезагрузки
                if (typeof window.filterCatalogBySearch === 'function') {
                    window.filterCatalogBySearch(adaptedQuery);
                }
            } else {
                // Если мы на главной или в корзине — перенаправляем в каталог и передаем запрос в URL
                window.location.href = `products.html?search=${encodeURIComponent(adaptedQuery)}`;
            }
        };

        // Клик по лупе поиска
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleSearchSubmit();
            });
        }

        // Нажатие клавиши Enter в поле поиска
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
            }
        });
    }

    // Home page product carousels.
    const extraSaleProductIds = [
        // Сюда добавляйте ID товаров для карусели "Наші Акції та товари зі Знижками".
        // Пример: 1, 25, 48
    ];

    const hitCarousel = document.getElementById('home-hit-carousel');
    const saleCarousel = document.getElementById('home-sale-carousel');

    if (hitCarousel && saleCarousel) {
        initHomeProductCarousels();
    }

    async function initHomeProductCarousels() {
    try {
        // Если товары ещё не загружены (на случай, если loadProducts ещё не завершилась)
        if (!allProducts.length) {
            await loadProducts();
        }
        const products = allProducts; // используем глобально загруженные товары

        const hitProducts = products.filter(product => hasActiveBadge(product, 'hit'));
        const saleProducts = products.filter(product => {
            return hasActiveBadge(product, 'sale') ||
                (product.oldPrice !== null && product.oldPrice !== undefined) ||
                extraSaleProductIds.includes(product.id);
        });

        renderHomeCarousel(hitCarousel, hitProducts);
        renderHomeCarousel(saleCarousel, saleProducts);
        setupHomeCarouselControls('hit', hitCarousel);
        setupHomeCarouselControls('sale', saleCarousel);
    } catch (error) {
        hitCarousel.innerHTML = '<div class="home-carousel__empty">Не вдалося завантажити товари.</div>';
        saleCarousel.innerHTML = '<div class="home-carousel__empty">Не вдалося завантажити товари.</div>';
    }
}

    function hasActiveBadge(product, badgeType) {
        return Array.isArray(product.badges) && product.badges.some(badge => badge.type === badgeType && badge.active);
    }

    function renderHomeCarousel(track, products) {
        track.innerHTML = '';

        if (!products.length) {
            track.innerHTML = '<div class="home-carousel__empty">Товари скоро зʼявляться.</div>';
            return;
        }

        products.forEach(product => {
            const card = createHomeProductCard(product);
            track.appendChild(card);
        });
    }

    function createHomeProductCard(product) {
        const card = document.createElement('div');
        card.className = `product-card ${!product.available ? 'product-card--missing' : ''}`;
        card.dataset.id = product.id;

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFav = favorites.includes(product.id);
        const badgesHTML = (product.badges || [])
            .filter(badge => badge.active)
            .map(badge => `<span class="product-card__badge product-card__badge--${badge.type}">${badge.text}</span>`)
            .join('');
        const hasPromo = product.oldPrice !== null;
        const priceHTML = hasPromo
            ? `<span class="product-card__price product-card__price--promo">${product.price} грн</span>
               <span class="product-card__old-price">${product.oldPrice} грн</span>`
            : `<span class="product-card__price">${product.price} грн</span>`;

        card.innerHTML = `
            <div class="product-card__badges">${badgesHTML}</div>
            <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''}" title="В обране">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <a href="products.html?search=${encodeURIComponent(product.name)}" class="product-card__img-box">
                <img src="${product.img}" alt="${product.name}" class="product-card__img" onerror="this.src='images/no-photo.png'">
            </a>
            <a href="products.html?search=${encodeURIComponent(product.name)}" class="product-card__title">${product.name}</a>
            <div class="product-card__price-box">
                ${priceHTML}
                <span class="product-card__unit">/ ${product.unit}</span>
            </div>
            ${product.available ? `
                <div class="product-card__quantity">
                    <button class="product-card__quantity-btn minus-btn" type="button">-</button>
                    <span class="product-card__quantity-num">${product.step}</span>
                    <button class="product-card__quantity-btn plus-btn" type="button">+</button>
                </div>
                <button class="product-card__btn buy-btn" type="button">
                    <i class="fa-solid fa-basket-shopping"></i> Додати в кошик
                </button>
            ` : `
                <div class="product-card__missing-text">${product.missingText || 'Немає в наявності'}</div>
            `}
        `;

        initHomeCardEvents(card, product);
        return card;
    }

    function initHomeCardEvents(card, product) {
        const favBtn = card.querySelector('.product-card__favorite');
        favBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleHomeFavorite(product.id, favBtn);
        });

        if (!product.available) return;

        const plusBtn = card.querySelector('.plus-btn');
        const minusBtn = card.querySelector('.minus-btn');
        const qtyNum = card.querySelector('.product-card__quantity-num');
        const buyBtn = card.querySelector('.buy-btn');
        const step = parseFloat(product.step);
        let currentQty = step;

        plusBtn.addEventListener('click', () => {
            currentQty += step;
            qtyNum.textContent = formatQuantity(currentQty);
        });

        minusBtn.addEventListener('click', () => {
            if (currentQty > step) {
                currentQty -= step;
                qtyNum.textContent = formatQuantity(currentQty);
            }
        });

        buyBtn.addEventListener('click', () => {
            addHomeProductToCart(product, currentQty);
        });
    }

    function toggleHomeFavorite(id, btnElement) {
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

    function addHomeProductToCart(product, qty) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity = parseFloat(existingItem.quantity) + qty;
        } else {
            cart.push({ id: product.id, quantity: qty });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateHeaderCounters();
        alert(`Товар додано в кошик в кількості: ${formatQuantity(qty)}`);
    }

    function setupHomeCarouselControls(name, track) {
        const prevBtn = document.querySelector(`[data-carousel-prev="${name}"]`);
        const nextBtn = document.querySelector(`[data-carousel-next="${name}"]`);
        if (!prevBtn || !nextBtn) return;

        const updateButtons = () => {
            const maxScroll = track.scrollWidth - track.clientWidth - 2;
            prevBtn.disabled = track.scrollLeft <= 2;
            nextBtn.disabled = track.scrollLeft >= maxScroll;
        };

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
        });

        track.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        setTimeout(updateButtons, 100);
    }

    function formatQuantity(value) {
        return value.toFixed(2).replace(/\.00$/, '');
    }
        // ============================================================
    // УМНЫЙ ПОИСК С ПОДСКАЗКАМИ (работает с русским языком)
    // ============================================================
    const searchInputAutoComplete = document.getElementById('global-search-input');
    const suggestionsBox = document.getElementById('search-suggestions-box');

    if (searchInputAutoComplete && suggestionsBox) {
        
        searchInputAutoComplete.addEventListener('input', function() {
            const rawQuery = this.value.trim();
            
            if (!rawQuery) {
                suggestionsBox.style.display = 'none';
                return;
            }

            // Переводим русский запрос в украинский
            const adaptedQuery = adaptSearchQuery(rawQuery).toLowerCase();

            // Ищем товары, где адаптированный запрос есть в названии (в любом месте)
            const results = allProducts.filter(product => 
                product.name.toLowerCase().includes(adaptedQuery)
            );

            const topResults = results.slice(0, 8);

            if (topResults.length === 0) {
                suggestionsBox.style.display = 'none';
                return;
            }

            let html = '';
            topResults.forEach(product => {
                html += `<div class="search-suggestion-item" data-name="${product.name}">${product.name}</div>`;
            });
            suggestionsBox.innerHTML = html;
            suggestionsBox.style.display = 'block';

            // Клик по подсказке
            suggestionsBox.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', function() {
                    const chosenName = this.dataset.name;
                    searchInputAutoComplete.value = chosenName;
                    suggestionsBox.style.display = 'none';
                    
                    // Если мы на странице каталога — фильтруем
                    if (typeof window.filterCatalogBySearch === 'function') {
                        window.filterCatalogBySearch(chosenName);
                    } else {
                        // Иначе переходим в каталог с поиском
                        window.location.href = `products.html?search=${encodeURIComponent(chosenName)}`;
                    }
                });
            });
        });

        // Скрываем подсказки при клике вне поиска
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header__search')) {
                suggestionsBox.style.display = 'none';
            }
        });
    }
});


