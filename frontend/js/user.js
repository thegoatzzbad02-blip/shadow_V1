// ===== AUTENTICACIÓN =====
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'index.html';
}

// ===== ELEMENTOS DOM =====
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
const logoutBtn = document.getElementById('logoutBtn');
const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

// ===== DATOS =====
let allProducts = []; // Guardar todos los productos para filtrar

// ===== MOSTRAR DATOS DEL USUARIO =====
document.getElementById('usernameDisplay').textContent = user.username;
document.getElementById('dropdownUsername').textContent = user.username;
document.getElementById('dropdownCredits').textContent = user.credits;
document.getElementById('credits').textContent = user.credits;

// ===== MENÚ HAMBURGUESA =====
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

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
        closeDropdown();
    }
});

// ===== DROPDOWN PERFIL =====
function toggleDropdown(e) {
    e.stopPropagation();
    const isOpen = profileDropdown.classList.contains('open');
    profileDropdown.classList.toggle('open');
    profileToggle.classList.toggle('active');
    if (!isOpen) {
        closeMenu(); // Cerrar menú lateral si está abierto
    }
}

function closeDropdown() {
    profileDropdown.classList.remove('open');
    profileToggle.classList.remove('active');
}

profileToggle.addEventListener('click', toggleDropdown);

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
        closeDropdown();
    }
});

// ===== BUSCADOR =====
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

    if (filtered.length === 0) {
        productsContainer.innerHTML = '';
        noProductsMsg.style.display = 'block';
    } else {
        noProductsMsg.style.display = 'none';
    }
}

// ===== CARGAR PRODUCTOS =====
async function loadProducts() {
    try {
        const response = await fetchWithAuth('/api/user/products');
        const products = await response.json();
        allProducts = products;
        renderProducts(products);

        if (products.length === 0) {
            noProductsMsg.style.display = 'block';
        } else {
            noProductsMsg.style.display = 'none';
        }
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
                <span>Stock:</span>
                <span class="stock-badge">${p.stock}</span>
            </div>
            <button class="buy-btn" onclick="buyProduct(${p.id}, ${p.price})">Comprar ahora</button>
        `;
        productsContainer.appendChild(card);
    });
}

// ===== COMPRA =====
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
            document.getElementById('credits').textContent = user.credits;
            document.getElementById('dropdownCredits').textContent = user.credits;

            document.getElementById('purchasedCode').textContent = data.code;
            document.getElementById('remainingCredits').innerHTML = `Créditos restantes: <strong>${user.credits}</strong>`;
            document.getElementById('codeModal').style.display = 'flex';

            loadProducts(); // Recargar para actualizar stock
        } else {
            alert(data.message || 'Error al comprar');
        }
    } catch (error) {
        console.error('Error en compra:', error);
    }
};

// ===== MODAL =====
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
        alert('✅ Código copiado al portapapeles');
    }).catch(() => {
        alert('No se pudo copiar, selecciona manualmente');
    });
};

// ===== FETCH CON AUTENTICACIÓN =====
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

// ===== CERRAR SESIÓN =====
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

logoutBtn.addEventListener('click', logout);
logoutMenuBtn.addEventListener('click', logout);
logoutDropdownBtn.addEventListener('click', logout);

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// ===== CERRAR MENÚS AL HACER CLIC EN UN ITEM DEL MENÚ (OPCIONAL) =====
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
        closeMenu();
        // Aquí puedes redirigir o mostrar secciones según el data-section
        console.log('Sección:', item.dataset.section);
    });
});

document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
        closeDropdown();
        console.log('Sección:', item.dataset.section);
    });
});