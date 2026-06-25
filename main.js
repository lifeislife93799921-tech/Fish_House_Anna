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
    "джерки": "Джерка"
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
});