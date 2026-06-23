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
const categoryBtns = document.querySelectorAll('.category-btn');

const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

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
//  CATEGORÍAS
// ============================================================
let currentCategory = 'all';

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        applyFilters();
    });
});

// ============================================================
//  BUSCADOR
// ============================================================
let allProducts = [];

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

    // Filtro por categoría (simulado con una propiedad 'category' en el producto)
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory);
    }

    // Filtro por búsqueda (nombre)
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

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
        // Asignar categorías simuladas (por ahora, si no tienen, las asignamos aleatorias para demostración)
        allProducts = products.map(p => {
            if (!p.category) {
                const cats = ['netflix', 'spotify', 'amazon', 'otros'];
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
    if (products.length === 0) return;
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Badge según categoría (simulado)
        let badgeText = '';
        if (p.category === 'netflix') badgeText = 'Netflix';
        else if (p.category === 'spotify') badgeText = 'Spotify';
        else if (p.category === 'amazon') badgeText = 'Amazon';
        else badgeText = 'Otros';

        card.innerHTML = `
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} <small>créditos</small></div>
            <div class="product-stock">
                <span><i class="fas fa-boxes"></i> Stock:</span>
                <span class="stock-badge">${p.stock}</span>
                <span style="margin-left:auto; font-size:0.7rem; color:var(--text-secondary);">${badgeText}</span>
            </div>
            <button class="buy-btn" onclick="buyProduct(${p.id}, ${p.price})">
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