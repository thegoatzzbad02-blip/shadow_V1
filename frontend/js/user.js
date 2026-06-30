// ================================================================
//  USER · NX7G SHOP (con "Cuentas a dominio")
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

function executeSectionScripts(section) {
    if (section === 'cuentas-dominio') {
        // Selector de plataformas
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('serviceSelect').value = this.dataset.platform;
            });
        });

        // Formulario
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
    }

    if (section === 'perfil') {
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileCredits').textContent = user.credits;
    }
}

// ================================================================
//  COMPRA, DETALLES, CANJE (sin cambios)
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