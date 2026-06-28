// ================================================================
//  USER · NIX SPHERE (con menú lateral y secciones)
// ================================================================

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'login.html';
}

// ================================================================
//  ELEMENTOS DOM
// ================================================================

// Menú lateral
const sidebar = document.getElementById('userSidebar');
const overlay = document.getElementById('sidebarOverlay');
const hamburgerToggle = document.getElementById('hamburgerToggle');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
const sections = document.querySelectorAll('.user-section');
const pageTitle = document.getElementById('pageTitle');
const headerCredits = document.getElementById('headerCredits');

// Productos
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const productsContainer = document.getElementById('products');
const noProductsMsg = document.getElementById('noProductsMessage');

// Canje
const redeemInput = document.getElementById('redeemCodeInput');
const redeemBtn = document.getElementById('redeemBtn');
const redeemMessage = document.getElementById('redeemMessage');

// Cerrar sesión (sidebar)
const logoutSidebarBtn = document.getElementById('logoutSidebarBtn');

// ================================================================
//  MENÚ LATERAL
// ================================================================

function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
}

hamburgerToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', closeSidebar);

// Navegación por secciones
navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        const section = this.dataset.section;
        sections.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`section-${section}`);
        if (target) target.classList.add('active');

        const titles = {
            'inicio': 'Inicio',
            'canjear': 'Canjear código',
            'combos': 'Combos',
            'config': 'Configuración'
        };
        pageTitle.textContent = titles[section] || 'Inicio';
        closeSidebar();
    });
});

// Cerrar sesión desde el sidebar
logoutSidebarBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// ================================================================
//  MOSTRAR CRÉDITOS
// ================================================================

headerCredits.textContent = user.credits;

// ================================================================
//  BUSCADOR DE PRODUCTOS
// ================================================================

let allProducts = [];

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    clearSearchBtn.style.display = query ? 'block' : 'none';
    filterProducts(query);
});

clearSearchBtn.addEventListener('click', function() {
    searchInput.value = '';
    this.style.display = 'none';
    filterProducts('');
    searchInput.focus();
});

function filterProducts(query) {
    if (!allProducts.length) return;
    const filtered = query ? allProducts.filter(p => p.name.toLowerCase().includes(query)) : allProducts;
    renderProducts(filtered);
    noProductsMsg.style.display = filtered.length === 0 ? 'block' : 'none';
}

// ================================================================
//  CARGAR PRODUCTOS
// ================================================================

async function loadProducts() {
    try {
        const response = await fetch('/api/user/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        allProducts = products;
        renderProducts(products);
        noProductsMsg.style.display = products.length === 0 ? 'block' : 'none';
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function renderProducts(products) {
    productsContainer.innerHTML = '';
    if (products.length === 0) return;

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} <small>créditos</small></div>
            <div class="product-stock">
                <span><i class="fas fa-boxes"></i> Stock:</span>
                <span class="stock-badge">${p.stock}</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn-detail" onclick="verDetalles(${p.id})">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
                <button class="buy-btn" onclick="comprarProducto(${p.id}, ${p.price})">
                    <i class="fas fa-shopping-cart"></i> Comprar
                </button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

// ================================================================
//  FUNCIONES GLOBALES (detalles y compra)
// ================================================================

window.verDetalles = function(id) {
    window.location.href = `detalle-producto.html?id=${id}`;
};

window.comprarProducto = async function(productId, price) {
    if (user.credits < price) {
        alert('Créditos insuficientes');
        return;
    }

    if (!confirm(`¿Confirmas la compra de este producto por ${price} créditos?`)) return;

    try {
        const response = await fetch(`/api/user/buy/${productId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            user.credits = data.credits_remaining;
            localStorage.setItem('user', JSON.stringify(user));
            headerCredits.textContent = user.credits;

            sessionStorage.setItem('productoComprado', JSON.stringify({
                nombre: data.product_name || 'Producto',
                contenido: data.code
            }));
            window.location.href = 'producto-comprado.html';
        } else {
            alert(data.message || 'Error al comprar');
            loadProducts();
        }
    } catch (error) {
        console.error('Error en compra:', error);
        alert('Error de conexión');
    }
};

// ================================================================
//  CANJEAR CÓDIGO
// ================================================================

redeemBtn.addEventListener('click', async function() {
    const code = redeemInput.value.trim().toUpperCase();
    if (!code) {
        redeemMessage.textContent = '❌ Ingresa un código.';
        redeemMessage.style.color = 'var(--danger)';
        return;
    }

    try {
        const response = await fetch('/api/user/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok) {
            redeemMessage.textContent = '✅ ' + data.message;
            redeemMessage.style.color = 'var(--success)';
            user.credits += data.amount;
            localStorage.setItem('user', JSON.stringify(user));
            headerCredits.textContent = user.credits;
            redeemInput.value = '';
            setTimeout(() => {
                redeemMessage.textContent = '';
            }, 4000);
        } else {
            redeemMessage.textContent = '❌ ' + data.message;
            redeemMessage.style.color = 'var(--danger)';
        }
    } catch (error) {
        console.error('Error al canjear:', error);
        redeemMessage.textContent = '❌ Error de conexión.';
        redeemMessage.style.color = 'var(--danger)';
    }
});

redeemInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') redeemBtn.click();
});

// ================================================================
//  INICIALIZAR
// ================================================================

loadProducts();