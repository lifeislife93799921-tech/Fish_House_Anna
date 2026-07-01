// Ожидание полной загрузки DOM-дерева
document.addEventListener('DOMContentLoaded', () => {
    
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
    "мидии": "Мідія",
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
            const response = await fetch('products.json');
            const products = await response.json();

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
});
