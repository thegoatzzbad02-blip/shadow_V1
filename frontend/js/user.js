const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('username').textContent = user.username;
    document.getElementById('credits').textContent = user.credits;
    loadProducts();

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
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

async function loadProducts() {
    try {
        const response = await fetchWithAuth('/api/user/products');
        const products = await response.json();
        const container = document.getElementById('products');
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay productos disponibles</p>';
            return;
        }

        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${p.price} <small>créditos</small></div>
                    <div class="product-stock">
                        <span>Stock disponible:</span>
                        <span class="stock-badge">${p.stock}</span>
                    </div>
                </div>
                <button onclick="buyProduct(${p.id}, ${p.price})">Comprar ahora</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

window.buyProduct = async function(productId, price) {
    if (user.credits < price) {
        alert('Créditos insuficientes');
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/user/buy/${productId}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            // Actualizar créditos
            user.credits -= price;
            localStorage.setItem('user', JSON.stringify(user));
            document.getElementById('credits').textContent = user.credits;
            document.getElementById('buyMessage').innerHTML = `
                <span>${data.message}</span><br>
                <strong>🎁 Código: ${data.code}</strong><br>
                <span>Créditos restantes: ${data.credits_remaining}</span>
            `;
            loadProducts(); // Recargar productos para actualizar stock
        } else {
            document.getElementById('buyMessage').textContent = data.message || 'Error al comprar';
        }
    } catch (error) {
        console.error('Error en compra:', error);
    }
};