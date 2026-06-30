// ================================================================
//  USER · NX7G SHOP (unificado con carga dinámica)
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
const mainContent = document.getElementById('mainContent');
const navItems = document.querySelectorAll('.menu-item[data-section]');

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
    if (e.key === 'Escape') { closeMenu(); closeDropdown(); }
});

// ================================================================
//  DROPDOWN PERFIL
// ================================================================

function toggleDropdown(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('open');
    profileToggle.classList.toggle('active');
    if (profileDropdown.classList.contains('open')) closeMenu();
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
//  NAVEGACIÓN ENTRE SECCIONES (carga dinámica)
// ================================================================

const sectionMap = {
    'dashboard': 'pages/user/dashboard.html',   // ya está bien
    'solicitar': 'pages/user/solicitar.html',
    'catalogo': 'pages/user/catalogo.html',
    'historial': 'pages/user/historial.html',
    'perfil': 'pages/user/perfil.html',
    'config': 'pages/user/config.html'
};

// Función global para navegar (usada desde onclick)
window.navigateTo = function(section) {
    // Actualizar menú activo
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    loadSection(section);
};

function loadSection(section) {
    const url = sectionMap[section];
    if (!url) return;

    // Mostrar loading
    mainContent.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; padding:60px 0;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
        </div>
    `;

    fetch(url + '?t=' + Date.now()) // Evitar caché
        .then(res => res.text())
        .then(html => {
            mainContent.innerHTML = html;
            // Ejecutar scripts específicos de la sección
            executeSectionScripts(section);
        })
        .catch(err => {
            console.error('Error al cargar sección:', err);
            mainContent.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                    <p>Error al cargar la sección. Intenta de nuevo.</p>
                </div>
            `;
        });
}

// ================================================================
//  SCRIPTS POR SECCIÓN
// ================================================================

function executeSectionScripts(section) {
    // ===== SOLICITAR =====
    if (section === 'solicitar') {
        // Selector de plataformas
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('serviceSelect').value = this.dataset.platform;
            });
        });

        // Formulario de solicitud
        const requestForm = document.getElementById('requestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const msg = document.getElementById('requestMessage');
                msg.textContent = '✅ Solicitud enviada. Espera la confirmación.';
                msg.style.color = 'var(--success)';
                setTimeout(() => { msg.textContent = ''; }, 4000);
            });
        }

        // Cargar historial reciente
        loadRecentRequests();
    }

    // ===== CATÁLOGO =====
    if (section === 'catalogo') {
        // Inicializar categorías
        const categoryBtns = document.querySelectorAll('.category-btn');
        const productsContainer = document.getElementById('products');
        const noProductsMsg = document.getElementById('noProductsMessage');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        let allProducts = [];
        let visibleProducts = 0;
        const PRODUCTS_PER_PAGE = 5;
        let currentCategory = 'all';

        // Eventos de categorías
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentCategory = this.dataset.category;
                applyFilters();
            });
        });

        // Buscador
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const query = this.value.trim().toLowerCase();
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = query ? 'block' : 'none';
                }
                applyFilters();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                this.style.display = 'none';
                applyFilters();
                searchInput.focus();
            });
        }

        function applyFilters() {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
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

        // Cargar productos
        async function loadProducts() {
            try {
                const response = await fetch('/api/user/products', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const products = await response.json();
                allProducts = products.map(p => {
                    if (!p.category) {
                        const cats = ['giftcards', 'cursos', 'otros'];
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
            if (!productsContainer) return;
            productsContainer.innerHTML = '';
            if (products.length === 0) {
                if (noProductsMsg) noProductsMsg.style.display = 'block';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }
            if (noProductsMsg) noProductsMsg.style.display = 'none';

            const toShow = products.slice(0, visibleProducts + PRODUCTS_PER_PAGE);
            visibleProducts = toShow.length;

            toShow.forEach(p => {
                const card = document.createElement('div');
                card.className = 'product-card-v2';

                let icon = 'fa-gem';
                if (p.category === 'giftcards') icon = 'fa-gift';
                else if (p.category === 'cursos') icon = 'fa-graduation-cap';
                else icon = 'fa-ellipsis-h';

                const catLabel = p.category.charAt(0).toUpperCase() + p.category.slice(1);

                card.innerHTML = `
                    <div class="card-header">
                        <div class="icon-wrapper">
                            <i class="fas ${icon}"></i>
                        </div>
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

            if (loadMoreBtn) {
                if (visibleProducts < products.length) {
                    loadMoreBtn.style.display = 'inline-flex';
                    loadMoreBtn.textContent = `Ver más productos (${products.length - visibleProducts} restantes)`;
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }

        // Ver más
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
                let filtered = allProducts;
                if (currentCategory !== 'all') {
                    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory);
                }
                if (query) {
                    filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
                }
                renderProducts(filtered);
            });
        }

        // Iniciar carga
        loadProducts();
    }

    // ===== HISTORIAL =====
    if (section === 'historial') {
        loadFullHistory();
    }

    // ===== PERFIL =====
    if (section === 'perfil') {
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileCredits').textContent = user.credits;
    }
}

// ================================================================
//  FUNCIONES GLOBALES (compra, detalles, canje)
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
            document.getElementById('dropdownCredits').textContent = user.credits;

            sessionStorage.setItem('productoComprado', JSON.stringify({
                nombre: data.product_name || 'Producto',
                contenido: data.code
            }));
            window.location.href = 'producto-comprado.html';
        } else {
            alert(data.message || 'Error al comprar');
        }
    } catch (error) {
        console.error('Error en compra:', error);
        alert('Error de conexión');
    }
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

// El enlace del menú lateral (si existe)
const menuCanjear = document.getElementById('menuCanjear');
if (menuCanjear) {
    menuCanjear.addEventListener('click', function(e) {
        e.preventDefault();
        closeMenu();
        redeemModal.style.display = 'flex';
        redeemInput.value = '';
        redeemMessage.textContent = '';
        redeemInput.focus();
    });
}

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
//  FUNCIONES DE HISTORIAL
// ================================================================

async function loadRecentRequests() {
    // Simulación: cargar últimas 3 solicitudes
    const container = document.getElementById('recentRequests');
    if (!container) return;

    // Aquí iría la llamada a la API real
    // Por ahora, mostramos un mensaje
    container.innerHTML = `
        <div class="request-item">
            <span>📺 Netflix</span>
            <span>juan@correo.com</span>
            <span class="request-status pending">Pendiente</span>
        </div>
        <div class="request-item">
            <span>🎵 Spotify</span>
            <span>ana@correo.com</span>
            <span class="request-status completed">Completada</span>
        </div>
    `;
}

async function loadFullHistory() {
    const container = document.getElementById('allRequests');
    if (!container) return;

    container.innerHTML = `
        <div class="request-item">
            <span>📺 Netflix</span>
            <span>juan@correo.com</span>
            <span class="request-status pending">Pendiente</span>
            <small>15/06/2025</small>
        </div>
        <div class="request-item">
            <span>🎵 Spotify</span>
            <span>ana@correo.com</span>
            <span class="request-status completed">Completada</span>
            <small>14/06/2025</small>
        </div>
        <div class="request-item">
            <span>🎬 Disney+</span>
            <span>pedro@correo.com</span>
            <span class="request-status cancelled">Cancelada</span>
            <small>13/06/2025</small>
        </div>
    `;
}

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
//  INICIALIZAR (cargar dashboard por defecto)
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay una sección en la URL (ej. ?section=solicitar)
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') || 'dashboard';
    loadSection(section);
});