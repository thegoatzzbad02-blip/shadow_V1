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
const sectionTitle = document.getElementById('sectionTitle');

const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

// ============================================================
//  CARRUSEL
// ============================================================
const track = document.getElementById('carouselTrack');
const slides = track.querySelectorAll('.carousel-slide');
const prevBtn = document.getElementById('carouselPrev');
const nextBtn = document.getElementById('carouselNext');
const indicators = document.getElementById('carouselIndicators');

let currentSlide = 0;
const totalSlides = slides.length;
let autoPlayInterval = null;

// Crear indicadores
slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.dataset.index = i;
    dot.addEventListener('click', () => goToSlide(i));
    indicators.appendChild(dot);
});

function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentSlide = index;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

prevBtn.addEventListener('click', () => { stopAutoPlay(); prevSlide(); startAutoPlay(); });
nextBtn.addEventListener('click', () => { stopAutoPlay(); nextSlide(); startAutoPlay(); });

function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 5000);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

const carouselContainer = document.querySelector('.carousel-container');
carouselContainer.addEventListener('mouseenter', stopAutoPlay);
carouselContainer.addEventListener('mouseleave', startAutoPlay);
startAutoPlay();

// ============================================================
//  MOSTRAR DATOS DEL USUARIO
// ============================================================
document.getElementById('usernameDisplay').textContent = user.username;
document.getElementById('dropdownUsername').textContent = user.username;
document.getElementById('dropdownCredits').textContent = user.credits;

// ============================================================
//  MENÚ HAMBURGUESA (funcional en móvil y PC)
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
//  CATEGORÍAS (desde URL)
// ============================================================
let currentCategory = 'all';

function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
}

function updateTitle(category) {
    const titles = {
        'all': 'Productos disponibles',
        'streaming': 'Cuentas Streaming',
        'giftcards': 'Gift Cards',
        'cursos': 'Cursos',
        'otros': 'Otros productos'
    };
    const titleText = titles[category] || 'Productos disponibles';
    sectionTitle.innerHTML = `<i class="fas fa-gem" style="color: var(--accent-primary); margin-right: 12px;"></i> ${titleText}`;
}

function activateCategoryButton(category) {
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

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

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory);
    }

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
    if (products.length === 0) return;
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        let catLabel = '';
        if (p.category === 'streaming') catLabel = 'Streaming';
        else if (p.category === 'giftcards') catLabel = 'Gift Card';
        else if (p.category === 'cursos') catLabel = 'Curso';
        else catLabel = 'Otros';

        card.innerHTML = `
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} <small>créditos</small></div>
            <div class="product-stock">
                <span><i class="fas fa-boxes"></i> Stock:</span>
                <span class="stock-badge">${p.stock}</span>
                <span style="margin-left:auto; font-size:0.6rem; color:var(--text-secondary);">${catLabel}</span>
            </div>
            <button class="buy-btn" onclick="buyProduct(${p.id}, ${p.price})">
                <i class="fas fa-shopping-cart"></i> Comprar
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
    const category = getCategoryFromURL();
    currentCategory = category;
    activateCategoryButton(category);
    updateTitle(category);
    loadProducts();

    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === category || (category === 'all' && item.dataset.section === 'home')) {
            item.classList.add('active');
        }
    });
});

// ============================================================
//  CERRAR MENÚS AL HACER CLICK EN ITEMS
// ============================================================
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
    item.addEventListener('click', () => closeMenu());
});

document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
    item.addEventListener('click', () => closeDropdown());
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const cat = btn.dataset.category;
        const url = new URL(window.location);
        url.searchParams.set('category', cat);
        window.location.href = url.toString();
    });
});