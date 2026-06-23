// ============================================================
//  AUTENTICACIÓN
// ============================================================
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'index.html';
}

// ============================================================
//  ELEMENTOS DOM
// ============================================================
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

const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');
const categoryBtns = document.querySelectorAll('.category-btn');

// ============================================================
//  MOSTRAR DATOS DEL USUARIO
// ============================================================
document.getElementById('usernameDisplay').textContent = user.username;
document.getElementById('dropdownUsername').textContent = user.username;
document.getElementById('dropdownCredits').textContent = user.credits;

// ============================================================
//  MENÚ HAMBURGUESA
// ============================================================
function openMenu() {
    sideMenu.classList.add('open');
    menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
        closeDropdown();
    }
});

// ============================================================
//  DROPDOWN PERFIL
// ============================================================
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

// ============================================================
//  BUSCADOR
// ============================================================
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
    const filtered = query
        ? allProducts.filter(p => p.name.toLowerCase().includes(query))
        : allProducts;
    renderProducts(filtered);
    noProductsMsg.style.display = filtered.length === 0 ? 'block' : 'none';
}

// ============================================================
//  CATEGORÍAS
// ============================================================
categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        categoryBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const category = this.dataset.category;
        filterByCategory(category);
    });
});

function filterByCategory(category) {
    if (!allProducts.length) return;
    const filtered = category === 'all'
        ? allProducts
        : allProducts.filter(p => p.category && p.category.toLowerCase() === category);
    renderProducts(filtered);
    noProductsMsg.style.display = filtered.length === 0 ? 'block' : 'none';
}

// ============================================================
//  CARGAR PRODUCTOS
// ============================================================
async function loadProducts() {
    try {
        const response = await fetchWithAuth('/api/user/products');
        const products = await response.json();
        // Simular categorías para demostración (si no vienen del backend)
        const categories = ['netflix', 'spotify', 'amazon', 'other'];
        products.forEach((p, index) => {
            if (!p.category) {
                p.category = categories[index % categories.length];
            }
        });
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
        const stockClass = p.stock > 0 ? 'in-stock' : 'out-of-stock';
        const stockText = p.stock > 0 ? `${p.stock} disponibles` : 'Agotado';
        const disabledAttr = p.stock <= 0 ? 'disabled' : '';
        card.innerHTML = `
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} <small>créditos</small></div>
            <div class="product-stock">
                <span><i class="fas fa-boxes"></i> Stock:</span>
                <span class="stock-badge ${stockClass}">${stockText}</span>
            </div>
            <button class="buy-btn" onclick="buyProduct(${p.id}, ${p.price})" ${disabledAttr}>
                <i class="fas fa-shopping-cart"></i> Comprar ahora
            </button>
        `;
        productsContainer.appendChild(card);
    });
}

// ============================================================
//  COMPRA
// ============================================================
window.buyProduct = async function(productId, price) {
    if (user.credits < price) {
        alert('Créditos insuficientes');
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/user/buy/${productId}`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
            user.credits -= price;
            localStorage.setItem('user', JSON.stringify(user));
            
            document.getElementById('dropdownCredits').textContent = user.credits;

            document.getElementById('purchasedCode').textContent = data.code;
            document.getElementById('remainingCredits').innerHTML = `Créditos restantes: <strong>${user.credits}</strong>`;
            document.getElementById('codeModal').style.display = 'flex';

            loadProducts();
        } else {
            alert(data.message || 'Error al comprar');
        }
    } catch (error) {
        console.error('Error en compra:', error);
    }
};

// ============================================================
//  MODAL
// ============================================================
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

// ============================================================
//  FETCH CON AUTENTICACIÓN
// ============================================================
async function fetchWithAuth(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
    return response;
}

// ============================================================
//  CERRAR SESIÓN
// ============================================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

logoutMenuBtn.addEventListener('click', logout);
logoutDropdownBtn.addEventListener('click', logout);

// ============================================================
//  INICIALIZAR
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// ============================================================
//  CERRAR MENÚS AL HACER CLICK EN ITEMS
// ============================================================
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
        closeMenu();
        console.log('Sección:', item.dataset.section);
    });
});

document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
        closeDropdown();
        console.log('Sección:', item.dataset.section);
    });
});