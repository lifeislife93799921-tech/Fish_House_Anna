document.addEventListener('DOMContentLoaded', () => {
    let productsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const cartLayout = document.getElementById('cart-layout');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartTableContainer = document.getElementById('cart-table-container');
    
    const summaryItemsCount = document.getElementById('summary-items-count');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    const orderForm = document.getElementById('checkout-order-form');

    async function initCartPage() {
        try {
            const response = await fetch('products.json');
            productsData = await response.json();
            renderCart();
            updateCountersOnPage();
        } catch (error) {
            console.error('Помилка завантаження даних для кошика:', error);
        }
    }

    function renderCart() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart.length === 0) {
            cartLayout.style.display = 'none';
            cartEmptyMessage.style.display = 'block';
            return;
        }

        cartLayout.style.display = 'grid';
        cartEmptyMessage.style.display = 'none';
        cartTableContainer.innerHTML = '';

        let totalSum = 0;
        let totalItems = 0;

        cart.forEach(cartItem => {
            const product = productsData.find(p => p.id === cartItem.id);
            if (!product) return;

            const itemPrice = product.price;
            const itemCost = itemPrice * parseFloat(cartItem.quantity);
            totalSum += itemCost;
            totalItems += 1;

            const row = document.createElement('div');
            row.className = 'cart-item';
            
            row.innerHTML = `
                <div class="cart-item__img-box">
                    <img src="${product.img}" alt="${product.name}" class="cart-item__img" onerror="this.src='images/no-photo.png'">
                </div>
                <div class="cart-item__name">${product.name}</div>
                <div class="product-card__quantity" style="margin-bottom:0;">
                    <button class="product-card__quantity-btn minus-btn">-</button>
                    <span class="product-card__quantity-num">${cartItem.quantity.toFixed(2).replace(/\.00$/, '')}</span>
                    <button class="product-card__quantity-btn plus-btn">+</button>
                </div>
                <div class="cart-item__price">${itemCost.toFixed(2).replace(/\.00$/, '')} грн</div>
                <button class="cart-item__remove" title="Видалити"><i class="fa-solid fa-trash-can"></i></button>
            `;

            // Обработчики внутри строки товара
            const plusBtn = row.querySelector('.plus-btn');
            const minusBtn = row.querySelector('.minus-btn');
            const removeBtn = row.querySelector('.cart-item__remove');

            plusBtn.addEventListener('click', () => {
                cartItem.quantity = parseFloat(cartItem.quantity) + parseFloat(product.step);
                saveAndRefresh();
            });

            minusBtn.addEventListener('click', () => {
                if (cartItem.quantity > parseFloat(product.step)) {
                    cartItem.quantity = parseFloat(cartItem.quantity) - parseFloat(product.step);
                    saveAndRefresh();
                }
            });

            removeBtn.addEventListener('click', () => {
                cart = cart.filter(item => item.id !== product.id);
                saveAndRefresh();
            });

            cartTableContainer.appendChild(row);
        });

        summaryItemsCount.textContent = `${totalItems} найм.`;
        summaryTotalPrice.textContent = `${totalSum.toFixed(2).replace(/\.00$/, '')} грн`;
    }

    function saveAndRefresh() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCountersOnPage();
    }

    function updateCountersOnPage() {
        const cartCount = document.querySelector('.header__cart-count');
        if (cartCount) {
            cartCount.textContent = cart.reduce((acc, item) => acc + parseFloat(item.quantity), 0).toFixed(1).replace(/\.0$/, '');
        }
    }

    // Имитация оформления заказа
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Дякуємо за замовлення! Менеджер зв\'яжеться з вами найближчим часом. (У майбутньому тут буде надсилання в Telegram)');
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        });
    }

    initCartPage();
});