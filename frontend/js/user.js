// ================================================================
//  USER · NX7G SHOP (con menú lateral funcional)
// ================================================================

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'login.html';
}

// ================================================================
//  ELEMENTOS DOM
// ================================================================

const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const profileToggle = document.getElementById('profileToggle');
const profileDropdown = document.getElementById('profileDropdown');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const productsContainer = document.getElementById('products');
const noProductsMsg = document.getElementById('noProductsMessage');
const categoryBtns = document.querySelectorAll('.category-btn');
const loadMoreBtn = document.getElementById('loadMoreBtn');

const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

// ================================================================
//  MOSTRAR DATOS DEL USUARIO
// ================================================================

document.getElementById('usernameDisplay').textContent = user.username;
document.getElementById('dropdownUsername').textContent = user.username;
document.getElementById('dropdownCredits').textContent = user.credits;

// ================================================================
//  MENÚ HAMBURGUESA
// ================================================================

function openMenu(e) {
    if (e) e.preventDefault();
    sideMenu.classList.add('open');
    menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMenu(e) {
    if (e) e.preventDefault();
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

menuToggle.addEventListener('click', openMenu);
menuToggle.addEventListener('touchstart', openMenu, { passive: false });

closeMenuBtn.addEventListener('click', closeMenu);
closeMenuBtn.addEventListener('touchstart', closeMenu, { passive: false });

menuOverlay.addEventListener('click', closeMenu);
menuOverlay.addEventListener('touchstart', closeMenu, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
        closeDropdown();
    }
});

// ================================================================
//  DROPDOWN PERFIL
// ================================================================

function toggleDropdown(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('open');
    profileToggle.classList.toggle('active');
    if (profileDropdown.classList.contains('open')) {
        closeMenu();
    }
}

function closeDropdown() {
    profileDropdown.classList.remove('open');
    profileToggle.classList.remove('active');
}

profileToggle.addEventListener('click', toggleDropdown);

document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
        closeDropdown();
    }
});

// ================================================================
//  CATEGORÍAS
// ================================================================

let currentCategory = 'all';

categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        categoryBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        applyFilters();
    });
});

// ================================================================
//  BUSCADOR
// ================================================================

let allProducts = [];
let visibleProducts = 0;
const PRODUCTS_PER_PAGE = 5;

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    clearSearchBtn.style.display = query ? 'block' : 'none';
    applyFilters();
});

clearSearchBtn.addEventListener('click', function() {
    searchInput.value = '';
    this.style.display = 'none';
    applyFilters();
    searchInput.focus();
});

function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allProducts;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory);
    }

    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    visibleProducts = 0;
    renderProducts(filtered);
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
        allProducts = products.map(p => {
            if (!p.category) {
                const cats = ['streaming', 'giftcards', 'cursos', 'otros'];
                p.category = cats[Math.floor(Math.random() * cats.length)];
            }
            return p;
        });
        applyFilters();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function renderProducts(products) {
    productsContainer.innerHTML = '';
    if (products.length === 0) {
        noProductsMsg.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        return;
    }
    noProductsMsg.style.display = 'none';

    const toShow = products.slice(0, visibleProducts + PRODUCTS_PER_PAGE);
    visibleProducts = toShow.length;

    toShow.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card-v2';

        let icon = 'fa-gem';
        if (p.category === 'streaming') icon = 'fa-film';
        else if (p.category === 'giftcards') icon = 'fa-gift';
        else if (p.category === 'cursos') icon = 'fa-graduation-cap';
        else icon = 'fa-ellipsis-h';

        const catLabel = p.category.charAt(0).toUpperCase() + p.category.slice(1);

        let badge = '';
        if (p.id === 1) badge = '<span class="badge-new">Nuevo</span>';
        else if (p.id === 2) badge = '<span class="badge-popular">Popular</span>';

        card.innerHTML = `
            <div class="card-header">
                <div class="icon-wrapper">
                    <i class="fas ${icon}"></i>
                </div>
                ${badge}
            </div>
            <div class="card-body">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description || catLabel}</p>
                <div class="product-meta">
                    <span><i class="fas fa-boxes"></i> Stock: <span class="stock ${p.stock === 0 ? 'empty' : p.stock <= 3 ? 'low' : ''}">${p.stock}</span></span>
                    <span class="category-tag">${catLabel}</span>
                </div>
                <div class="product-price">$${p.price} <small>USD</small></div>
            </div>
            <div class="card-actions">
                <button class="btn-detail" onclick="verDetalles(${p.id})">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
                <button class="btn-buy" onclick="comprarProducto(${p.id}, ${p.price})">
                    <i class="fas fa-shopping-cart"></i> Comprar
                </button>
            </div>
        `;
        productsContainer.appendChild(card);
    });

    if (visibleProducts < products.length) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.textContent = `Ver más productos (${products.length - visibleProducts} restantes)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

loadMoreBtn.addEventListener('click', function() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allProducts;
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory);
    }
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }
    renderProducts(filtered);
});

// ================================================================
//  COMPRA
// ================================================================

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
            document.getElementById('dropdownCredits').textContent = user.credits;

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
//  VER DETALLES
// ================================================================

window.verDetalles = function(id) {
    window.location.href = `detalle-producto.html?id=${id}`;
};

// ================================================================
//  MODAL DE COMPRA
// ================================================================

document.getElementById('closeModal').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('codeModal')) {
        closeModal();
    }
});

function closeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

window.copyCode = function() {
    const code = document.getElementById('purchasedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Código copiado al portapapeles');
    }).catch(() => {
        alert('No se pudo copiar, selecciona manualmente');
    });
};

// ================================================================
//  MODAL DE CANJE
// ================================================================

const redeemModal = document.getElementById('redeemModal');
const redeemInput = document.getElementById('redeemCodeInput');
const redeemBtn = document.getElementById('redeemBtn');
const redeemMessage = document.getElementById('redeemMessage');

function cerrarRedeemModal() {
    redeemModal.style.display = 'none';
}

document.getElementById('menuCanjear').addEventListener('click', function(e) {
    e.preventDefault();
    closeMenu();
    redeemModal.style.display = 'flex';
    redeemInput.value = '';
    redeemMessage.textContent = '';
    redeemInput.focus();
});

redeemModal.addEventListener('click', function(e) {
    if (e.target === redeemModal) cerrarRedeemModal();
});

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
            document.getElementById('dropdownCredits').textContent = user.credits;
            redeemInput.value = '';
            setTimeout(() => {
                cerrarRedeemModal();
                redeemMessage.textContent = '';
            }, 2000);
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
//  CERRAR SESIÓN
// ================================================================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

logoutMenuBtn.addEventListener('click', logout);
logoutDropdownBtn.addEventListener('click', logout);

// ================================================================
//  INICIALIZAR
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});