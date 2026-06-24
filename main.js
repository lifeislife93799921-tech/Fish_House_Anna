document.addEventListener('DOMContentLoaded', () => {
    
    let allProducts = []; 
    let filteredProducts = [];
    
    let currentPage = 1;
    const itemsPerPage = 12;

    let currentCategory = 'all';
    let currentSearchQuery = '';
    let currentSort = 'default';
    let maxPriceLimit = 5000;

    const catalogGrid = document.getElementById('catalogGrid');
    const catalogPagination = document.getElementById('catalogPagination');
    const catalogCountInfo = document.getElementById('catalogCountInfo');
    const categoryButtons = document.querySelectorAll('.catalog__category-btn');
    const sortSelect = document.getElementById('catalogSortSelect');
    const priceMinInput = document.getElementById('priceMin');
    const priceMaxInput = document.getElementById('priceMax');
    const priceSlider = document.getElementById('priceRangeSlider');
    const searchInput = document.querySelector('.header__search-input');
    const searchBtn = document.querySelector('.header__search-btn');

    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const catalogSidebar = document.getElementById('catalogSidebar');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    const headerCartCount = document.querySelector('.header__menu-link[href*="cart"] .count, .fa-shopping-cart + span');
    const headerWishlistCount = document.querySelector('.header__menu-link[href*="wishlist"] .count, .fa-heart + span');

    // Твой бургер для мобилок
    const burgerBtn = document.querySelector('.header__burger');
    const headerMenu = document.querySelector('.header__menu');
    if (burgerBtn && headerMenu) {
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('header__burger--active');
            headerMenu.classList.toggle('header__menu--active');
        });
    }

    // ЛОГИКА ЛОКАЛЬНОЙ ПАМЯТИ
    function getWishlist() {
        return JSON.parse(localStorage.getItem('wishlist_ids')) || [];
    }

    function toggleWishlist(id) {
        let wishlist = getWishlist();
        const index = wishlist.indexOf(id);
        if (index === -1) {
            wishlist.push(id);
        } else {
            wishlist.splice(index, 1);
        }
        localStorage.setItem('wishlist_ids', JSON.stringify(wishlist));
        updateHeaderCounters();
        renderCatalogPage();
    }

    function getCart() {
        return JSON.parse(localStorage.getItem('cart_items')) || {};
    }

    function updateCartItem(id, quantity) {
        let cart = getCart();
        if (quantity <= 0) {
            delete cart[id];
        } else {
            cart[id] = Number(quantity.toFixed(1));
        }
        localStorage.setItem('cart_items', JSON.stringify(cart));
        updateHeaderCounters();
    }

    function updateHeaderCounters() {
        const wishlist = getWishlist();
        if (headerWishlistCount) {
            headerWishlistCount.textContent = wishlist.length;
            headerWishlistCount.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
        }

        const cart = getCart();
        const cartCount = Object.keys(cart).length;
        if (headerCartCount) {
            headerCartCount.textContent = cartCount;
            headerCartCount.style.display = cartCount > 0 ? 'inline-block' : 'none';
        }
    }

    // ФЕТЧ ИЗ JSON ФАЙЛА
    async function fetchProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error('Помилка завантаження JSON');
            allProducts = await response.json();
            
            if (allProducts.length > 0) {
                const highestPrice = Math.ceil(Math.max(...allProducts.map(p => p.price)));
                priceSlider.max = highestPrice;
                priceMaxInput.value = highestPrice;
                priceSlider.value = highestPrice;
                maxPriceLimit = highestPrice;
            }

            applyFiltersAndSort();
        } catch (error) {
            console.error(error);
            if (catalogGrid) {
                catalogGrid.innerHTML = `<p style="color:#f85149; grid-column:span 3; text-align:center;">Помилка завантаження товарів.</p>`;
            }
        }
    }

    // ФИЛЬТРЫ И СОРТИРОВКА НА ЛЕТУ
    function applyFiltersAndSort() {
        const minPrice = parseFloat(priceMinInput.value) || 0;
        const maxPrice = parseFloat(priceMaxInput.value) || Infinity;

        filteredProducts = allProducts.filter(product => {
            let matchesCategory = true;
            if (currentCategory !== 'all') {
                if (currentCategory === 'akciya') {
                    const hasSaleBadge = product.badges && product.badges.some(b => b.type === 'sale' && b.active);
                    matchesCategory = (product.type === 'akciya' || product.oldPrice !== null || hasSaleBadge);
                } else if (currentCategory === 'novinka') {
                    const hasNewBadge = product.badges && product.badges.some(b => b.type === 'new' && b.active);
                    matchesCategory = (product.type === 'novinka' || hasNewBadge);
                } else {
                    matchesCategory = (product.type === currentCategory);
                }
            }

            const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
            const matchesSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase());

            return matchesCategory && matchesPrice && matchesSearch;
        });

        if (currentSort === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'name-asc') {
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (catalogCountInfo) {
            catalogCountInfo.textContent = `Знайдено: ${filteredProducts.length} товарів`;
        }
        currentPage = 1;
        renderCatalogPage();
    }

    // РЕНДЕР КАРТОЧЕК
    function renderCatalogPage() {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
            catalogGrid.innerHTML = `<p style="color: #8b949e; grid-column: span 3; text-align: center; padding: 40px 0;">Товарів не знайдено.</p>`;
            if (catalogPagination) catalogPagination.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
        const pageItems = filteredProducts.slice(startIndex, endIndex);

        const wishlist = getWishlist();
        const cart = getCart();

        pageItems.forEach(product => {
            const isWishlisted = wishlist.includes(product.id);
            const isInCart = cart.hasOwnProperty(product.id);
            const currentQuantity = isInCart ? cart[product.id] : (product.step || 1);

            const card = document.createElement('div');
            card.className = `product-card ${!product.available ? 'product-card--missing' : ''}`;
            card.dataset.id = product.id;

            let badgesHtml = '';
            if (product.available && product.badges) {
                product.badges.forEach(badge => {
                    if (badge.active) {
                        let icon = '<i class="fa-solid fa-fire"></i>';
                        if (badge.type === 'new') icon = '<i class="fa-solid fa-star"></i>';
                        badgesHtml += `<span class="product-card__badge product-card__badge--${badge.type}">${icon} ${badge.text}</span>`;
                    }
                });
            }
            if (product.available && product.oldPrice && !badgesHtml.includes('product-card__badge--sale')) {
                badgesHtml += `<span class="product-card__badge product-card__badge--sale"><i class="fa-solid fa-fire"></i>  %</span>`;
            }

            let actionPanelHtml = '';
            if (product.available) {
                actionPanelHtml = `
                    <div class="product-card__counter">
                        <button class="product-card__counter-btn btn-minus" data-id="${product.id}">-</button>
                        <span class="product-card__counter-value" id="count-${product.id}">${currentQuantity}</span>
                        <button class="product-card__counter-btn btn-plus" data-id="${product.id}">+</button>
                    </div>
                    <button class="product-card__buy-btn ${isInCart ? 'product-card__buy-btn--in-cart' : ''}" data-id="${product.id}">
                        <i class="fa-solid ${isInCart ? 'fa-check' : 'fa-basket-shopping'}"></i> 
                        <span>${isInCart ? 'В кошику' : 'Купити'}</span>
                    </button>
                `;
            } else {
                actionPanelHtml = `
                    <div class="product-card__missing-badge">
                        <i class="fa-solid fa-circle-ban"></i> ${product.missingText || 'Тимчасово немає'}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="product-card__badges-stack">${badgesHtml}</div>
                <button class="product-card__wishlist-btn ${isWishlisted ? 'product-card__wishlist-btn--active' : ''}" data-id="${product.id}">
                    <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                
                <div class="product-card__img-wrapper">
                    <img src="${product.img || 'images/no-image.jpg'}" alt="${product.name}" class="product-card__img" loading="lazy">
                </div>

                <div class="product-card__info">
                    <h4 class="product-card__title">${product.name}</h4>
                    <div class="product-card__price-row">
                        <span class="product-card__price">${product.price} грн</span>
                        ${product.oldPrice ? `<span class="product-card__old-price">${product.oldPrice} грн</span>` : ''}
                        <span class="product-card__unit">/ ${product.unit || 'шт'}</span>
                    </div>
                </div>

                <div class="product-card__actions">
                    ${actionPanelHtml}
                </div>
            `;

            catalogGrid.appendChild(card);
        });

        renderPaginationControls();
    }

    // УПРАВЛЕНИЕ СТРАНИЦАМИ (ПАГИНАЦИЯ)
    function renderPaginationControls() {
        if (!catalogPagination) return;
        catalogPagination.innerHTML = '';

        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'catalog__page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCatalogPage();
                window.scrollTo({ top: catalogGrid.offsetTop - 120, behavior: 'smooth' });
            }
        });
        catalogPagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `catalog__page-btn ${i === currentPage ? 'catalog__page-btn--active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderCatalogPage();
                window.scrollTo({ top: catalogGrid.offsetTop - 120, behavior: 'smooth' });
            });
            catalogPagination.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'catalog__page-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCatalogPage();
                window.scrollTo({ top: catalogGrid.offsetTop - 120, behavior: 'smooth' });
            }
        });
        catalogPagination.appendChild(nextBtn);
    }

    // СЛУШАТЕЛИ КЛИКОВ НА КАРТОЧКАХ
    if (catalogGrid) {
        catalogGrid.addEventListener('click', (e) => {
            const target = e.target;

            const wishlistBtn = target.closest('.product-card__wishlist-btn');
            if (wishlistBtn) {
                const id = parseInt(wishlistBtn.dataset.id);
                toggleWishlist(id);
                return;
            }

            const counterBtn = target.closest('.product-card__counter-btn');
            if (counterBtn) {
                const id = parseInt(counterBtn.dataset.id);
                const product = allProducts.find(p => p.id === id);
                if (!product) return;

                const step = product.step || 1;
                const counterValueElem = document.getElementById(`count-${id}`);
                let currentVal = parseFloat(counterValueElem.textContent);

                if (counterBtn.classList.contains('btn-plus')) {
                    currentVal += step;
                } else if (counterBtn.classList.contains('btn-minus')) {
                    currentVal = Math.max(step, currentVal - step);
                }

                currentVal = Number(currentVal.toFixed(1));
                counterValueElem.textContent = currentVal;

                const cart = getCart();
                if (cart.hasOwnProperty(id)) {
                    updateCartItem(id, currentVal);
                }
                return;
            }

            const buyBtn = target.closest('.product-card__buy-btn');
            if (buyBtn) {
                const id = parseInt(buyBtn.dataset.id);
                const counterValueElem = document.getElementById(`count-${id}`);
                const currentQuantity = parseFloat(counterValueElem.textContent);

                let cart = getCart();
                if (cart.hasOwnProperty(id)) {
                    updateCartItem(id, 0);
                } else {
                    updateCartItem(id, currentQuantity);
                }
                renderCatalogPage();
            }
        });
    }

    // ТАБЫ КАТЕГОРИЙ
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('catalog__category-btn--active'));
            btn.classList.add('catalog__category-btn--active');
            currentCategory = btn.dataset.category;
            
            if (window.innerWidth <= 1024) {
                catalogSidebar.classList.remove('catalog__sidebar--open');
            }
            applyFiltersAndSort();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFiltersAndSort();
        });
    }

    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            priceMaxInput.value = e.target.value;
            applyFiltersAndSort();
        });
    }

    if (priceMinInput && priceMaxInput) {
        [priceMinInput, priceMaxInput].forEach(input => {
            input.addEventListener('change', () => {
                priceSlider.value = priceMaxInput.value;
                applyFiltersAndSort();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            applyFiltersAndSort();
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            applyFiltersAndSort();
        });
    }

    // МОБИЛЬНАЯ ШТОРКА ФИЛЬТРОВ
    if (mobileFilterBtn && catalogSidebar && sidebarCloseBtn) {
        mobileFilterBtn.addEventListener('click', () => {
            catalogSidebar.classList.add('catalog__sidebar--open');
        });

        sidebarCloseBtn.addEventListener('click', () => {
            catalogSidebar.classList.remove('catalog__sidebar--open');
        });

        document.addEventListener('click', (e) => {
            if (!catalogSidebar.contains(e.target) && !mobileFilterBtn.contains(e.target) && catalogSidebar.classList.contains('catalog__sidebar--open')) {
                catalogSidebar.classList.remove('catalog__sidebar--open');
            }
        });
    }

    updateHeaderCounters();
    fetchProducts();
});