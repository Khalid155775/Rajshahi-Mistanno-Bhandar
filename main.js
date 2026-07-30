(() => {
    const STORAGE_KEY = 'foodfame_sweets_db';
    const TROLLEY_KEY = 'Mistanno_trolley';
    const MERCHANT_PHONE = '01921445232';

    const firebaseConfig = {
        apiKey: 'AIzaSyDSSMa4Y3EFP_beFzdOy-1sk84l195FVVY',
        authDomain: 'rajshahi-mistanno-bhandar.firebaseapp.com',
        projectId: 'rajshahi-mistanno-bhandar',
        storageBucket: 'rajshahi-mistanno-bhandar.firebasestorage.app',
        messagingSenderId: '107554400309',
        appId: '1:107554400309:web:514757fcb49f34c5b1697c'
    };

    let db = null;
    let storage = null;

    if (window.firebase && window.firebase.apps && typeof window.firebase.initializeApp === 'function') {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        db = window.firebase.firestore();
        storage = window.firebase.storage();
    }

    let globalSweets = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [{
        id: 1,
        name: 'রাজশাহী স্পেশাল রসকদম্ব',
        price: 350,
        desc: 'ঐতিহ্যবাহী সিগনেচার মিষ্টি।',
        img: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80'
    }];

    let trolley = [];

    function loadTrolley() {
        try {
            const stored = localStorage.getItem(TROLLEY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    function saveSweets() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSweets));
    }

    function saveTrolley() {
        localStorage.setItem(TROLLEY_KEY, JSON.stringify(trolley));
    }

    function hydrateSweetsFromLocalStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length) {
                    globalSweets = parsed;
                }
            }
        } catch (error) {
            console.warn('Unable to hydrate sweets from localStorage.', error);
        }
    }

    function syncSweetsWithFirebase() {
        if (!db || typeof db.collection !== 'function') {
            return;
        }

        db.collection('sweets').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
            const firebaseSweets = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data && data.name) {
                    firebaseSweets.push({
                        id: data.id || doc.id,
                        name: data.name,
                        price: Number(data.price) || 0,
                        desc: data.desc || '',
                        img: data.img || ''
                    });
                }
            });

            globalSweets = firebaseSweets;
            saveSweets();
            syncViews();
        }, () => {
            syncViews();
        });
    }

    function renderCustomerSweetsGrid(container = document.getElementById('customer-sweets-grid')) {
        if (!container) {
            return;
        }

        container.innerHTML = globalSweets.map((sweet) => `
            <article class="group flex min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18191a] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.35)] box-border md:p-2">
                <div class="h-44 w-full overflow-hidden rounded-t-2xl bg-slate-100">
                    <img src="${sweet.img}" alt="${sweet.name}" class="h-full w-full object-cover" onerror="this.style.display='none'" />
                </div>
                <div class="flex flex-1 flex-col p-3 sm:p-4">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="text-sm font-semibold leading-5 text-white">${sweet.name}</h3>
                        <span class="shrink-0 text-sm font-bold text-amber-400">৳${sweet.price}</span>
                    </div>
                    <p class="mt-2 text-xs leading-5 text-slate-400">${sweet.desc}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <span class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">PREMIUM</span>
                        <span class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">RICH</span>
                    </div>
                    <div class="mt-auto pt-3">
                        <button type="button" class="block w-full rounded-xl bg-[#ffeb3b] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.3em] text-black shadow-lg shadow-amber-400/20 transition hover:brightness-105" data-name="${sweet.name}" data-price="${sweet.price}" data-image="${sweet.img}">ADD TO CART</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function renderAdminInventory(container = document.getElementById('admin-table-container')) {
        if (!container) {
            return;
        }

        if (!globalSweets.length) {
            container.innerHTML = '<p class="text-sm text-slate-400">No sweets available yet.</p>';
            return;
        }

        container.innerHTML = globalSweets.map((sweet) => `
            <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="font-semibold text-white">${sweet.name}</p>
                        <p class="mt-1 text-sm text-slate-400">৳${sweet.price} • ${sweet.desc}</p>
                    </div>
                    <button type="button" onclick="adminDeleteSweet('${sweet.id}')" class="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300">Delete</button>
                </div>
            </div>
        `).join('');
    }

    function syncViews() {
        const hasCustomerGrid = !!document.getElementById('customer-sweets-grid');
        const hasAdminTable = !!document.getElementById('admin-table-container');

        if (hasCustomerGrid) {
            renderCustomerSweetsGrid();
        }

        if (hasAdminTable) {
            renderAdminInventory();
        }
    }

    function addNewSweetFromForm() {
        const nameInput = document.getElementById('sweet-name');
        const priceInput = document.getElementById('sweet-price');
        const descInput = document.getElementById('sweet-desc');
        const fileInput = document.getElementById('sweet-img-file');

        if (!nameInput || !priceInput || !descInput || !fileInput) {
            return;
        }

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value.trim());
        const desc = descInput.value.trim();
        let file = fileInput.files[0];

        if (!name || !desc || !price || Number.isNaN(price)) {
            alert('Please fill all sweet details before saving.');
            return;
        }

        if (!file) {
            alert('দয়া করে মিষ্টির ছবি ফাইল সিলেক্ট করুন! 🍬');
            return;
        }

        let reader = new FileReader();
        reader.onloadend = function() {
            let base64ImageUrl = reader.result;

            db.collection('sweets').add({
                name: name,
                price: price,
                desc: desc,
                img: base64ImageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                nameInput.value = '';
                priceInput.value = '';
                descInput.value = '';
                fileInput.value = '';
                alert('New sweet added successfully and synced to the live cloud storefront! 🚀');
            }).catch(err => alert('Error: ' + err.message));
        };

        reader.readAsDataURL(file);
    }

    function adminDeleteSweet(sweetId) {
        if (!db || typeof db.collection !== 'function') {
            globalSweets = globalSweets.filter((sweet) => String(sweet.id) !== String(sweetId));
            saveSweets();
            syncViews();
            return;
        }

        db.collection('sweets').doc(sweetId).delete()
            .catch((err) => {
                console.warn('Unable to delete sweet remotely.', err);
                globalSweets = globalSweets.filter((sweet) => String(sweet.id) !== String(sweetId));
                saveSweets();
                syncViews();
            });
    }

    function checkAdminPassword() {
        const passwordInput = document.getElementById('admin-password-input');
        const loginGate = document.getElementById('login-gate-box');
        const dashboard = document.getElementById('admin-dashboard');

        if (!passwordInput || !loginGate || !dashboard) {
            return;
        }

        const enteredPassword = String(passwordInput.value || '').trim();
        if (enteredPassword === 'admin123') {
            loginGate.classList.add('hidden');
            dashboard.classList.remove('hidden');
            dashboard.classList.add('block');
            passwordInput.value = '';
        } else {
            alert('Incorrect admin password.');
        }
    }

    function initHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        if (!hamburger || !navMenu) {
            return;
        }

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    function playTypewriterEffect(element) {
        if (!element || !document.body.contains(element)) {
            return;
        }

        const text = 'Rajshahi Mistanno Bhandar';
        let index = 0;
        let deleting = false;

        function tick() {
            if (!element || !document.body.contains(element)) {
                return;
            }

            element.textContent = text.substring(0, index);

            if (!deleting && index < text.length) {
                index += 1;
                setTimeout(tick, 100);
                return;
            }

            if (!deleting && index === text.length) {
                setTimeout(() => {
                    deleting = true;
                    tick();
                }, 1800);
                return;
            }

            if (deleting && index > 0) {
                index -= 1;
                setTimeout(tick, 60);
                return;
            }

            deleting = false;
            setTimeout(tick, 600);
        }

        tick();
    }

    function initTypewriterAnimation() {
        const element = document.getElementById('typed-brand-text') || document.getElementById('typewriter-text');
        if (!element) {
            return;
        }

        playTypewriterEffect(element);
    }

    function updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) {
            return;
        }

        const count = trolley.reduce((total, item) => total + item.quantity, 0);
        badge.textContent = count;
        badge.style.opacity = count > 0 ? '1' : '0.65';
    }

    function getCartSubtotal() {
        return trolley.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    function updateCartTotals() {
        const subtotalEl = document.getElementById('cart-subtotal');
        const taxEl = document.getElementById('cart-tax');
        const totalEl = document.getElementById('cart-total');
        const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
        const checkoutTaxEl = document.getElementById('checkout-tax');
        const checkoutGrandEl = document.getElementById('checkout-grand-total');

        const subtotal = getCartSubtotal();
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (subtotalEl) subtotalEl.textContent = `৳${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `৳${tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `৳${total.toFixed(2)}`;
        if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `৳${subtotal.toFixed(2)}`;
        if (checkoutTaxEl) checkoutTaxEl.textContent = `৳${tax.toFixed(2)}`;
        if (checkoutGrandEl) checkoutGrandEl.textContent = `৳${total.toFixed(2)}`;
    }

    function renderCartDrawer() {
        const wrapper = document.getElementById('cart-items-wrapper');
        if (!wrapper) {
            return;
        }

        if (!trolley.length) {
            wrapper.innerHTML = '<p class="text-zinc-500 text-sm text-center my-auto">Your cart is empty. Add items from the menu or patisserie.</p>';
            updateCartTotals();
            updateCartBadge();
            return;
        }

        wrapper.innerHTML = trolley.map((item, index) => `
            <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <img src="${item.image || ''}" alt="${item.name}" class="h-16 w-16 rounded-xl object-cover" onerror="this.style.display='none'" />
                <div class="flex-1">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <p class="text-sm font-semibold text-white">${item.name}</p>
                            <p class="mt-1 text-xs text-zinc-400">৳${item.price}</p>
                        </div>
                        <span class="text-sm font-semibold text-amber-400">৳${item.price * item.quantity}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between">
                        <div class="qty-controls">
                            <button type="button" class="qty-btn" data-action="decrease" data-index="${index}">−</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button type="button" class="qty-btn" data-action="increase" data-index="${index}">+</button>
                        </div>
                        <button onclick="removeProductFromCart('${item.name}')" class="text-zinc-500 hover:text-red-500 text-xs ml-2" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        updateCartTotals();
        updateCartBadge();
        renderCheckoutReceipt();
    }

    function renderCheckoutReceipt() {
        const receiptWrapper = document.getElementById('final-receipt-items');
        if (!receiptWrapper) {
            return;
        }

        if (!trolley.length) {
            receiptWrapper.innerHTML = '<p class="text-sm text-zinc-500">Your receipt is empty.</p>';
            updateCartTotals();
            return;
        }

        receiptWrapper.innerHTML = trolley.map((item) => `
            <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div>
                    <p class="text-sm font-semibold text-white">${item.quantity} × ${item.name}</p>
                    <p class="text-xs text-zinc-400">৳${item.price}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-amber-400">৳${item.price * item.quantity}</span>
                    <button onclick="removeProductFromCart('${item.name}')" class="text-zinc-500 hover:text-red-500 text-xs" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        `).join('');

        updateCartTotals();
    }

    function addItemToCart(item) {
        const existing = trolley.find((cartItem) => cartItem.name === item.name);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            trolley.push({ ...item });
        }

        trolley = [...trolley];
        saveTrolley();
        renderCartDrawer();
    }

    function toggleCartDrawer(forceOpen) {
        const overlay = document.getElementById('cart-drawer-overlay');
        const drawer = document.getElementById('cart-drawer');

        if (!overlay || !drawer) {
            return;
        }

        const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !overlay.classList.contains('open');
        overlay.classList.toggle('open', isOpen);
        overlay.classList.toggle('pointer-events-none', !isOpen);
        drawer.classList.toggle('translate-x-0', isOpen);
        drawer.classList.toggle('translate-x-full', !isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function removeProductFromCart(itemName) {
        trolley = trolley.filter((item) => item.name !== itemName);
        saveTrolley();
        renderCartDrawer();
        renderCheckoutReceipt();
        updateCartBadge();
    }

    function syncBodyOverflow() {
        const checkoutView = document.getElementById('checkout-view');
        const paymentView = document.getElementById('payment-popup-view');
        const anyOpen = (checkoutView && !checkoutView.classList.contains('hidden')) || (paymentView && !paymentView.classList.contains('hidden'));
        document.body.style.overflow = anyOpen ? 'hidden' : '';
    }

    function showCheckoutView() {
        const checkoutView = document.getElementById('checkout-view');

        if (checkoutView) {
            checkoutView.classList.remove('hidden');
            checkoutView.classList.add('flex');
            checkoutView.classList.remove('items-center');
            checkoutView.classList.add('items-start');
            checkoutView.scrollTop = 0;
        }

        renderCheckoutReceipt();
        updateCartTotals();
        syncBodyOverflow();
    }

    function closeCheckoutPopUp() {
        const checkoutView = document.getElementById('checkout-view');
        if (checkoutView) {
            checkoutView.classList.add('hidden');
            checkoutView.classList.remove('flex');
            checkoutView.scrollTop = 0;
        }
        syncBodyOverflow();
    }

    function showPaymentPopupView() {
        const paymentView = document.getElementById('payment-popup-view');
        if (paymentView) {
            paymentView.classList.remove('hidden');
            paymentView.classList.add('flex');
        }
        syncBodyOverflow();
    }

    function closePaymentPopUp() {
        const paymentView = document.getElementById('payment-popup-view');
        if (paymentView) {
            paymentView.classList.add('hidden');
            paymentView.classList.remove('flex');
        }
        syncBodyOverflow();
    }

    function finalOrderWhatsAppDispatch(merchantNumber) {
        const name = document.getElementById('checkout-name')?.value?.trim() || '';
        const phone = document.getElementById('checkout-phone')?.value?.trim() || '';
        const address = document.getElementById('checkout-address')?.value?.trim() || '';

        if (!trolley.length) {
            alert('Your cart is empty.');
            return;
        }

        if (!name || !phone || !address) {
            alert('Please fill out your delivery details before placing the order.');
            return;
        }

        const subtotal = getCartSubtotal();
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        const itemsBlock = trolley.map((item) => `${item.quantity} × ${item.name} - ৳${(item.price * item.quantity).toFixed(2)}`).join('\n');
        const message = `👑 *Rajshahi Mistanno Bhandar - New Food Order* 
        👑----------------------------------------- 
        👤*Customer Name:* ${name}📞 *Phone:* ${phone}📍
         *Delivery Address:* ${address}💵 *Payment Method:* Cash on Delivery
         -----------------------------------------📦
          *Order Items:*${itemsBlock}-----------------------------------------📊
           *Subtotal:* ৳${subtotal.toFixed(2)}💸 *Tax (8%):* ৳${tax.toFixed(2)} 
          *Grand Total:* ৳${total.toFixed(2)}-----------------------------------------
          *Please prepare my royal meal!*`;

        const businessNumber = '+8801921445232';
        window.open(`https://wa.me/${businessNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');

        trolley = [];
        localStorage.removeItem(TROLLEY_KEY);
        saveTrolley();
        renderCartDrawer();
        renderCheckoutReceipt();
        updateCartBadge();
        updateCartTotals();
        closeCheckoutPopUp();
        closePaymentPopUp();
        toggleCartDrawer(false);
    }

    function handleOrderNow() {
        if (!trolley.length) {
            alert('Your cart is empty. Add items before placing an order.');
            return;
        }

        toggleCartDrawer(false);
        showCheckoutView();
    }

    function initCartInteractions() {
        const cartElement = document.getElementById('shopping-cart');
        const closeBtn = document.getElementById('close-cart-btn');
        const overlay = document.getElementById('cart-drawer-overlay');
        const orderBtn = document.getElementById('order-now-btn');
        const finalCheckoutBtn = document.getElementById('final-checkout-btn');
        const paymentConfirmBtn = document.getElementById('payment-confirm-btn');
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const passwordInput = document.getElementById('admin-password-input');

        if (cartElement) {
            cartElement.addEventListener('click', () => toggleCartDrawer(true));
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => toggleCartDrawer(false));
        }

        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    toggleCartDrawer(false);
                }
            });
        }

        if (orderBtn) {
            orderBtn.addEventListener('click', handleOrderNow);
        }

        if (finalCheckoutBtn) {
            finalCheckoutBtn.addEventListener('click', () => {
                const name = document.getElementById('checkout-name')?.value?.trim() || '';
                const phone = document.getElementById('checkout-phone')?.value?.trim() || '';
                const address = document.getElementById('checkout-address')?.value?.trim() || '';

                if (!trolley.length) {
                    alert('Your cart is empty.');
                    return;
                }

                if (!name || !phone || !address) {
                    alert('Please fill out your delivery details before placing the order.');
                    return;
                }

                showPaymentPopupView();
            });
        }

        if (paymentConfirmBtn) {
            paymentConfirmBtn.addEventListener('click', () => finalOrderWhatsAppDispatch(MERCHANT_PHONE));
        }

        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', checkAdminPassword);
        }

        if (passwordInput) {
            passwordInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    checkAdminPassword();
                }
            });
        }

        document.body.addEventListener('click', (event) => {
            const button = event.target.closest('[data-name][data-price]');
            if (button) {
                addItemToCart({
                    name: button.dataset.name,
                    price: Number(button.dataset.price) || 0,
                    image: button.dataset.image || '',
                    quantity: 1
                });
                return;
            }

            const qtyButton = event.target.closest('[data-action][data-index]');
            if (!qtyButton) {
                return;
            }

            const index = Number(qtyButton.dataset.index);
            if (!Number.isInteger(index) || !trolley[index]) {
                return;
            }

            if (qtyButton.dataset.action === 'increase') {
                trolley[index].quantity += 1;
            } else {
                trolley[index].quantity = Math.max(1, trolley[index].quantity - 1);
            }

            trolley = [...trolley];
            saveTrolley();
            renderCartDrawer();
        });

        trolley = loadTrolley();
        renderCartDrawer();
        renderCheckoutReceipt();
        updateCartBadge();
        updateCartTotals();
    }

    function initGeolocationCheckout() {
        const locationTarget = document.getElementById('delivery-location') || document.getElementById('checkout-map');
        if (!locationTarget) {
            return;
        }

        if (!navigator.geolocation) {
            locationTarget.textContent = 'Live map tracking unavailable in this browser.';
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const locationText = `Live tracking: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
            if (locationTarget.tagName === 'INPUT' || locationTarget.tagName === 'TEXTAREA') {
                locationTarget.value = locationText;
            } else {
                locationTarget.textContent = locationText;
            }
        }, () => {
            if (locationTarget.tagName === 'INPUT' || locationTarget.tagName === 'TEXTAREA') {
                locationTarget.value = 'Location access blocked.';
            } else {
                locationTarget.textContent = 'Location access blocked.';
            }
        });
    }

    function initialize() {
        hydrateSweetsFromLocalStorage();
        initHamburgerMenu();
        initTypewriterAnimation();
        initCartInteractions();
        initGeolocationCheckout();
        syncViews();
        syncSweetsWithFirebase();
    }

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            globalSweets = JSON.parse(event.newValue) || [];
            syncViews();
        }

        if (event.key === TROLLEY_KEY) {
            trolley = JSON.parse(event.newValue) || [];
            renderCartDrawer();
            updateCartBadge();
        }
    });

    window.addEventListener('DOMContentLoaded', initialize);

    window.checkAdminPassword = checkAdminPassword;
    window.addNewSweetFromForm = addNewSweetFromForm;
    window.adminDeleteSweet = adminDeleteSweet;
    window.syncViews = syncViews;
    window.removeProductFromCart = removeProductFromCart;
    window.closeCheckoutPopUp = closeCheckoutPopUp;
    window.closePaymentPopUp = closePaymentPopUp;
})();
