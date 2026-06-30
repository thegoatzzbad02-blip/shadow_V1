// ================================================================
//  ADMIN · CON MENÚ LATERAL Y SECCIONES
// ================================================================

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// ================================================================
//  ELEMENTOS DOM
// ================================================================

const sidebar = document.getElementById('adminSidebar');
const overlay = document.getElementById('sidebarOverlay');
const hamburgerToggle = document.getElementById('hamburgerToggle');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
const sections = document.querySelectorAll('.admin-section');
const pageTitle = document.getElementById('pageTitle');
const adminUsername = document.getElementById('adminUsername');

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
            'dashboard': 'Dashboard',
            'giftcards': 'Gift Cards',
            'cuentas-hit': 'Cuentas Hit',
            'cursos': 'Cursos',
            'cuentas-dominio': 'Cuentas a dominio',
            'vouchers': 'Códigos',
            'usuarios': 'Usuarios'
        };
        pageTitle.textContent = titles[section] || 'Dashboard';

        // Cargar datos según sección
        if (section === 'giftcards' || section === 'cuentas-hit' || section === 'cursos') {
            loadProductsByCategory(section);
        }
        if (section === 'cuentas-dominio') loadSolicitudes();
        if (section === 'vouchers') loadVouchers();
        if (section === 'usuarios') loadUsers();
        if (section === 'dashboard') loadDashboard();

        closeSidebar();
    });
});

// Mostrar nombre del admin
adminUsername.textContent = user.username || 'Admin';

// ================================================================
//  DASHBOARD
// ================================================================

async function loadDashboard() {
    try {
        // Productos
        const prodRes = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await prodRes.json();
        document.getElementById('totalProducts').textContent = products.length;

        // Usuarios
        const userRes = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await userRes.json();
        document.getElementById('totalUsers').textContent = users.length;
        const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
        document.getElementById('totalCredits').textContent = totalCredits;

        // Vouchers
        const voucherRes = await fetch('/api/admin/vouchers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vouchers = await voucherRes.json();
        document.getElementById('totalVouchers').textContent = vouchers.length;
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ================================================================
//  PRODUCTOS POR CATEGORÍA
// ================================================================

async function loadProductsByCategory(category) {
    const listContainer = document.getElementById(`list-${category}`);
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="loading" style="color:var(--text-secondary); padding:20px; text-align:center;">Cargando...</p>';

    try {
        const response = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        const filtered = products.filter(p => p.category === category);

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-inbox"></i>
                    <p>No hay productos en esta categoría</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';
        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-admin-card';
            card.innerHTML = `
                <div class="product-admin-info">
                    <h4>${p.name}</h4>
                    <p>${p.description || 'Sin descripción'}</p>
                    <div class="product-admin-meta">
                        <span><i class="fas fa-coins"></i> ${p.price} créditos</span>
                        <span><i class="fas fa-boxes"></i> Stock: ${p.stock}</span>
                        <span><i class="fas fa-code"></i> ${p.codes ? p.codes.length : 0} códigos</span>
                    </div>
                </div>
                <div class="product-admin-actions">
                    <button class="btn-edit" onclick="editProduct(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = '<p class="error" style="color:var(--danger); padding:20px; text-align:center;">Error al cargar productos</p>';
    }
}

// ===== GUARDAR PRODUCTO =====
document.querySelectorAll('.btn-save-product').forEach(btn => {
    btn.addEventListener('click', function() {
        const form = this.closest('.product-form');
        const category = form.dataset.category;

        const name = form.querySelector('.product-name-input').value.trim();
        const price = parseInt(form.querySelector('.product-price-input').value);
        const stock = parseInt(form.querySelector('.product-stock-input').value);
        const description = form.querySelector('.product-desc-input').value.trim();
        const codesText = form.querySelector('.product-codes-input').value;
        const codes = codesText ? codesText.split('\n').map(c => c.trim()).filter(c => c) : [];

        if (!name || !price || !stock) {
            alert('Nombre, precio y stock son obligatorios');
            return;
        }

        saveProduct({ name, price, stock, category, description, codes });
    });
});

async function saveProduct(data) {
    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('✅ Producto guardado correctamente');
            loadProductsByCategory(data.category);
            const form = document.querySelector(`.product-form[data-category="${data.category}"]`);
            if (form) {
                form.querySelectorAll('input, textarea').forEach(el => el.value = '');
            }
        } else {
            const error = await response.json();
            alert('❌ Error: ' + (error.message || 'Error al guardar'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

window.deleteProduct = async function(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;

    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('✅ Producto eliminado');
            // Recargar la categoría actual
            const activeSection = document.querySelector('.admin-section.active');
            if (activeSection) {
                const category = activeSection.id.replace('section-', '');
                if (['giftcards', 'cuentas-hit', 'cursos'].includes(category)) {
                    loadProductsByCategory(category);
                }
            }
        } else {
            alert('❌ Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
};

// ================================================================
//  CUENTAS A DOMINIO · CONFIGURACIÓN Y SOLICITUDES
// ================================================================

// ===== CONFIGURACIÓN DE PLATAFORMAS =====
let platforms = [
    { id: 1, name: 'Netflix', price: 15, icon: 'fab fa-netflix', color: '#e50914' },
    { id: 2, name: 'Disney+', price: 18, icon: 'fab fa-disney', color: '#0063e5' },
    { id: 3, name: 'HBO Max', price: 20, icon: 'fas fa-video', color: '#5822b4' },
    { id: 4, name: 'Spotify', price: 10, icon: 'fab fa-spotify', color: '#1db954' },
    { id: 5, name: 'Amazon Prime', price: 22, icon: 'fab fa-amazon', color: '#ff9900' },
    { id: 6, name: 'Paramount+', price: 16, icon: 'fas fa-play-circle', color: '#0063e5' },
];

let solicitudes = [];
let currentFilter = 'all';

// ===== RENDERIZAR CONFIGURACIÓN =====
function renderPlatforms() {
    const container = document.getElementById('platformsConfig');
    container.innerHTML = '';
    
    platforms.forEach(p => {
        const div = document.createElement('div');
        div.className = 'config-item';
        div.innerHTML = `
            <div class="platform-info">
                <i class="${p.icon}" style="color: ${p.color};"></i>
                <span class="platform-name">${p.name}</span>
                <span class="platform-price">${p.price} cr</span>
            </div>
            <div class="platform-actions">
                <button class="btn-edit-platform" onclick="editPlatform(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-platform" onclick="deletePlatform(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ===== AGREGAR PLATAFORMA =====
document.getElementById('addPlatformBtn').addEventListener('click', function() {
    document.getElementById('addPlatformModal').style.display = 'flex';
    document.getElementById('addPlatformModal').classList.add('active');
    document.getElementById('newPlatformName').value = '';
    document.getElementById('newPlatformPrice').value = '';
    document.getElementById('newPlatformIcon').value = '';
    document.getElementById('newPlatformColor').value = '';
});

function closeAddPlatformModal() {
    document.getElementById('addPlatformModal').style.display = 'none';
    document.getElementById('addPlatformModal').classList.remove('active');
}

document.getElementById('savePlatformBtn').addEventListener('click', function() {
    const name = document.getElementById('newPlatformName').value.trim();
    const price = parseInt(document.getElementById('newPlatformPrice').value);
    const icon = document.getElementById('newPlatformIcon').value.trim() || 'fas fa-circle';
    const color = document.getElementById('newPlatformColor').value.trim() || '#3b82f6';
    
    if (!name || !price) {
        alert('Nombre y precio son obligatorios');
        return;
    }
    
    const newPlatform = {
        id: platforms.length + 1,
        name: name,
        price: price,
        icon: icon,
        color: color
    };
    
    platforms.push(newPlatform);
    renderPlatforms();
    closeAddPlatformModal();
    alert('✅ Plataforma agregada correctamente');
});

// ===== EDITAR PLATAFORMA =====
window.editPlatform = function(id) {
    const platform = platforms.find(p => p.id === id);
    if (!platform) return;
    
    const newName = prompt('Nombre de la plataforma:', platform.name);
    if (newName !== null) {
        const newPrice = prompt('Precio (créditos):', platform.price);
        if (newPrice !== null) {
            platform.name = newName.trim() || platform.name;
            platform.price = parseInt(newPrice) || platform.price;
            renderPlatforms();
        }
    }
};

// ===== ELIMINAR PLATAFORMA =====
window.deletePlatform = function(id) {
    if (!confirm('¿Eliminar esta plataforma?')) return;
    platforms = platforms.filter(p => p.id !== id);
    renderPlatforms();
};

// ===== SOLICITUDES =====
async function loadSolicitudes() {
    const container = document.getElementById('solicitudesList');
    
    try {
        // Datos de prueba (simulados)
        solicitudes = [
            { 
                id: 1, 
                usuario: 'juan123', 
                plataforma: 'Netflix', 
                email: 'juan@correo.com', 
                password: 'MiClave123',
                estado: 'pending', 
                fecha: '2025-06-28',
                mensaje: 'Quiero una cuenta para ver series'
            },
            { 
                id: 2, 
                usuario: 'ana456', 
                plataforma: 'Spotify', 
                email: 'ana@correo.com', 
                password: '********',
                estado: 'completed', 
                fecha: '2025-06-27',
                mensaje: 'Para escuchar música'
            },
            { 
                id: 3, 
                usuario: 'pedro789', 
                plataforma: 'Disney+', 
                email: 'pedro@correo.com', 
                password: 'pedro2024',
                estado: 'pending', 
                fecha: '2025-06-26',
                mensaje: 'Para los niños'
            },
            { 
                id: 4, 
                usuario: 'lucia321', 
                plataforma: 'HBO Max', 
                email: 'lucia@correo.com', 
                password: 'luciaMax',
                estado: 'cancelled', 
                fecha: '2025-06-25',
                mensaje: 'Cancelé porque encontré otra'
            },
        ];
        
        updateStats();
        applyFilter(currentFilter);
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error" style="color:var(--danger); padding:20px; text-align:center;">Error al cargar solicitudes</p>';
    }
}

function updateStats() {
    document.getElementById('totalSolicitudes').textContent = solicitudes.length;
    document.getElementById('pendingSolicitudes').textContent = solicitudes.filter(s => s.estado === 'pending').length;
    document.getElementById('completedSolicitudes').textContent = solicitudes.filter(s => s.estado === 'completed').length;
}

function applyFilter(filter) {
    currentFilter = filter;
    const container = document.getElementById('solicitudesList');
    
    let filtered = solicitudes;
    if (filter !== 'all') {
        filtered = solicitudes.filter(s => s.estado === filter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-inbox"></i>
                <p>No hay solicitudes ${filter !== 'all' ? filter : ''}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(s => {
        const card = document.createElement('div');
        card.className = `solicitud-card ${s.estado}`;
        card.innerHTML = `
            <div class="solicitud-info">
                <div class="solicitud-user">
                    <i class="fas fa-user-circle"></i>
                    <span>@${s.usuario}</span>
                </div>
                <div class="solicitud-details">
                    <span class="solicitud-platform"><i class="fas fa-tag"></i> ${s.plataforma}</span>
                    <span class="solicitud-email"><i class="fas fa-envelope"></i> ${s.email}</span>
                    <span class="solicitud-date"><i class="fas fa-calendar-alt"></i> ${s.fecha}</span>
                </div>
            </div>
            <div class="solicitud-status">
                <span class="status-badge ${s.estado}">
                    ${s.estado === 'pending' ? '⏳ Pendiente' : 
                      s.estado === 'completed' ? '✅ Completada' : 
                      '❌ Cancelada'}
                </span>
            </div>
            <div class="solicitud-actions">
                ${s.estado === 'pending' ? `
                    <button class="btn-complete" onclick="completeSolicitud(${s.id})">
                        <i class="fas fa-check"></i> Completar
                    </button>
                    <button class="btn-cancel" onclick="cancelSolicitud(${s.id})">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                ` : ''}
                <button class="btn-view-more" onclick="viewSolicitudDetail(${s.id})">
                    <i class="fas fa-eye"></i> Ver más
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ===== FILTROS =====
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        applyFilter(this.dataset.filter);
    });
});

// ===== ACCIONES DE SOLICITUDES =====
window.completeSolicitud = function(id) {
    if (!confirm('¿Marcar esta solicitud como completada?')) return;
    const solicitud = solicitudes.find(s => s.id === id);
    if (solicitud) {
        solicitud.estado = 'completed';
        updateStats();
        applyFilter(currentFilter);
        alert('✅ Solicitud completada. El cliente ha sido notificado.');
    }
};

window.cancelSolicitud = function(id) {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    const solicitud = solicitudes.find(s => s.id === id);
    if (solicitud) {
        solicitud.estado = 'cancelled';
        updateStats();
        applyFilter(currentFilter);
        alert('❌ Solicitud cancelada.');
    }
};

// ===== VER DETALLES COMPLETOS =====
window.viewSolicitudDetail = function(id) {
    const solicitud = solicitudes.find(s => s.id === id);
    if (!solicitud) return;
    
    const modal = document.getElementById('solicitudModal');
    const body = document.getElementById('solicitudModalBody');
    
    const estadoLabels = {
        'pending': '⏳ Pendiente',
        'completed': '✅ Completada',
        'cancelled': '❌ Cancelada'
    };
    
    body.innerHTML = `
        <div class="solicitud-detalle">
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-user"></i> Usuario</span>
                <span class="detalle-value">@${solicitud.usuario}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-tag"></i> Plataforma</span>
                <span class="detalle-value">${solicitud.plataforma}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-envelope"></i> Correo</span>
                <span class="detalle-value">${solicitud.email}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-lock"></i> Contraseña</span>
                <span class="detalle-value password">${solicitud.password || 'No especificada'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-calendar-alt"></i> Fecha</span>
                <span class="detalle-value">${solicitud.fecha}</span>
            </div>
            ${solicitud.mensaje ? `
                <div class="detalle-row">
                    <span class="detalle-label"><i class="fas fa-comment"></i> Mensaje</span>
                    <span class="detalle-value">${solicitud.mensaje}</span>
                </div>
            ` : ''}
            <div class="detalle-row">
                <span class="detalle-label"><i class="fas fa-info-circle"></i> Estado</span>
                <span class="detalle-value">
                    <span class="detalle-status ${solicitud.estado}">
                        ${estadoLabels[solicitud.estado] || solicitud.estado}
                    </span>
                </span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
};

function closeSolicitudModal() {
    const modal = document.getElementById('solicitudModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// ===== CERRAR MODALES CON ESC =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSolicitudModal();
        closeAddPlatformModal();
    }
});

// ===== CERRAR MODALES HACIENDO CLICK FUERA =====
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            this.classList.remove('active');
        }
    });
});


// ================================================================
//  VOUCHERS
// ================================================================

document.getElementById('generateVoucherBtn').addEventListener('click', async function() {
    const amount = parseInt(document.getElementById('voucherAmount').value);
    const expires_days = parseInt(document.getElementById('voucherExpiry').value) || null;
    
    if (!amount || amount <= 0) {
        alert('Ingresa un monto válido');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/vouchers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, expires_days })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert(`✅ Código generado: ${data.code}`);
            document.getElementById('voucherAmount').value = '';
            document.getElementById('voucherExpiry').value = '';
            loadVouchers();
        } else {
            alert('❌ ' + (data.message || 'Error al generar'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
});

async function loadVouchers() {
    const container = document.getElementById('voucherList');
    try {
        const response = await fetch('/api/admin/vouchers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vouchers = await response.json();
        
        if (vouchers.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); padding:20px; text-align:center;">No hay códigos generados</p>';
            return;
        }
        
        container.innerHTML = '';
        vouchers.forEach(v => {
            const div = document.createElement('div');
            div.className = 'voucher-item';
            div.innerHTML = `
                <div class="voucher-info">
                    <code>${v.code}</code>
                    <span>${v.amount} créditos</span>
                    <span class="voucher-status ${v.used ? 'used' : 'available'}">
                        ${v.used ? 'Usado' : 'Disponible'}
                    </span>
                    ${v.expires_at ? `<span>Expira: ${new Date(v.expires_at).toLocaleDateString()}</span>` : ''}
                </div>
                <button onclick="deleteVoucher(${v.id})" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

window.deleteVoucher = async function(id) {
    if (!confirm('¿Eliminar este código?')) return;
    
    try {
        const response = await fetch(`/api/admin/vouchers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadVouchers();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// ================================================================
//  USUARIOS
// ================================================================

document.getElementById('createUserBtn').addEventListener('click', async function() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const credits = parseInt(document.getElementById('newCredits').value) || 0;
    
    if (!username || !password) {
        alert('Usuario y contraseña son obligatorios');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, password, credits })
        });
        
        if (response.ok) {
            alert('✅ Usuario creado');
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newCredits').value = '0';
            loadUsers();
        } else {
            const error = await response.json();
            alert('❌ ' + (error.message || 'Error al crear usuario'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
});

async function loadUsers() {
    const container = document.getElementById('userList');
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();
        
        if (users.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); padding:20px; text-align:center;">No hay usuarios registrados</p>';
            return;
        }
        
        container.innerHTML = '';
        users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-admin-card';
            div.innerHTML = `
                <div class="user-info">
                    <span class="user-name">${u.username}</span>
                    <span class="user-role ${u.role}">${u.role}</span>
                    <span class="user-credits"><i class="fas fa-coins"></i> ${u.credits}</span>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${u.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteUser(${u.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

window.deleteUser = async function(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadUsers();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

window.editUser = function(id) {
    const newCredits = prompt('Nuevos créditos para el usuario:');
    if (newCredits !== null && !isNaN(newCredits)) {
        alert(`Funcionalidad en desarrollo. Créditos: ${newCredits}`);
    }
};

// ================================================================
//  CERRAR SESIÓN
// ================================================================

document.getElementById('logoutAdminBtn').addEventListener('click', function() {
    localStorage.clear();
    window.location.href = 'login.html';
});

// ================================================================
//  INICIALIZAR
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar dashboard por defecto
    loadDashboard();
    
    // Si la URL tiene hash, mostrar sección correspondiente
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const target = document.querySelector(`.nav-item[data-section="${hash}"]`);
        if (target) target.click();
    }
});