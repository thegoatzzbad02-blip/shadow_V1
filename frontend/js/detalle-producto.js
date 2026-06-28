// ================================================================
//  DETALLE DEL PRODUCTO (con datos del admin)
// ================================================================

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'user') {
    window.location.href = 'login.html';
}

const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id'));

if (!productId) {
    window.location.href = 'user.html';
}

// DOM elements
const productName = document.getElementById('productName');
const productCategory = document.getElementById('productCategory');
const productCategoryBadge = document.getElementById('productCategoryBadge');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const userBalance = document.getElementById('userBalance');
const btnBuy = document.getElementById('btnBuy');
const btnFav = document.getElementById('btnFav');
const detailMessage = document.getElementById('detailMessage');
const productIcon = document.getElementById('productIcon');
const stockBadge = document.getElementById('stockBadge');

let product = null;

const categoryIcons = {
    'streaming': 'fa-film',
    'giftcards': 'fa-gift',
    'cursos': 'fa-graduation-cap',
    'otros': 'fa-ellipsis-h'
};

const categoryNames = {
    'streaming': 'Streaming',
    'giftcards': 'Gift Card',
    'cursos': 'Curso',
    'otros': 'Otros'
};

// ================================================================
//  CARGAR PRODUCTO
// ================================================================

async function loadProduct() {
    try {
        const response = await fetch(`/api/user/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await response.json();
        product = products.find(p => p.id === productId);

        if (!product) {
            window.location.href = 'user.html';
            return;
        }

        renderProduct();
    } catch (error) {
        console.error('Error al cargar producto:', error);
        window.location.href = 'user.html';
    }
}

function renderProduct() {
    // Nombre
    productName.textContent = product.name;

    // Categoría
    const catName = categoryNames[product.category] || 'Otros';
    productCategory.textContent = catName;
    productCategoryBadge.textContent = catName;

    // Descripción
    productDescription.textContent = product.description || 'Sin descripción disponible.';

    // Precio
    productPrice.innerHTML = `${product.price} <small>créditos</small>`;

    // Icono
    const iconClass = categoryIcons[product.category] || 'fa-gem';
    productIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;

    // Stock
    updateStockBadge();

    // Saldo del usuario
    userBalance.textContent = user.credits;

    // Actualizar botón de compra
    updateBuyButton();
}

function updateStockBadge() {
    if (product.stock <= 0) {
        stockBadge.textContent = 'Sin stock';
        stockBadge.className = 'stock-badge out-of-stock';
    } else if (product.stock <= 3) {
        stockBadge.textContent = `Últimas ${product.stock} unidades`;
        stockBadge.className = 'stock-badge in-stock';
    } else {
        stockBadge.textContent = `En stock (${product.stock})`;
        stockBadge.className = 'stock-badge in-stock';
    }
}

function updateBuyButton() {
    if (!product) return;

    if (product.stock <= 0) {
        btnBuy.disabled = true;
        btnBuy.innerHTML = '<i class="fas fa-times-circle"></i> Sin stock';
        showMessage('Este producto no está disponible por el momento.', 'error');
        return;
    }

    if (user.credits < product.price) {
        btnBuy.disabled = true;
        btnBuy.innerHTML = '<i class="fas fa-coins"></i> Créditos insuficientes';
        showMessage(`Necesitas ${product.price - user.credits} créditos más para comprar este producto.`, 'info');
        return;
    }

    btnBuy.disabled = false;
    btnBuy.innerHTML = '<i class="fas fa-shopping-cart"></i> Comprar ahora';
    hideMessage();
}

function showMessage(text, type) {
    detailMessage.textContent = text;
    detailMessage.className = `detail-message ${type}`;
    detailMessage.style.display = 'block';
}

function hideMessage() {
    detailMessage.style.display = 'none';
}

// ================================================================
//  COMPRA
// ================================================================

btnBuy.addEventListener('click', async function() {
    if (btnBuy.disabled) return;

    if (!confirm(`¿Confirmas la compra de "${product.name}" por ${product.price} créditos?`)) {
        return;
    }

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
            userBalance.textContent = user.credits;

            sessionStorage.setItem('productoComprado', JSON.stringify({
                nombre: product.name,
                contenido: data.code
            }));
            window.location.href = 'producto-comprado.html';
        } else {
            showMessage(data.message || 'Error al comprar', 'error');
            loadProduct();
        }
    } catch (error) {
        console.error('Error en compra:', error);
        showMessage('Error de conexión con el servidor.', 'error');
    }
});

// ================================================================
//  FAVORITOS (simulado)
// ================================================================

btnFav.addEventListener('click', function() {
    const icon = btnFav.querySelector('i');
    icon.classList.toggle('fas');
    icon.classList.toggle('far');
    btnFav.classList.toggle('active');
});

// ================================================================
//  INICIALIZAR
// ================================================================

document.addEventListener('DOMContentLoaded', loadProduct);