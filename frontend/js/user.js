// ================================================================
//  USER · CONEXIÓN REAL CON EL BACKEND
// ================================================================

const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));

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

const logoutMenuBtn = document.getElementById('logoutMenuBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

// ================================================================
//  MOSTRAR DATOS DEL USUARIO
// ================================================================

function updateUserHeader() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const dropdownUsername = document.getElementById('dropdownUsername');
    const dropdownCredits = document.getElementById('dropdownCredits');

    if (usernameDisplay) usernameDisplay.textContent = user.username;
    if (dropdownUsername) dropdownUsername.textContent = user.username;
    if (dropdownCredits) dropdownCredits.textContent = user.credits;
}

updateUserHeader();

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
    if (profileDropdown.classList.contains('open')) {
        closeMenu();
    }
}

function closeDropdown() {
    profileDropdown.classList.remove('open');
    profileToggle.classList.remove('active');
}

profileToggle.addEventListener('click', toggleDropdown);

// Cerrar al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
        closeDropdown();
    }
});

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDropdown();
        closeMenu();
    }
});
// ================================================================
//  NAVEGACIÓN ENTRE SECCIONES
// ================================================================

const sectionMap = {
    'dashboard': 'dashboard.html',
    'cuentas-dominio': 'cuentas-dominio.html',
    'giftcards': 'giftcards.html',
    'cuentas-hit': 'cuentas-hit.html',
    'cursos': 'cursos.html',
    'canjear': 'canjear.html',
    'generador': 'generador.html',
    'soporte': 'soporte.html',
    'terminos': 'terminos.html',
    'config': 'config.html',
    'perfil': 'perfil.html',
    'historial': 'historial.html'
};
// Función global para navegar
window.navigateTo = function(section) {
    console.log('Navegando a:', section);

    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    const url = sectionMap[section];
    if (!url) {
        console.error('Sección no encontrada:', section);
        return;
    }

    if (mainContent) {
        mainContent.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; padding:60px 0;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
                <span style="margin-left:12px;">Cargando...</span>
            </div>
        `;
    }

    fetch(url + '?t=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar: ' + res.status);
            return res.text();
        })
        .then(html => {
            if (mainContent) {
                mainContent.innerHTML = html;
                executeSectionScripts(section);
            }
        })
        .catch(err => {
            console.error('Error al cargar sección:', err);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="text-align:center; padding:40px; color:var(--danger);">
                        <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                        <p>Error al cargar la sección.</p>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">${err.message}</p>
                        <button onclick="navigateTo('dashboard')" style="margin-top:12px; padding:8px 20px; border-radius:40px; background:var(--accent-primary); color:white; border:none; cursor:pointer;">Volver al inicio</button>
                    </div>
                `;
            }
        });
};

// ================================================================
//  EVENTOS DE CLICK EN EL MENÚ
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, asignando eventos...');

    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            console.log('Click en menú:', section);
            if (section) {
                window.navigateTo(section);
            }
            closeMenu();
        });
    });

    document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            console.log('Click en perfil:', section);
            if (section) {
                window.navigateTo(section);
            }
            closeDropdown();
        });
    });

    window.navigateTo('dashboard');
});

// ================================================================
//  SCRIPTS POR SECCIÓN
// ================================================================

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            user = data;
            localStorage.setItem('user', JSON.stringify(user));
            updateUserHeader();
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function loadProductsBySection(section) {
    const container = document.getElementById('products');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Cargando productos...</p>';

    try {
        const response = await fetch(`/api/user/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        const filtered = products.filter(product => product.category === section);

        if (!filtered.length) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;">No hay productos disponibles por ahora.</p>';
            return;
        }

        container.innerHTML = '';
        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-body">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'Producto disponible'}</p>
                    <div class="product-meta">
                        <span><i class="fas fa-coins"></i> ${product.price} créditos</span>
                        <span><i class="fas fa-boxes"></i> Stock: ${product.stock}</span>
                    </div>
                </div>
                <button class="btn-buy" onclick="comprarProducto(${product.id}, ${product.price})">
                    <i class="fas fa-shopping-cart"></i> Comprar
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = '<p style="text-align:center; color:var(--danger); padding:20px;">No se pudieron cargar los productos.</p>';
    }
}

async function loadPlatforms() {
    try {
        const response = await fetch('/api/user/plataformas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const plataformas = await response.json();
        const container = document.getElementById('platformOptions');
        const hiddenInput = document.getElementById('serviceSelect');
        const priceLabel = document.getElementById('requestPrice');
        const balanceLabel = document.getElementById('requestBalance');

        if (!container) return;

        container.innerHTML = '';
        plataformas.forEach((platform, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `platform-card ${index === 0 ? 'active' : ''}`;
            button.dataset.platform = platform.nombre;
            button.dataset.price = platform.precio;
            button.innerHTML = `
                <i class="${platform.icono}" style="color:${platform.color};"></i>
                <span>${platform.nombre}</span>
                <small>${platform.precio} créditos</small>
            `;
            button.addEventListener('click', () => {
                document.querySelectorAll('.platform-card').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                hiddenInput.value = platform.nombre;
                priceLabel.textContent = `${platform.precio} créditos`;
                balanceLabel.textContent = `${user.credits || 0} créditos`;
            });
            container.appendChild(button);
        });

        if (plataformas.length) {
            hiddenInput.value = plataformas[0].nombre;
            priceLabel.textContent = `${plataformas[0].precio} créditos`;
        }
    } catch (error) {
        console.error('Error cargando plataformas:', error);
    }
}

async function loadRecentRequests() {
    try {
        const response = await fetch('/api/user/mis-solicitudes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const solicitudes = await response.json();
        const container = document.getElementById('recentRequests');
        if (!container) return;

        if (!solicitudes.length) {
            container.innerHTML = '<div class="request-empty"><i class="fas fa-inbox"></i><p>No hay solicitudes recientes</p></div>';
            return;
        }

        container.innerHTML = '';
        solicitudes.slice(0, 4).forEach(solicitud => {
            const item = document.createElement('div');
            item.className = 'request-item';
            item.innerHTML = `
                <div><strong>${solicitud.plataforma}</strong></div>
                <div>${solicitud.email}</div>
                <div class="status-badge ${solicitud.estado}">${solicitud.estado === 'pending' ? 'Pendiente' : solicitud.estado === 'completed' ? 'Completada' : 'Cancelada'}</div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
    }
}

async function loadUserHistory() {
    try {
        const response = await fetch('/api/user/historial', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const historyContainer = document.getElementById('allRequests');
        if (!historyContainer) return;

        if (!data.compras.length && !data.solicitudes.length) {
            historyContainer.innerHTML = '<p style="color:var(--text-secondary);">No hay actividad aún.</p>';
            return;
        }

        historyContainer.innerHTML = '';
        const combined = [
            ...data.compras.map(item => ({ type: 'compra', ...item })),
            ...data.solicitudes.map(item => ({ type: 'solicitud', ...item }))
        ].sort((a, b) => new Date(b.purchased_at || b.creado_en || 0) - new Date(a.purchased_at || a.creado_en || 0));

        combined.forEach(item => {
            const block = document.createElement('div');
            block.className = 'request-item';
            if (item.type === 'compra') {
                block.innerHTML = `
                    <div><strong>${item.product_name}</strong></div>
                    <div>Compra realizada · ${item.code}</div>
                    <div class="status-badge completed">Comprado</div>
                `;
            } else {
                block.innerHTML = `
                    <div><strong>${item.plataforma}</strong></div>
                    <div>${item.email}</div>
                    <div class="status-badge ${item.estado}">${item.estado === 'pending' ? 'Pendiente' : item.estado === 'completed' ? 'Completada' : 'Cancelada'}</div>
                `;
            }
            historyContainer.appendChild(block);
        });
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

function executeSectionScripts(section) {
    if (section === 'giftcards') loadProductsBySection('giftcards');
    if (section === 'cuentas-hit') loadProductsBySection('cuentas-hit');
    if (section === 'cursos') loadProductsBySection('cursos');

    if (section === 'cuentas-dominio') {
        loadPlatforms();
        loadRecentRequests();

        const requestBtn = document.getElementById('solicitarBtn');
        const requestEmail = document.getElementById('requestEmail');
        const requestPassword = document.getElementById('requestPassword');
        const serviceSelect = document.getElementById('serviceSelect');
        const msg = document.getElementById('requestMessage');

        if (requestBtn) {
            requestBtn.addEventListener('click', async function() {
                const email = requestEmail.value.trim();
                const password = requestPassword.value.trim();
                const plataforma = serviceSelect.value;

                if (!email) {
                    msg.textContent = '❌ El correo electrónico es obligatorio.';
                    msg.style.color = 'var(--danger)';
                    return;
                }

                try {
                    const response = await fetch('/api/user/solicitar-cuenta', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ plataforma, email, password, mensaje: 'Solicitud creada desde el panel de usuario' })
                    });
                    const data = await response.json();

                    if (response.ok) {
                        msg.textContent = '✅ Solicitud enviada. Espera la confirmación.';
                        msg.style.color = 'var(--success)';
                        requestEmail.value = '';
                        requestPassword.value = '';
                        loadRecentRequests();
                    } else {
                        msg.textContent = '❌ ' + (data.message || 'No se pudo crear la solicitud');
                        msg.style.color = 'var(--danger)';
                    }
                } catch (error) {
                    console.error('Error creando solicitud:', error);
                    msg.textContent = '❌ Error de conexión.';
                    msg.style.color = 'var(--danger)';
                }
            });
        }
    }

    if (section === 'perfil') {
        loadUserProfile();
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileCredits').textContent = user.credits;
    }

    if (section === 'historial') {
        loadUserHistory();
    }
}

// ================================================================
//  COMPRA, DETALLES, CANJE
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
            updateUserHeader();

            sessionStorage.setItem('productoComprado', JSON.stringify({
                nombre: 'Producto comprado',
                contenido: data.code
            }));
            window.location.href = 'confirmacion.html';
        } else {
            alert(data.message || 'Error al comprar');
        }
    } catch (error) {
        console.error('Error en compra:', error);
        alert('Error de conexión');
    }
};

// ================================================================
//  MODALES Y CIERRE DE SESIÓN
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

const redeemModal = document.getElementById('redeemModal');
const redeemInput = document.getElementById('redeemCodeInput');
const redeemBtn = document.getElementById('redeemBtn');
const redeemMessage = document.getElementById('redeemMessage');

function cerrarRedeemModal() {
    redeemModal.style.display = 'none';
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
            updateUserHeader();
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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

logoutMenuBtn.addEventListener('click', logout);
logoutDropdownBtn.addEventListener('click', logout);
// ================================================================
//  MODAL PUBLICITARIO (12 segundos, centrado en móviles)
// ================================================================

function showPromoModal() {
    const modal = document.getElementById('promoModal');
    const closeBtn = document.getElementById('promoCloseBtn');
    const timerElement = document.getElementById('promoTimer');
    let timeLeft = 12;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const timerInterval = setInterval(() => {
        timeLeft -= 1;
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            closePromoModal();
        }
    }, 1000);

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            clearInterval(timerInterval);
            closePromoModal();
        });
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            clearInterval(timerInterval);
            closePromoModal();
        }
    });

    function closePromoModal() {
        modal.classList.remove('active');
        clearInterval(timerInterval);
        document.body.style.overflow = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        showPromoModal();
    }, 500);
});