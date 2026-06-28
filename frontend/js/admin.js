// ================================================================
//  ADMIN · NIX SPHERE
// ================================================================

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// ================================================================
//  ELEMENTOS DOM
// ================================================================

// Menú lateral
const sidebar = document.getElementById('adminSidebar');
const overlay = document.getElementById('sidebarOverlay');
const hamburgerToggle = document.getElementById('hamburgerToggle');
const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
const sections = document.querySelectorAll('.admin-section');
const pageTitle = document.getElementById('pageTitle');
const adminUsername = document.getElementById('adminUsername');

// Productos
const productForm = document.getElementById('productForm');
const editProductId = document.getElementById('editProductId');
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const productStock = document.getElementById('productStock');
const productCategory = document.getElementById('productCategory');
const productCodes = document.getElementById('productCodes');
const saveProductBtn = document.getElementById('saveProductBtn');
const cancelProductBtn = document.getElementById('cancelProductBtn');
const productMessage = document.getElementById('productMessage');
const productsTableBody = document.getElementById('productsTableBody');
const productsList = document.getElementById('productsList');
const formTitle = document.getElementById('formTitle');
const codesValidation = document.getElementById('codesValidation');
const codesNeeded = document.getElementById('codesNeeded');

// Usuarios
const usersTableBody = document.getElementById('usersTableBody');
const usersList = document.getElementById('usersList');

// Dashboard
const totalProductsEl = document.getElementById('totalProducts');
const totalUsersEl = document.getElementById('totalUsers');
const totalCreditsEl = document.getElementById('totalCredits');

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');

// ================================================================
//  MENÚ LATERAL (hamburguesa)
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
        // Activar item en el menú
        navItems.forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        // Mostrar sección correspondiente
        const section = this.dataset.section;
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) targetSection.classList.add('active');

        // Actualizar título
        const titles = {
            'dashboard': 'Dashboard',
            'productos': 'Productos',
            'usuarios': 'Usuarios',
            'vouchers': 'Códigos promocionales',
            'config': 'Configuración'
        };
        pageTitle.textContent = titles[section] || 'Dashboard';

        // Cargar datos según sección
        if (section === 'productos') loadProducts();
        if (section === 'usuarios') loadUsers();
        if (section === 'vouchers') loadVouchers();
        if (section === 'dashboard') loadDashboard();

        // Cerrar sidebar en móvil
        closeSidebar();
    });
});

// Mostrar nombre del admin
adminUsername.textContent = user.username || 'Admin';

// ================================================================
//  VALIDACIÓN DE CÓDIGOS
// ================================================================

function validateCodes() {
    const stock = parseInt(productStock.value) || 0;
    const codesText = productCodes.value;
    const codes = codesText ? codesText.split('\n').map(c => c.trim()).filter(c => c) : [];
    const count = codes.length;

    if (count < stock) {
        codesValidation.style.display = 'block';
        codesNeeded.textContent = stock - count;
        return false;
    } else {
        codesValidation.style.display = 'none';
        return true;
    }
}

productStock.addEventListener('input', validateCodes);
productCodes.addEventListener('input', validateCodes);

// ================================================================
//  DASHBOARD
// ================================================================

async function loadDashboard() {
    try {
        const prodRes = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await prodRes.json();
        totalProductsEl.textContent = products.length;

        const userRes = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await userRes.json();
        totalUsersEl.textContent = users.length;
        const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
        totalCreditsEl.textContent = totalCredits;
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ================================================================
//  PRODUCTOS
// ================================================================

async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        renderProducts(products);
        renderProductsCards(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-secondary);">No hay productos</td></tr>`;
        return;
    }
    productsTableBody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        const codesCount = p.codes ? p.codes.length : 0;
        row.innerHTML = `
            <td>${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td><span style="background:var(--accent-bg); color:var(--accent-primary); padding:2px 10px; border-radius:40px; font-size:0.75rem;">${p.category || 'otros'}</span></td>
            <td>${p.price} <small style="color:var(--text-secondary);">cr</small></td>
            <td>${p.stock}</td>
            <td><span class="codes-badge"><i class="fas fa-code"></i> ${codesCount}</span></td>
            <td class="actions">
                <button class="edit" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

function renderProductsCards(products) {
    if (!productsList) return;
    if (products.length === 0) {
        productsList.innerHTML = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">No hay productos</div>`;
        return;
    }
    productsList.innerHTML = '';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'list-item';
        const codesCount = p.codes ? p.codes.length : 0;
        card.innerHTML = `
            <div class="item-row">
                <span class="item-label">Nombre</span>
                <span class="item-value"><strong>${p.name}</strong></span>
            </div>
            <div class="item-row">
                <span class="item-label">Categoría</span>
                <span class="category-badge">${p.category || 'otros'}</span>
            </div>
            <div class="item-row">
                <span class="item-label">Precio</span>
                <span class="item-value">${p.price} <small style="color:var(--text-secondary);">cr</small></span>
            </div>
            <div class="item-row">
                <span class="item-label">Stock</span>
                <span class="item-value">${p.stock}</span>
            </div>
            <div class="item-row">
                <span class="item-label">Códigos</span>
                <span class="codes-badge"><i class="fas fa-code"></i> ${codesCount}</span>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-btn" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `;
        productsList.appendChild(card);
    });
}

// Guardar producto
saveProductBtn.addEventListener('click', async function() {
    if (!validateCodes()) {
        showProductMessage('La cantidad de códigos debe ser al menos igual al stock.', 'error');
        return;
    }

    const id = editProductId.value;
    const name = productName.value.trim();
    const description = productDescription.value.trim();
    const price = parseInt(productPrice.value);
    const stock = parseInt(productStock.value);
    const category = productCategory.value;
    const codesText = productCodes.value;
    const codes = codesText ? codesText.split('\n').map(c => c.trim()).filter(c => c) : [];

    if (!name || !price || !stock) {
        showProductMessage('Nombre, precio y stock son obligatorios.', 'error');
        return;
    }

    const data = { name, description, price, stock, category, codes };
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showProductMessage(id ? 'Producto actualizado' : 'Producto creado', 'success');
            resetForm();
            loadProducts();
            loadDashboard();
        } else {
            const error = await response.json();
            showProductMessage(error.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        showProductMessage('Error de conexión', 'error');
    }
});

// Editar producto
window.editProduct = async function(id) {
    try {
        const response = await fetch(`/api/admin/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        const product = products.find(p => p.id === id);
        if (!product) return;

        editProductId.value = product.id;
        productName.value = product.name;
        productDescription.value = product.description || '';
        productPrice.value = product.price;
        productStock.value = product.stock;
        productCategory.value = product.category || 'otros';
        productCodes.value = product.codes ? product.codes.join('\n') : '';
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
        saveProductBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar';
        productForm.scrollIntoView({ behavior: 'smooth' });
        validateCodes();
    } catch (error) {
        console.error('Error al editar:', error);
    }
};

// Eliminar producto
window.deleteProduct = async function(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadProducts();
            loadDashboard();
            showProductMessage('Producto eliminado correctamente.', 'success');
        } else {
            const error = await response.json();
            alert(error.message || 'Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};

// Cancelar
cancelProductBtn.addEventListener('click', resetForm);

function resetForm() {
    editProductId.value = '';
    productName.value = '';
    productDescription.value = '';
    productPrice.value = '';
    productStock.value = '';
    productCategory.value = 'streaming';
    productCodes.value = '';
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Producto';
    saveProductBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
    hideProductMessage();
    codesValidation.style.display = 'none';
}

function showProductMessage(text, type) {
    productMessage.textContent = text;
    productMessage.className = `detail-message ${type}`;
    productMessage.style.display = 'block';
    setTimeout(() => hideProductMessage(), 5000);
}
function hideProductMessage() {
    productMessage.style.display = 'none';
}

// ================================================================
//  USUARIOS (con edición de créditos funcional)
// ================================================================

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();
        renderUsers(users);
        renderUsersCards(users);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

function renderUsers(users) {
    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No hay usuarios</td></tr>`;
        return;
    }
    usersTableBody.innerHTML = '';
    users.forEach(u => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td><span style="background:${u.role === 'admin' ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,238,0.15)'}; color:${u.role === 'admin' ? 'var(--danger)' : 'var(--success)'}; padding:2px 10px; border-radius:40px; font-size:0.75rem;">${u.role}</span></td>
            <td>${u.credits} <small style="color:var(--text-secondary);">cr</small></td>
            <td class="actions">
                <button class="edit" onclick="editUser(${u.id}, '${u.username}', ${u.credits})"><i class="fas fa-edit"></i></button>
                <button class="delete" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

function renderUsersCards(users) {
    if (!usersList) return;
    if (users.length === 0) {
        usersList.innerHTML = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">No hay usuarios</div>`;
        return;
    }
    usersList.innerHTML = '';
    users.forEach(u => {
        const card = document.createElement('div');
        card.className = 'list-item';
        card.innerHTML = `
            <div class="item-row">
                <span class="item-label">ID</span>
                <span class="item-value">${u.id}</span>
            </div>
            <div class="item-row">
                <span class="item-label">Usuario</span>
                <span class="item-value"><strong>${u.username}</strong></span>
            </div>
            <div class="item-row">
                <span class="item-label">Rol</span>
                <span style="background:${u.role === 'admin' ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,238,0.15)'}; color:${u.role === 'admin' ? 'var(--danger)' : 'var(--success)'}; padding:2px 10px; border-radius:40px; font-size:0.75rem;">${u.role}</span>
            </div>
            <div class="item-row">
                <span class="item-label">Créditos</span>
                <span class="item-value">${u.credits} <small style="color:var(--text-secondary);">cr</small></span>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editUser(${u.id}, '${u.username}', ${u.credits})"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-btn" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `;
        usersList.appendChild(card);
    });
}

// Editar usuario (funcional)
window.editUser = async function(id, username, currentCredits) {
    const newCredits = prompt(`Créditos actuales de "${username}": ${currentCredits}\nIngresa el nuevo total de créditos:`, currentCredits);
    if (newCredits === null) return;
    const credits = parseInt(newCredits);
    if (isNaN(credits)) {
        alert('❌ Debes ingresar un número válido.');
        return;
    }
    await updateUserCredits(id, username, credits);
};

async function updateUserCredits(userId, username, credits) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, credits })
        });
        const data = await response.json();
        if (response.ok) {
            alert('✅ Créditos actualizados correctamente.');
            loadUsers();
            loadDashboard();
        } else {
            alert('❌ Error: ' + (data.message || 'No se pudieron actualizar los créditos.'));
        }
    } catch (error) {
        console.error('Error al actualizar créditos:', error);
        alert('❌ Error de conexión.');
    }
};

// Eliminar usuario (placeholder)
window.deleteUser = function(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    alert('🚧 Funcionalidad en desarrollo');
};

// ================================================================
//  VOUCHERS (códigos promocionales)
// ================================================================

const voucherAmount = document.getElementById('voucherAmount');
const voucherExpiry = document.getElementById('voucherExpiry');
const generateVoucherBtn = document.getElementById('generateVoucherBtn');
const voucherMessage = document.getElementById('voucherMessage');
const vouchersTableBody = document.getElementById('vouchersTableBody');
const vouchersList = document.getElementById('vouchersList');

async function loadVouchers() {
    try {
        const response = await fetch('/api/admin/vouchers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vouchers = await response.json();
        renderVouchers(vouchers);
        renderVouchersCards(vouchers);
    } catch (error) {
        console.error('Error al cargar códigos:', error);
    }
}

function renderVouchers(vouchers) {
    if (vouchers.length === 0) {
        vouchersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">No hay códigos</td></tr>`;
        return;
    }
    vouchersTableBody.innerHTML = '';
    vouchers.forEach(v => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${v.id}</td>
            <td><strong style="font-family: monospace;">${v.code}</strong></td>
            <td>${v.amount} <small style="color:var(--text-secondary);">cr</small></td>
            <td>${v.used ? '✅ Usado' : '🟢 Disponible'}</td>
            <td>${v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Sin expiración'}</td>
            <td class="actions">
                <button class="delete" onclick="deleteVoucher(${v.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        vouchersTableBody.appendChild(row);
    });
}

function renderVouchersCards(vouchers) {
    if (!vouchersList) return;
    if (vouchers.length === 0) {
        vouchersList.innerHTML = `<div style="text-align:center; color: var(--text-secondary); padding: 20px;">No hay códigos</div>`;
        return;
    }
    vouchersList.innerHTML = '';
    vouchers.forEach(v => {
        const card = document.createElement('div');
        card.className = 'list-item';
        card.innerHTML = `
            <div class="item-row">
                <span class="item-label">Código</span>
                <span class="item-value" style="font-family:monospace;"><strong>${v.code}</strong></span>
            </div>
            <div class="item-row">
                <span class="item-label">Créditos</span>
                <span class="item-value">${v.amount} cr</span>
            </div>
            <div class="item-row">
                <span class="item-label">Estado</span>
                <span class="item-value">${v.used ? '✅ Usado' : '🟢 Disponible'}</span>
            </div>
            <div class="item-row">
                <span class="item-label">Expira</span>
                <span class="item-value">${v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Sin expiración'}</span>
            </div>
            <div class="item-actions">
                <button class="delete-btn" onclick="deleteVoucher(${v.id})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `;
        vouchersList.appendChild(card);
    });
}

// Generar voucher
generateVoucherBtn.addEventListener('click', async function() {
    const amount = parseInt(voucherAmount.value);
    const expires_days = parseInt(voucherExpiry.value) || null;
    if (!amount || amount <= 0) {
        showVoucherMessage('Ingresa un monto válido.', 'error');
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
            showVoucherMessage(`✅ Código generado: ${data.code}`, 'success');
            voucherAmount.value = '';
            voucherExpiry.value = '';
            loadVouchers();
        } else {
            showVoucherMessage(data.message || 'Error al generar', 'error');
        }
    } catch (error) {
        console.error('Error al generar:', error);
        showVoucherMessage('Error de conexión', 'error');
    }
});

function showVoucherMessage(text, type) {
    voucherMessage.textContent = text;
    voucherMessage.className = `detail-message ${type}`;
    voucherMessage.style.display = 'block';
    setTimeout(() => { voucherMessage.style.display = 'none'; }, 5000);
}

// Eliminar voucher
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
            const data = await response.json();
            alert(data.message || 'Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
};

// ================================================================
//  CERRAR SESIÓN
// ================================================================

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// ================================================================
//  INICIALIZAR
// ================================================================

loadDashboard();

const hash = window.location.hash.replace('#', '');
if (hash) {
    const target = document.querySelector(`.nav-item[data-section="${hash}"]`);
    if (target) target.click();
} else {
    document.querySelector('.nav-item[data-section="dashboard"]')?.click();
}