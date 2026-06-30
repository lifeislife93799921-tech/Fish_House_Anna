document.addEventListener('DOMContentLoaded', () => {
    // 1. НАСТРОЙКИ И СПИСОК ИСКЛЮЧЕНИЙ
    const lowMarginIds = [999, 1000]; 

    let productsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentEligibleSum = 0; // "Чистая" сумма для расчета минималки

    // Базовые селекторы корзины
    const cartLayout = document.getElementById('cart-layout');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartTableContainer = document.getElementById('cart-table-container');
    const summaryItemsCount = document.getElementById('summary-items-count');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    
    // Селекторы формы оформления
    const orderForm = document.getElementById('checkout-order-form');
    const deliveryMethodSelect = document.getElementById('delivery-method');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const minSumInfo = document.getElementById('min-sum-info');

    const blockPickup = document.getElementById('form-block-pickup');
    const blockCourier = document.getElementById('form-block-courier');
    const blockUkraine = document.getElementById('form-block-ukraine');

    const addressCheckbox = document.getElementById('address-delivery-checkbox');
    const ukraineLabel = document.getElementById('ukraine-delivery-label');
    const ukraineInput = document.getElementById('ukraine-delivery-input');

    // НОВЫЕ селекторы модального окна для описания товара из корзины
    const cartPopup = document.getElementById('cart-product-popup');
    const cartPopupCloseBtn = document.getElementById('cart-popup-close-btn');
    const cartPopupImg = document.getElementById('cart-popup-img');
    const cartPopupTitle = document.getElementById('cart-popup-title');
    const cartPopupDesc = document.getElementById('cart-popup-desc');
    const cartPopupPrice = document.getElementById('cart-popup-price');

    // Инициализация страницы
    async function initCartPage() {
        try {
            const response = await fetch('products.json');
            productsData = await response.json();
            
            initFormEvents();
            initPopupEvents(); // Навешиваем закрытие модального окна
            
            renderCart();
            updateCountersOnPage();
        } catch (error) {
            console.error('Помилка завантаження даних для кошика:', error);
        }
    }

    // Рендеринг списка товаров
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
        currentEligibleSum = 0;

        cart.forEach(cartItem => {
            const product = productsData.find(p => p.id === cartItem.id);
            if (!product) return;

            const itemPrice = product.price;
            const itemCost = itemPrice * parseFloat(cartItem.quantity);
            
            totalSum += itemCost;
            totalItems += 1;

            // Проверка на акции и спец-исключения
            const isSale = product.badges && product.badges.some(b => b.type === 'sale' && b.active === true);
            const isException = lowMarginIds.includes(product.id);

            if (!isSale && !isException) {
                currentEligibleSum += itemCost;
            }

            // Создаем адаптивную разметку строки товара (5 колонок)
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <div class="cart-item__img-box">
                    <img src="${product.img}" alt="${product.name}" class="cart-item__img" onerror="this.src='images/no-photo.png'">
                </div>
                <div class="cart-item__name">${product.name}</div>
                
                <div class="cart-item__quantity">
                    <button class="cart-item__quantity-btn minus-btn">-</button>
                    <span class="cart-item__quantity-num">${cartItem.quantity.toFixed(2).replace(/\.00$/, '')}</span>
                    <button class="cart-item__quantity-btn plus-btn">+</button>
                </div>
                
                <div class="cart-item__price">${itemCost.toFixed(2).replace(/\.00$/, '')} грн</div>
                <button class="cart-item__remove" title="Видалити"><i class="fa-solid fa-trash-can"></i></button>
            `;

            // ОБРАБОТЧИК: Клик на картинку или название товара открывает модальное окно
const imgBox = row.querySelector('.cart-item__img-box');
const nameBox = row.querySelector('.cart-item__name');

if (imgBox) {
    imgBox.style.cursor = 'pointer'; // Добавляем указатель мыши
    imgBox.addEventListener('click', () => openCartPopup(product));
}
if (nameBox) {
    nameBox.style.cursor = 'pointer'; // Добавляем указатель мыши
    nameBox.addEventListener('click', () => openCartPopup(product));
}

            // Обработчики кнопок изменения количества
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

        checkDeliveryLimits();
    }

    // НОВЫЕ ФУНКЦИИ: Управление модальным окном из корзины
    function openCartPopup(product) {
        if (!cartPopup) return;
        
        // Заполняем попап данными выбранного товара
        cartPopupImg.src = product.img || 'images/no-photo.png';
        cartPopupTitle.textContent = product.name;
        cartPopupDesc.textContent = product.description || 'Опис товару незабаром з\'явиться.';
        cartPopupPrice.textContent = `${product.price} грн / ${product.unit || 'шт'}`;
        
        // Показываем окно
        cartPopup.classList.add('popup--open');
        document.body.style.overflow = 'hidden'; // Запрещаем прокрутку сайта под попапом
    }

    function closeCartPopup() {
        if (!cartPopup) return;
        cartPopup.classList.remove('popup--open');
        document.body.style.overflow = ''; // Возвращаем скролл сайту
    }

    function initPopupEvents() {
        if (!cartPopup) return;

        // 1. Клик по крестику
        if (cartPopupCloseBtn) {
            cartPopupCloseBtn.addEventListener('click', closeCartPopup);
        }

        // 2. Клик по темному фону (оверлею) вокруг окна
        const overlay = cartPopup.querySelector('.popup__overlay');
        if (overlay) {
            overlay.addEventListener('click', closeCartPopup);
        }

        // 3. Закрытие кнопкой Escape (Esc)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartPopup.classList.contains('popup--open')) {
                closeCartPopup();
            }
        });
    }

    // Проверка лимитов доставки
    function checkDeliveryLimits() {
        const selectedMethod = deliveryMethodSelect.value;
        let limit = 0;
        let methodNameText = '';

        if (selectedMethod === 'courier_zp') {
            limit = 500;
            methodNameText = "кур'єрської доставки по Запоріжжю";
        } else if (selectedMethod === 'courier') {
            limit = 700;
            methodNameText = "кур'єрської доставки по Дніпру";
        } else if (selectedMethod === 'ukraine') {
            limit = 300;
            methodNameText = 'доставки Новою Поштою';
        }

        if (selectedMethod === 'pickup') {
            minSumInfo.style.display = 'none';
            submitOrderBtn.disabled = false;
            return;
        }

        minSumInfo.style.display = 'block';

        if (currentEligibleSum >= limit) {
            minSumInfo.textContent = `Ура! Мінімальну суму для ${methodNameText} набрано.`;
            minSumInfo.className = 'checkout-form__min-info checkout-form__min-info--success';
            submitOrderBtn.disabled = false;
        } else {
            const rest = limit - currentEligibleSum;
            minSumInfo.textContent = `Для ${methodNameText} необхідно додати до кошика звичайних товарів ще на ${rest.toFixed(2).replace(/\.00$/, '')} грн. (Акційні товари та спец-позиції не враховуються).`;
            minSumInfo.className = 'checkout-form__min-info checkout-form__min-info--warning';
            submitOrderBtn.disabled = true;
        }
    }

    // Инициализация событий формы
    function initFormEvents() {
        if (!deliveryMethodSelect) return;

        deliveryMethodSelect.addEventListener('change', () => {
            const method = deliveryMethodSelect.value;

            blockPickup.style.display = (method === 'pickup') ? 'block' : 'none';
            blockCourier.style.display = (method === 'courier' || method === 'courier_zp') ? 'block' : 'none';
            blockUkraine.style.display = (method === 'ukraine') ? 'block' : 'none';

            [blockPickup, blockCourier, blockUkraine].forEach(block => {
                if (block) {
                    block.querySelectorAll('input').forEach(input => input.required = false);
                }
            });

            if (method === 'pickup') {
                blockPickup.querySelectorAll('[data-field="lastname"], [data-field="firstname"], [data-field="phone"], [data-field="date"]').forEach(i => i.required = true);
            } else if (method === 'courier' || method === 'courier_zp') {
                blockCourier.querySelectorAll('[data-field="lastname"], [data-field="firstname"], [data-field="phone"], [data-field="address"]').forEach(i => i.required = true);
            } else if (method === 'ukraine') {
                blockUkraine.querySelectorAll('[data-field="fullname"], [data-field="phone"], [data-field="shipping-address"]').forEach(i => i.required = true);
            }

            checkDeliveryLimits();
        });

        if (addressCheckbox) {
            addressCheckbox.addEventListener('change', () => {
                if (addressCheckbox.checked) {
                    ukraineLabel.textContent = "Адреса доставки (вулиця, будинок, квартира) *";
                    ukraineInput.placeholder = "м. Київ, вул. Хрещатик, буд. 1, кв. 5";
                } else {
                    ukraineLabel.textContent = "Номер або адреса відділення Нової Пошти *";
                    ukraineInput.placeholder = "Відділення №1, вул. Головна 5";
                }
            });
        }

        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const method = deliveryMethodSelect.value;
                
                let orderData = {
                    deliveryMethod: method,
                    items: cart,
                    totalPrice: summaryTotalPrice.textContent,
                    comment: orderForm.querySelector('.checkout-form__textarea').value
                };

                if (method === 'pickup') {
                    orderData.customer = {
                        lastName: blockPickup.querySelector('[data-field="lastname"]').value,
                        firstName: blockPickup.querySelector('[data-field="firstname"]').value,
                        middleName: blockPickup.querySelector('[data-field="middlename"]').value,
                        phone: blockPickup.querySelector('[data-field="phone"]').value,
                        visitDate: blockPickup.querySelector('[data-field="date"]').value
                    };
                } if (method === 'courier' || method === 'courier_zp') {
                    orderData.customer = {
                        lastName: blockCourier.querySelector('[data-field="lastname"]').value,
                        firstName: blockCourier.querySelector('[data-field="firstname"]').value,
                        middleName: blockCourier.querySelector('[data-field="middlename"]').value,
                        phone: blockCourier.querySelector('[data-field="phone"]').value,
                        address: blockCourier.querySelector('[data-field="address"]').value,
                        entrance: blockCourier.querySelector('[data-field="entrance"]').value
                    };
                } else if (method === 'ukraine') {
                    orderData.customer = {
                        fullName: blockUkraine.querySelector('[data-field="fullname"]').value,
                        phone: blockUkraine.querySelector('[data-field="phone"]').value,
                        addressDelivery: addressCheckbox.checked,
                        shippingDestination: ukraineInput.value
                    };
                }

                console.log('Сформоване замовлення для надсилання:', orderData);
                alert('Дякуємо за замовлення! Менеджер зв\'яжеться з вами найближчим часом.');
                
                localStorage.removeItem('cart');
                window.location.href = 'index.html';
            });
        }
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

    initCartPage();
});