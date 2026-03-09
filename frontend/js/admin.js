const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('h1').innerHTML = `SHADOW · ADMIN - Bienvenido ${user.username}`;
    loadUsers();
    loadProducts();

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    document.getElementById('createUserForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const credits = parseInt(document.getElementById('newCredits').value);

        const response = await fetchWithAuth('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, credits })
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('userMessage').textContent = 'Usuario creado';
            document.getElementById('createUserForm').reset();
            loadUsers();
        } else {
            document.getElementById('userMessage').textContent = data.message || 'Error';
        }
    });

    const stockInput = document.getElementById('productStock');
    stockInput.addEventListener('input', function() {
        const stock = parseInt(stockInput.value);
        generateCodeFields(stock > 0 ? stock : 0);
    });

    document.getElementById('createProductForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('productName').value;
        const price = parseInt(document.getElementById('productPrice').value);
        const stock = parseInt(stockInput.value);

        const codeInputs = document.querySelectorAll('.code-input');
        const codes = [];
        let valid = true;
        codeInputs.forEach(input => {
            const val = input.value.trim();
            if (!val) {
                alert('Todos los códigos son obligatorios');
                valid = false;
                return;
            }
            codes.push(val);
        });
        if (!valid) return;
        if (codes.length !== stock) {
            alert(`El número de códigos (${codes.length}) no coincide con el stock (${stock})`);
            return;
        }

        const response = await fetchWithAuth('/api/admin/products', {
            method: 'POST',
            body: JSON.stringify({ name, price, stock, codes })
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('productMessage').textContent = 'Producto creado';
            document.getElementById('createProductForm').reset();
            document.getElementById('codesContainer').innerHTML = '';
            loadProducts();
        } else {
            document.getElementById('productMessage').textContent = data.message || 'Error';
        }
    });
});

async function fetchWithAuth(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
    return response;
}

function generateCodeFields(count) {
    const container = document.getElementById('codesContainer');
    if (!container) {
        console.error('Contenedor de códigos no encontrado');
        return;
    }
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'code-input';
        input.placeholder = `Código #${i + 1}`;
        input.required = true;
        container.appendChild(input);
    }
}

async function loadUsers() {
    const response = await fetchWithAuth('/api/admin/users');
    const users = await response.json();
    const list = document.getElementById('userList');
    list.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${user.username} - Créditos: ${user.credits}</span>
            <div>
                <button class="action-btn edit-btn" onclick="editUser(${user.id})">Editar</button>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Eliminar</button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function loadProducts() {
    const response = await fetchWithAuth('/api/admin/products');
    const products = await response.json();
    const list = document.getElementById('productList');
    list.innerHTML = '';
    products.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${p.name} - Precio: ${p.price} - Stock: ${p.stock} (${p.codes.length} códigos)</span>
            <div>
                <button class="action-btn edit-btn" onclick="editProduct(${p.id})">Editar</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})">Eliminar</button>
            </div>
        `;
        list.appendChild(li);
    });
}

window.editUser = async function(userId) {
    const newName = prompt('Nuevo nombre de usuario:');
    if (!newName) return;
    const newCredits = parseInt(prompt('Nuevos créditos:'));
    if (isNaN(newCredits)) return alert('Créditos inválidos');
    const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ username: newName, credits: newCredits })
    });
    const data = await response.json();
    if (response.ok) {
        alert('Usuario actualizado');
        loadUsers();
    } else {
        alert(data.message || 'Error al actualizar');
    }
};

window.deleteUser = async function(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (response.ok) {
        alert('Usuario eliminado');
        loadUsers();
    } else {
        alert(data.message || 'Error al eliminar');
    }
};

window.editProduct = async function(productId) {
    const newName = prompt('Nuevo nombre del producto:');
    if (!newName) return;
    const newPrice = parseInt(prompt('Nuevo precio en créditos:'));
    if (isNaN(newPrice)) return alert('Precio inválido');
    const newStock = parseInt(prompt('Nuevo stock:'));
    if (isNaN(newStock)) return alert('Stock inválido');
    const response = await fetchWithAuth(`/api/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName, price: newPrice, stock: newStock })
    });
    const data = await response.json();
    if (response.ok) {
        alert('Producto actualizado');
        loadProducts();
    } else {
        alert(data.message || 'Error al actualizar');
    }
};

window.deleteProduct = async function(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const response = await fetchWithAuth(`/api/admin/products/${productId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (response.ok) {
        alert('Producto eliminado');
        loadProducts();
    } else {
        alert(data.message || 'Error al eliminar');
    }
};