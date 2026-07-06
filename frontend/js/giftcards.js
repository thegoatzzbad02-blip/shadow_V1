// ================================================================
// GIFT CARDS · DISEÑO PREMIUM Y MODERNO
// ================================================================

(function () {
    const section = 'giftcards';

    // ===== MENSAJES AMIGABLES =====
    const MENSAJES = {
        loading: '🎁 Cargando gift cards...',
        empty: '📭 No hay gift cards disponibles por ahora. ¡Vuelve pronto!',
        error: '❌ Ups! No pudimos cargar las gift cards. Intenta de nuevo.',
    };

    // ===== CARGAR GIFT CARDS =====
    async function loadGiftCards() {
        const container = document.getElementById('products-giftcards');
        if (!container) {
            console.warn('⚠️ Contenedor #products-giftcards no encontrado');
            return;
        }

        mostrarCargando(container);

        try {
            if (typeof window.apiGet !== 'function') {
                throw new Error('La función apiGet no está disponible');
            }

            const products = await window.apiGet('/user/products');
            const filtered = (products || []).filter(p => p.category === section);
            renderProducts(container, filtered);
        } catch (error) {
            console.error('Error al cargar gift cards:', error);
            mostrarError(container, error.message);
        }
    }

    // ===== MOSTRAR CARGA =====
    function mostrarCargando(container) {
        container.innerHTML = `
            <div class="loading-giftcards">
                <div class="spinner-giftcard"></div>
                <p>🎁 Cargando gift cards...</p>
            </div>
        `;
    }

    // ===== MOSTRAR ERROR =====
    function mostrarError(container, mensaje) {
        container.innerHTML = `
            <div class="error-giftcards">
                <i class="fas fa-exclamation-circle"></i>
                <p>${mensaje || MENSAJES.error}</p>
                <button onclick="window.loadGiftCards()" class="btn-retry-giftcard">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    // ===== RENDERIZAR GIFT CARDS =====
    function renderProducts(container, products) {
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-giftcards">
                    <i class="fas fa-gift"></i>
                    <h3>¡Ups! No hay gift cards</h3>
                    <p>No hay gift cards disponibles por ahora.</p>
                    <p class="suggestion">💡 ¿Sabías que puedes sugerirnos nuevas gift cards?</p>
                </div>
            `;
            return;
        }

        // Mostrar contador
        const header = `
            <div class="giftcards-header">
                <span class="giftcards-count">🎯 ${products.length} gift cards disponibles</span>
            </div>
        `;

        // Generar tarjetas
        const cards = products.map(p => renderGiftCard(p)).join('');
        container.innerHTML = header + `<div class="giftcards-grid">${cards}</div>`;
    }

    // ===== RENDERIZAR UNA GIFT CARD =====
    function renderGiftCard(product) {
        const hasStock = product.stock > 0;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const canBuy = hasStock && user.credits >= product.price;

        // Determinar color de marca (simulado)
        const brandColors = {
            'amazon': '#ff9900',
            'netflix': '#e50914',
            'spotify': '#1db954',
            'google': '#4285f4',
            'apple': '#555555',
            'steam': '#1b2838',
            'default': '#3b82f6'
        };

        const brandKey = product.name.toLowerCase().includes('amazon') ? 'amazon' :
                         product.name.toLowerCase().includes('netflix') ? 'netflix' :
                         product.name.toLowerCase().includes('spotify') ? 'spotify' :
                         product.name.toLowerCase().includes('google') ? 'google' :
                         product.name.toLowerCase().includes('apple') ? 'apple' :
                         product.name.toLowerCase().includes('steam') ? 'steam' : 'default';

        const brandColor = brandColors[brandKey] || brandColors.default;

        return `
            <div class="giftcard-card" style="--brand-color: ${brandColor};">
                <!-- Badge de marca -->
                <div class="giftcard-brand-badge" style="background: ${brandColor};">
                    ${getBrandIcon(brandKey)}
                    ${brandKey !== 'default' ? brandKey.charAt(0).toUpperCase() + brandKey.slice(1) : 'Gift Card'}
                </div>

                <!-- Icono principal -->
                <div class="giftcard-icon" style="color: ${brandColor};">
                    <i class="fas fa-gift"></i>
                </div>

                <!-- Nombre -->
                <h3 class="giftcard-name">${product.name}</h3>

                <!-- Descripción -->
                ${product.description ? `<p class="giftcard-description">${product.description}</p>` : ''}

                <!-- Precio y stock -->
                <div class="giftcard-info">
                    <div class="giftcard-price">
                        <span class="price-value">${product.price}</span>
                        <span class="price-label">créditos</span>
                    </div>
                    <div class="giftcard-stock ${hasStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="fas ${hasStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${hasStock ? `${product.stock} disponibles` : 'Agotado'}
                    </div>
                </div>

                <!-- Barra de stock visual -->
                <div class="giftcard-stock-bar">
                    <div class="giftcard-stock-fill" style="width: ${Math.min((product.stock / 10) * 100, 100)}%; background: ${hasStock ? brandColor : '#ff4757'};"></div>
                </div>

                <!-- Botones -->
                <div class="giftcard-actions">
                    <button onclick="comprarProducto(${product.id}, ${product.price})" 
                            class="giftcard-btn-buy ${canBuy ? '' : 'disabled'}" 
                            ${!canBuy ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> 
                        ${!hasStock ? 'Sin stock' : !canBuy ? 'Créditos insuficientes' : 'Comprar ahora'}
                    </button>
                    <button onclick="verDetalles(${product.id})" class="giftcard-btn-detail">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>

                ${!canBuy && hasStock ? `
                    <div class="giftcard-credit-warning">
                        <i class="fas fa-info-circle"></i> Necesitas ${product.price - user.credits} créditos más
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ===== OBTENER ICONO DE MARCA =====
    function getBrandIcon(brand) {
        const icons = {
            'amazon': '<i class="fab fa-amazon"></i>',
            'netflix': '<i class="fab fa-netflix"></i>',
            'spotify': '<i class="fab fa-spotify"></i>',
            'google': '<i class="fab fa-google"></i>',
            'apple': '<i class="fab fa-apple"></i>',
            'steam': '<i class="fab fa-steam"></i>',
            'default': '<i class="fas fa-tag"></i>'
        };
        return icons[brand] || icons.default;
    }

    // ===== EXPONER =====
    window.loadGiftCards = loadGiftCards;

    console.log('✅ giftcards.js cargado (diseño premium)');
})();