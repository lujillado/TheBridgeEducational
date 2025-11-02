(function() {
    const STORAGE_KEY = 'tb_cart_v1';

    function loadCart() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        renderCartUI();
    }

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD').replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function addItem(id, name, qty) {
        const quantity = Number(qty) || 1;
        const cart = loadCart();
        const idx = cart.findIndex(i => i.id === id);
        if (idx >= 0) {
            cart[idx].qty += quantity;
        } else {
            cart.push({ id, name: name || id, qty: quantity });
        }
        saveCart(cart);
    }

    function removeItem(id) {
        const cart = loadCart().filter(i => i.id !== id);
        saveCart(cart);
    }

    function updateQuantity(id, qty) {
        const newQty = Number(qty) || 0;
        let cart = loadCart();
        const idx = cart.findIndex(i => i.id === id);
        if (idx === -1) return;
        if (newQty <= 0) {
            cart = cart.filter(i => i.id !== id);
        } else {
            cart[idx].qty = newQty;
        }
        saveCart(cart);
    }

    function getCount() {
        return loadCart().reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    }

    function ensureUI() {
        if (document.querySelector('.cart-fab')) return; // already created

        const fab = document.createElement('button');
        fab.className = 'cart-fab';
        fab.setAttribute('aria-label', 'Carrito');
        fab.innerHTML = '<span class="cart-icon">🛒</span><span class="cart-badge">0</span>';

        const backdrop = document.createElement('div');
        backdrop.className = 'cart-backdrop';

        const drawer = document.createElement('aside');
        drawer.className = 'cart-drawer';
        drawer.innerHTML = [
            '<div class="cart-header">',
            '  <h3>Tu carrito</h3>',
            '  <button class="cart-close" aria-label="Cerrar">×</button>',
            '</div>',
            '<div class="cart-body">',
            '  <ul class="cart-items"></ul>',
            '</div>',
            '<div class="cart-footer">',
            '  <button class="cart-clear">Vaciar</button>',
            '  <button class="cart-submit">Enviar mis datos</button>',
            '</div>'
        ].join('');

        document.body.appendChild(fab);
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);

        fab.addEventListener('click', () => openCart());
        backdrop.addEventListener('click', () => closeCart());
        drawer.querySelector('.cart-close').addEventListener('click', () => closeCart());
        drawer.querySelector('.cart-clear').addEventListener('click', () => { saveCart([]); });
        const submitBtn = drawer.querySelector('.cart-submit');
        submitBtn.addEventListener('click', () => {
            if (submitBtn.disabled) return;
            // Simular envío: vaciar carrito, cerrar y mostrar confirmación
            saveCart([]);
            closeCart();
            showToast('Tus datos fueron enviados, te contactaremos en breve con más información');
        });

        drawer.addEventListener('click', (e) => {
            const btn = e.target;
            if (!(btn instanceof Element)) return;
            if (btn.matches('.qty-minus')) {
                const id = btn.closest('li').dataset.id;
                const input = btn.closest('li').querySelector('.qty-input');
                const value = Math.max(0, Number(input.value) - 1);
                updateQuantity(id, value);
            }
            if (btn.matches('.qty-plus')) {
                const id = btn.closest('li').dataset.id;
                const input = btn.closest('li').querySelector('.qty-input');
                const value = Math.max(1, Number(input.value) + 1);
                updateQuantity(id, value);
            }
            if (btn.matches('.item-remove')) {
                const id = btn.closest('li').dataset.id;
                removeItem(id);
            }
        });

        drawer.addEventListener('change', (e) => {
            const input = e.target;
            if (!(input instanceof Element)) return;
            if (input.matches('.qty-input')) {
                const id = input.closest('li').dataset.id;
                const value = Math.max(0, Number(input.value) || 0);
                updateQuantity(id, value);
            }
        });
    }

    function openCart() {
        document.body.classList.add('cart-open');
        document.querySelector('.cart-backdrop').classList.add('show');
        document.querySelector('.cart-drawer').classList.add('open');
    }

    function closeCart() {
        document.body.classList.remove('cart-open');
        document.querySelector('.cart-backdrop').classList.remove('show');
        document.querySelector('.cart-drawer').classList.remove('open');
    }

    function renderCartUI() {
        ensureUI();
        const cart = loadCart();
        const badge = document.querySelector('.cart-badge');
        if (badge) badge.textContent = String(getCount());
        const submit = document.querySelector('.cart-submit');
        if (submit) submit.disabled = cart.length === 0;

        const list = document.querySelector('.cart-items');
        if (!list) return;
        list.innerHTML = '';
        if (cart.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cart-empty';
            empty.textContent = 'Tu carrito está vacío';
            list.parentElement.replaceChildren(list, empty);
            return;
        } else {
            const body = list.parentElement;
            const empty = body.querySelector('.cart-empty');
            if (empty) empty.remove();
        }

        cart.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.dataset.id = item.id;
            li.innerHTML = [
                '<div class="item-info">',
                `  <div class="item-name">${item.name}</div>`,
                '</div>',
                '<div class="item-actions">',
                '  <div class="qty-controls">',
                '    <button class="qty-minus" aria-label="Restar">−</button>',
                `    <input class="qty-input" inputmode="numeric" value="${item.qty}" aria-label="Cantidad">`,
                '    <button class="qty-plus" aria-label="Sumar">+</button>',
                '  </div>',
                '  <button class="item-remove" aria-label="Eliminar">Eliminar</button>',
                '</div>'
            ].join('');
            list.appendChild(li);
        });
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    function bindAddToCartButtons() {
        const buttons = document.querySelectorAll('.add-to-cart');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const el = e.currentTarget;
                const dataset = el.dataset;
                const name = dataset.name || el.textContent.trim() || 'Programa';
                const id = dataset.id || slugify(name);
                const qty = Number(dataset.qty) || 1;
                addItem(id, name, qty);
                const fab = document.querySelector('.cart-fab');
                if (fab) {
                    fab.classList.add('added');
                    setTimeout(() => fab.classList.remove('added'), 300);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        ensureUI();
        renderCartUI();
        bindAddToCartButtons();
    });

    window.TB_CART = {
        addItem,
        removeItem,
        updateQuantity,
        getItems: loadCart
    };
})();


