/* ========================================
   Rajshahi Mistanno Bhandar - MAIN JAVASCRIPT
   Full site interactions, persistent cart, animations, and drawer UI
   ======================================== */

// ========================================
// 1. HAMBURGER MENU TOGGLE
// ========================================

/**
 * Toggles the hamburger menu open/close state
 * Adds/removes active class from hamburger and nav-menu
 */
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!hamburger || !navMenu) {
        return;
    }

    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav-menu');
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Ensure the mobile menu is closed when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

// ========================================
// 2. TYPEWRITER ANIMATION
// ========================================

/**
 * Creates a typewriter effect for the restaurant name
 * Types out "Rajshahi Mistanno Bhandar" character by character
 */
function initTypewriterAnimation() {
    const element = document.getElementById('animated-text') || document.getElementById('typewriter-text');
    if (!element) {
        return;
    }

    const text = 'Rajshahi Mistanno Bhandar';
    let index = 0;
    let isDeleting = false;

    function type() {
        element.textContent = text.substring(0, index);

        if (!isDeleting && index < text.length) {
            index++;
            setTimeout(type, 100);
            return;
        }

        if (!isDeleting && index === text.length) {
            setTimeout(() => {
                isDeleting = true;
                type();
            }, 2000);
            return;
        }

        if (isDeleting && index > 0) {
            index--;
            setTimeout(type, 50);
            return;
        }

        if (isDeleting && index === 0) {
            isDeleting = false;
            setTimeout(type, 500);
        }
    }

    type();
}

// ========================================
// 3. IMAGE SLIDER WITH AUTO-FADING
// ========================================

/**
 * Creates an auto-fading image slider
 * Cycles through images automatically with fade transition
 * 
 * @param {string} sliderId - The ID of the slider container
 * @param {string} dotsId - The ID of the dots container
 * @param {number} intervalTime - Time in ms between image changes (default: 4000ms)
 */
function initImageSlider(sliderId, dotsId, intervalTime = 4000) {
    const sliderContainer = document.getElementById(sliderId);
    const dotsContainer = document.getElementById(dotsId);

    if (!sliderContainer) {
        return;
    }

    const images = Array.from(sliderContainer.querySelectorAll('.slider-image'));

    if (!images.length) {
        return;
    }

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        images.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.dataset.index = String(index);
            dot.addEventListener('click', () => {
                showImage(index);
            });
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.dot')) : [];
    let currentIndex = 0;

    function showImage(index) {
        images.forEach(img => img.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        const safeIndex = (index + images.length) % images.length;
        images[safeIndex].classList.add('active');
        if (dots[safeIndex]) {
            dots[safeIndex].classList.add('active');
        }
        currentIndex = safeIndex;
    }

    function nextImage() {
        showImage(currentIndex + 1);
    }

    setInterval(nextImage, intervalTime);
    showImage(0);
}

// ========================================
// 4. ADD-TO-CART BUTTONS & CATEGORY FILTERS
// ========================================

const CART_KEY = 'royalRestaurantCart';
const CUSTOMER_INFO_KEY = 'royalRestaurantCustomerInfo';
let cartItems = [];

function loadCart() {
    const stored = localStorage.getItem(CART_KEY);
    try {
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Unable to parse cart from localStorage', error);
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
}

function getCartCount() {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
}

function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) {
        return;
    }

    const count = getCartCount();
    cartBadge.textContent = count;
    cartBadge.style.opacity = count > 0 ? '1' : '0.65';
    cartBadge.classList.toggle('pulse', count > 0);
    cartBadge.setAttribute('data-count', String(count));
}

function parsePrice(priceText) {
    return Number(priceText.replace(/[^0-9.]/g, '')) || 0;
}

function getCardImageUrl(card) {
    const imageElement = card.querySelector('.food-card-image');
    if (!imageElement) {
        return '';
    }

    const bgImage = window.getComputedStyle(imageElement).backgroundImage;
    const match = /url\((?:"|')?(.*?)(?:"|')?\)/.exec(bgImage);
    return match ? match[1] : '';
}

function addItemToCart(item) {
    const existingItem = cartItems.find(cartItem => cartItem.name === item.name && cartItem.image === item.image);
    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        cartItems.push({ ...item });
    }

    cartItems = [...cartItems];
    saveCart();
    updateCartBadge();
    renderCartDrawer();
}

function attachAddToCartButtons() {
    document.body.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart-btn, .btn-add');
        if (!button || button.tagName !== 'BUTTON') {
            return;
        }

        const card = button.closest('.food-card');
        const name = button.dataset.name?.trim() || card?.querySelector('.food-card-title')?.textContent?.trim() || 'Royal Item';
        const priceText = button.dataset.price || card?.querySelector('.food-card-price')?.textContent || '$0.00';
        const image = button.dataset.image || (card ? getCardImageUrl(card) : '');
        const price = parsePrice(priceText);

        addItemToCart({ name, price, image, quantity: 1 });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCartCount() } }));
        }
    });
}

function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const foodCards = document.querySelectorAll('.food-card');
    if (!filterButtons.length || !foodCards.length) {
        return;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            foodCards.forEach(card => {
                const category = card.dataset.category;
                const match = filter === 'all' || category === filter;
                card.style.display = match ? 'flex' : 'none';
            });
        });
    });
}

function createCartDrawer() {
    if (document.getElementById('cart-drawer-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-drawer-overlay';
    overlay.innerHTML = `
        <div class="cart-drawer" id="cart-drawer">
            <div class="cart-drawer-header">
                <div>
                    <p class="drawer-title">Your Cart</p>
                    <p class="drawer-subtitle">Review your selected luxury items</p>
                </div>
                <button class="drawer-close" id="drawer-close" aria-label="Close cart drawer">×</button>
            </div>
            <div class="cart-drawer-body">
                <div class="cart-items" id="cart-items"></div>
                <div class="cart-empty" id="cart-empty">Your cart is empty. Add items from the menu or patisserie.</div>
            </div>
            <div class="cart-drawer-footer">
                <div class="cart-divider"></div>
                <div class="receipt-row">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">$0.00</span>
                </div>
                <div class="receipt-row">
                    <span>Tax (8%)</span>
                    <span id="cart-tax">$0.00</span>
                </div>
                <div class="receipt-row total-row">
                    <span>Total</span>
                    <span class="cart-total-price" id="cart-total-price">$0.00</span>
                </div>
                <button class="btn order-now-btn" id="order-now-btn">ORDER NOW</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeCartDrawer();
        }
    });

    const closeButton = document.getElementById('drawer-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeCartDrawer);
    }

    overlay.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.qty-increase')) {
            const index = Number(target.dataset.index);
            if (Number.isInteger(index) && cartItems[index]) {
                cartItems[index].quantity += 1;
                saveCart();
                updateCartBadge();
                renderCartDrawer();
            }
        }

        if (target.matches('.qty-decrease')) {
            const index = Number(target.dataset.index);
            if (Number.isInteger(index) && cartItems[index]) {
                cartItems[index].quantity = Math.max(1, cartItems[index].quantity - 1);
                saveCart();
                updateCartBadge();
                renderCartDrawer();
            }
        }

        if (target.matches('.remove-item')) {
            const index = Number(target.dataset.index);
            if (Number.isInteger(index) && cartItems[index]) {
                cartItems.splice(index, 1);
                saveCart();
                updateCartBadge();
                renderCartDrawer();
            }
        }
    });

    const orderButton = document.getElementById('order-now-btn');
    if (orderButton) {
        orderButton.addEventListener('click', () => {
            if (!cartItems.length) {
                alert('Your cart is empty. Add items to place an order.');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
}

function renderCartDrawer() {
    createCartDrawer();

    const itemsContainer = document.getElementById('cart-items');
    const emptyMessage = document.getElementById('cart-empty');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalPrice = document.getElementById('cart-total-price');

    if (!itemsContainer || !emptyMessage || !subtotalEl || !taxEl || !totalPrice) {
        return;
    }

    if (!cartItems.length) {
        itemsContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        subtotalEl.textContent = '$0.00';
        taxEl.textContent = '$0.00';
        totalPrice.textContent = '$0.00';
        return;
    }

    emptyMessage.style.display = 'none';
    itemsContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-details-block">
                <div class="cart-item-top-row">
                    <div>
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-summary">${item.quantity} x ${formatCurrency(item.price)}</p>
                    </div>
                    <button class="remove-item" data-index="${index}" aria-label="Remove item">×</button>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button class="qty-btn qty-decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn qty-increase" data-index="${index}" aria-label="Increase quantity">+</button>
                    </div>
                    <span class="cart-item-total">${formatCurrency(item.price * item.quantity)}</span>
                </div>
            </div>
        </div>
    `).join('');

    const subtotal = getCartTotal();
    const tax = subtotal * 0.08;
    subtotalEl.textContent = formatCurrency(subtotal);
    taxEl.textContent = formatCurrency(tax);
    totalPrice.textContent = formatCurrency(subtotal + tax);
    updateCartBadge();
}

function openCartDrawer() {
    createCartDrawer();
    renderCartDrawer();
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ========================================
// 4. SHOPPING CART FUNCTIONALITY
// ========================================

/**
 * Initializes shopping cart click handler
 * Can be expanded with actual cart functionality
 */
function initShoppingCart() {
    const shoppingCart = document.getElementById('shopping-cart');
    cartItems = loadCart();
    updateCartBadge();
    createCartDrawer();

    if (!shoppingCart) {
        return;
    }

    shoppingCart.addEventListener('click', () => {
        openCartDrawer();
    });
}

// ========================================
// 5. BUTTON CLICK HANDLERS
// ========================================

/**
 * Initializes click handlers for hero section buttons
 */
function initButtonHandlers() {
    const bookBtn = document.getElementById('book-btn');
    const menuBtn = document.getElementById('menu-btn');

    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            window.location.href = 'reserve.html';
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            window.location.href = 'menu.html';
        });
    }
}

function initReservationPage() {
    const confirmBtn = document.getElementById('confirm-reservation-btn');
    const zoneButtons = document.querySelectorAll('.zone-btn');
    const selectedZoneText = document.getElementById('selected-zone');
    const nameInput = document.getElementById('reserve-name');
    const phoneInput = document.getElementById('reserve-phone');
    const guestsInput = document.getElementById('reserve-guests');
    const dateTimeInput = document.getElementById('reserve-datetime');

    if (!confirmBtn || !selectedZoneText) {
        return;
    }

    let selectedZone = '';

    zoneButtons.forEach(button => {
        button.addEventListener('click', () => {
            zoneButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedZone = button.dataset.zone || button.textContent.trim();
            selectedZoneText.textContent = `Selected zone: ${selectedZone}`;
        });
    });

    confirmBtn.addEventListener('click', () => {
        const name = nameInput?.value?.trim() || '';
        const phone = phoneInput?.value?.trim() || '';
        const guests = guestsInput?.value || '1 Guest';
        const dateTime = dateTimeInput?.value || 'Not specified';

        if (!name || !phone || !selectedZone) {
            alert('Please fill in your name, phone number, and choose a seating zone.');
            return;
        }

        const businessNumber = '+8801921-445232';
        const message = `👑 *Rajshahi Mistanno Bhandar - New Reservation* 👑%0A%0A*Name:* ${encodeURIComponent(name)}%0A*Phone:* ${encodeURIComponent(phone)}%0A*Guests:* ${encodeURIComponent(guests)}%0A*Date/Time:* ${encodeURIComponent(dateTime)}%0A*Seating Zone:* ${encodeURIComponent(selectedZone)}`;
        window.open(`https://wa.me/${businessNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    });
}

function initCheckoutPage() {
    const itemsContainer = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const taxEl = document.getElementById('checkout-tax');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const form = document.getElementById('checkout-form');
    const modalOverlay = document.getElementById('payment-modal-overlay');
    const closeModalBtn = document.getElementById('close-payment-modal');
    const backModalBtn = document.getElementById('payment-back-btn');
    const confirmModalBtn = document.getElementById('payment-confirm-btn');
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const paymentOptions = document.querySelectorAll('.payment-method-option');
    const paymentInputs = document.querySelectorAll('input[name="payment-method"]');

    if (!itemsContainer || !subtotalEl || !taxEl || !totalEl || !placeOrderBtn || !form) {
        return;
    }

    const checkoutItems = loadCart();
    cartItems = [...checkoutItems];

    function renderCheckoutSummary(items) {
        if (!items.length) {
            itemsContainer.innerHTML = '<p class="checkout-empty">Your cart is empty.</p>';
            subtotalEl.textContent = '$0.00';
            taxEl.textContent = '$0.00';
            totalEl.textContent = '$0.00';
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        itemsContainer.innerHTML = items.map(item => `
            <div class="checkout-item">
                <span>${item.quantity} × ${item.name}</span>
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
        `).join('');

        subtotalEl.textContent = formatCurrency(subtotal);
        taxEl.textContent = formatCurrency(tax);
        totalEl.textContent = formatCurrency(total);
    }

    function updateSelectedPaymentOption() {
        paymentOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            option.classList.toggle('active', radio?.checked);
        });
    }

    function openPaymentModal() {
        if (modalOverlay) {
            modalOverlay.classList.add('open');
            modalOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closePaymentModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('open');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    function getCustomerDetails() {
        const name = nameInput?.value?.trim() || '';
        const phone = phoneInput?.value?.trim() || '';
        const address = addressInput?.value?.trim() || '';

        if (!name || !phone || !address) {
            alert('Please fill in your name, phone number, and delivery address.');
            return null;
        }

        const customerDetails = { name, phone, address };
        localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customerDetails));
        return customerDetails;
    }

    function buildWhatsAppMessage(customerDetails, paymentMethod, subtotal, tax, total) {
        const orderLines = checkoutItems.map(item => `${item.quantity} x ${item.name} - ${formatCurrency(item.price * item.quantity)}`).join('%0A');
        return `👑 *Rajshahi Mistanno Bhandar - New Food Order* 👑%0A-----------------------------------------%0A👤 *Customer Name:* ${encodeURIComponent(customerDetails.name)}%0A📞 *Phone:* ${encodeURIComponent(customerDetails.phone)}%0A📍 *Delivery Address:* ${encodeURIComponent(customerDetails.address)}%0A💳 *Payment Method:* ${encodeURIComponent(paymentMethod)}%0A-----------------------------------------%0A🛒 *Order Items:*%0A${orderLines}%0A-----------------------------------------%0A💵 *Subtotal:* ${encodeURIComponent(formatCurrency(subtotal))}%0A📝 *Tax (8%):* ${encodeURIComponent(formatCurrency(tax))}%0A💰 *Grand Total:* ${encodeURIComponent(formatCurrency(total))}%0A-----------------------------------------%0A*Please prepare my royal meal!*`;
    }

    function finalizeOrder(paymentMethod) {
        const customerDetails = getCustomerDetails();
        if (!customerDetails) {
            return;
        }

        if (!checkoutItems.length) {
            alert('Your cart is empty. Add items before placing an order.');
            return;
        }

        const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (paymentMethod === 'online-payment') {
            closePaymentModal();
            window.location.href = 'online-payment.html';
            return;
        }

        const businessNumber = '+8801921-445232';
        const message = buildWhatsAppMessage(customerDetails, 'Cash on Delivery', subtotal, tax, total);
        window.open(`https://wa.me/${businessNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
        localStorage.removeItem(CART_KEY);
        cartItems = [];
        updateCartBadge();
        window.location.href = 'success.html';
    }

    renderCheckoutSummary(checkoutItems);
    updateSelectedPaymentOption();

    document.body.addEventListener('click', (event) => {
        const target = event.target;
        const optionButton = target.closest('.payment-method-option');

        if (optionButton) {
            const radio = optionButton.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                updateSelectedPaymentOption();
            }
            return;
        }

        if (target.closest('#place-order-btn')) {
            event.preventDefault();
            const customerDetails = getCustomerDetails();
            if (!customerDetails) {
                return;
            }
            openPaymentModal();
            return;
        }

        if (target.closest('#payment-back-btn') || target.closest('#close-payment-modal')) {
            event.preventDefault();
            closePaymentModal();
            return;
        }

        if (target.closest('#payment-confirm-btn')) {
            event.preventDefault();
            const selectedPayment = document.querySelector('input[name="payment-method"]:checked')?.value || 'hand-cash';
            finalizeOrder(selectedPayment);
        }
    });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closePaymentModal();
            }
        });
    }

    paymentInputs.forEach(input => {
        input.addEventListener('change', updateSelectedPaymentOption);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const customerDetails = getCustomerDetails();
        if (!customerDetails) {
            return;
        }
        openPaymentModal();
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePaymentModal);
    }

    if (backModalBtn) {
        backModalBtn.addEventListener('click', closePaymentModal);
    }

    if (confirmModalBtn) {
        confirmModalBtn.addEventListener('click', () => {
            const selectedPayment = document.querySelector('input[name="payment-method"]:checked')?.value || 'hand-cash';
            finalizeOrder(selectedPayment);
        });
    }
}

function initOnlinePaymentPage() {
    const copyButtons = document.querySelectorAll('.copy-account-btn');
    const providerItems = document.querySelectorAll('.provider-item');
    const confirmButton = document.getElementById('confirm-online-payment-btn');
    const summary = document.getElementById('online-payment-summary');
    const banner = document.getElementById('online-payment-banner');

    if (!copyButtons.length && !providerItems.length && !confirmButton) {
        return;
    }

    let cartItems = loadCart();
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const storedCustomer = JSON.parse(localStorage.getItem(CUSTOMER_INFO_KEY) || 'null');
    const lockWarningMessage = "Please input your account info and click the 'CONFIRM & SHARE VIA WHATSAPP' button below to log your order details first!";
    const unlockedBannerMessage = 'Order logged! Now click your selected payment method logo above to transfer funds, or use the bottom navigation to return.';
    let paymentUnlocked = sessionStorage.getItem('royalOnlinePaymentUnlocked') === 'true';

    if (summary) {
        summary.innerHTML = `
            <p class="payment-summary-label">Order total will be shared</p>
            <strong>${formatCurrency(total)}</strong>
        `;
    }

    function syncPaymentLockState() {
        providerItems.forEach(item => {
            const button = item.querySelector('.provider-button');
            item.classList.toggle('locked', !paymentUnlocked);
            item.classList.toggle('unlocked', paymentUnlocked);
            item.setAttribute('data-locked', String(!paymentUnlocked));

            if (button) {
                button.classList.toggle('locked', !paymentUnlocked);
                button.setAttribute('aria-disabled', String(!paymentUnlocked));
                button.setAttribute('data-locked', String(!paymentUnlocked));
            }
        });

        if (banner) {
            banner.textContent = paymentUnlocked ? unlockedBannerMessage : lockWarningMessage;
        }
    }

    syncPaymentLockState();

    copyButtons.forEach(button => {
        button.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const value = button.dataset.copy || '';
            if (!value) {
                return;
            }

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                } else {
                    const tempInput = document.createElement('input');
                    tempInput.value = value;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    tempInput.remove();
                }

                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.classList.add('copied');
                window.setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 1200);
            } catch (error) {
                console.error('Clipboard copy failed', error);
            }
        };
    });

    providerItems.forEach(item => {
        const button = item.querySelector('.provider-button');
        const input = item.querySelector('.provider-input');

        const openProvider = (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (!paymentUnlocked) {
                alert(lockWarningMessage);
                return;
            }

            const url = button?.dataset.url || item.dataset.url;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        };

        if (button) {
            button.addEventListener('click', openProvider);
        }

        item.addEventListener('click', (event) => {
            if (event.target.closest('.provider-input')) {
                return;
            }
            openProvider(event);
        });

        if (input) {
            input.addEventListener('focus', () => {
                item.classList.add('focused');
            });
            input.addEventListener('blur', () => {
                item.classList.remove('focused');
            });
        }
    });

    if (confirmButton) {
        confirmButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const inputs = Array.from(document.querySelectorAll('.provider-input'));
            const filledInput = inputs.find(input => input.value.trim());
            const selectedProvider = filledInput?.dataset.provider || 'Selected Method';
            const customerInfo = filledInput?.value?.trim() || '';

            if (!customerInfo) {
                alert('Please enter your account number or transaction ID to continue.');
                return;
            }

            paymentUnlocked = true;
            sessionStorage.setItem('royalOnlinePaymentUnlocked', 'true');
            syncPaymentLockState();

            const businessNumber = '+8801921-445232';
            const customerDetails = storedCustomer || { name: 'Not provided', phone: 'Not provided', address: 'Not provided' };
            const message = `👑 *Rajshahi Mistanno Bhandar - Online Payment Confirmation* 👑%0A-----------------------------------------%0A👤 *Customer Name:* ${encodeURIComponent(customerDetails.name || 'Not provided')}%0A📞 *Phone:* ${encodeURIComponent(customerDetails.phone || 'Not provided')}%0A📍 *Delivery Address:* ${encodeURIComponent(customerDetails.address || 'Not provided')}%0A💵 *Total Amount:* ${encodeURIComponent(formatCurrency(total))}%0A💳 *Paid Via:* ${encodeURIComponent(selectedProvider)}%0A🆔 *Customer Account/Txn ID:* ${encodeURIComponent(customerInfo)}%0A-----------------------------------------%0A*Please verify the payment and confirm my order!*`;
            window.open(`https://wa.me/${businessNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank', 'noopener,noreferrer');
        });
    }
}

// ========================================
// 6. SCROLL ANIMATIONS (OPTIONAL)
// ========================================

/**
 * Adds scroll animation effects to cards
 * Cards fade in and slide up as they come into view
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe featured cards
    const cards = document.querySelectorAll('.featured-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease-in-out, transform 0.6s ease-in-out';
        observer.observe(card);
    });
}

// ========================================
// 7. ADD PULSE ANIMATION (for cart)
// ========================================

/**
 * Add CSS animation for pulse effect
 */
function addPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.15);
            }
            100% {
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// 8. INITIALIZE ALL FUNCTIONS ON PAGE LOAD
// ========================================

/**
 * Waits for DOM to load and initializes all functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Rajshahi Mistanno Bhandar...');

    // Initialize hamburger menu
    initHamburgerMenu();

    // Initialize typewriter animation
    initTypewriterAnimation();

    // Initialize image sliders where present
    initImageSlider('gallery-slider', 'gallery-dots', 4000);
    initImageSlider('menu-slider', 'menu-dots', 4000);

    // Initialize shopping cart
    cartItems = loadCart();
    addPulseAnimation();
    initShoppingCart();

    // Initialize menu filters and add-to-cart buttons where present
    initCategoryFilters();
    attachAddToCartButtons();

    // Initialize button handlers
    initButtonHandlers();
    initReservationPage();
    initCheckoutPage();
    initOnlinePaymentPage();

    // Initialize scroll animations
    initScrollAnimations();

    console.log('Rajshahi Mistanno Bhandar website initialized successfully!');
});

// ========================================
// 9. SMOOTH SCROLL TO SECTIONS (BONUS)
// ========================================

/**
 * Optional: Handle smooth scrolling when nav links are clicked
 * This is already handled by CSS smooth-scroll, but included for reference
 */
document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link')) {
        const href = e.target.getAttribute('href');
        if (href.startsWith('#')) {
            // The CSS smooth-scroll property handles this
            // This is just for logging/debugging purposes
            console.log('Navigating to: ' + href);
        }
    }
});



