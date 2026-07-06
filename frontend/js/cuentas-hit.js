// ================================================================
// CUENTAS HIT · DISEÑO MODERNO CON ICONOS
// ================================================================

(function () {
    const section = 'cuentas-hit';

    // ===== MENSAJES AMIGABLES =====
    const MENSAJES = {
        loading: '🎬 Cargando cuentas premium...',
        empty: '📭 No hay cuentas hit disponibles por ahora. ¡Vuelve pronto!',
        error: '❌ Ups! No pudimos cargar las cuentas. Intenta de nuevo.',
    };

    // ===== CARGAR CUENTAS HIT =====
    async function loadCuentasHit() {
        // 🔧 USAR ID ÚNICO
        const container = document.getElementById('products-cuentas-hit');
        if (!container) {
            console.warn('⚠️ Contenedor #products-cuentas-hit no encontrado');
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
            console.error('Error al cargar cuentas hit:', error);
            mostrarError(container, error.message);
        }
    }

    // ===== MOSTRAR CARGA =====
    function mostrarCargando(container) {
        container.innerHTML = `
            <div class="loading-cuentas">
                <div class="spinner-cuenta"></div>
                <p>🎬 Cargando cuentas premium...</p>
            </div>
        `;
    }

    // ===== MOSTRAR ERROR =====
    function mostrarError(container, mensaje) {
        container.innerHTML = `
            <div class="error-cuentas">
                <i class="fas fa-exclamation-circle"></i>
                <p>${mensaje || MENSAJES.error}</p>
                <button onclick="window.loadCuentasHit()" class="btn-retry-cuenta">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    // ===== RENDERIZAR =====
    function renderProducts(container, products) {
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-cuentas">
                    <i class="fas fa-film"></i>
                    <h3>No hay cuentas hit disponibles</h3>
                    <p>${MENSAJES.empty}</p>
                    <p class="suggestion">💡 Vuelve más tarde, estamos actualizando nuestro catálogo.</p>
                </div>
            `;
            return;
        }

        const header = `
            <div class="cuentas-header">
                <span class="cuentas-count">🎯 ${products.length} cuentas disponibles</span>
            </div>
        `;

        const cards = products.map(p => renderCuentaCard(p)).join('');
        container.innerHTML = header + `<div class="cuentas-grid">${cards}</div>`;
    }

    // ===== RENDERIZAR TARJETA DE CUENTA HIT =====
    function renderCuentaCard(product) {
        const hasStock = product.stock > 0;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const canBuy = hasStock && user.credits >= product.price;

        // Determinar plataforma de streaming
        const plataformas = {
            'netflix': { icon: 'fab fa-netflix', color: '#e50914', label: 'Netflix' },
            'disney': { icon: 'fab fa-disney', color: '#0063e5', label: 'Disney+' },
            'hbo': { icon: 'fas fa-video', color: '#9b4dff', label: 'HBO Max' },
            'spotify': { icon: 'fab fa-spotify', color: '#1db954', label: 'Spotify' },
            'amazon': { icon: 'fab fa-amazon', color: '#ff9900', label: 'Amazon Prime' },
            'default': { icon: 'fas fa-film', color: '#3b82f6', label: 'Streaming' }
        };

        const nombreLower = product.name.toLowerCase();
        let plataforma = plataformas.default;
        if (nombreLower.includes('netflix')) plataforma = plataformas.netflix;
        else if (nombreLower.includes('disney')) plataforma = plataformas.disney;
        else if (nombreLower.includes('hbo')) plataforma = plataformas.hbo;
        else if (nombreLower.includes('spotify')) plataforma = plataformas.spotify;
        else if (nombreLower.includes('amazon') || nombreLower.includes('prime')) plataforma = plataformas.amazon;

        return `
            <div class="cuenta-card" style="--brand-color: ${plataforma.color};">
                <!-- Badge de plataforma -->
                <div class="cuenta-badge" style="background: ${plataforma.color};">
                    <i class="${plataforma.icon}"></i> ${plataforma.label}
                </div>

                <!-- Icono grande -->
                <div class="cuenta-icon" style="color: ${plataforma.color};">
                    <i class="${plataforma.icon}"></i>
                </div>

                <!-- Nombre -->
                <h3 class="cuenta-name">${product.name}</h3>

                <!-- Descripción -->
                ${product.description ? `<p class="cuenta-description">${product.description}</p>` : ''}

                <!-- Precio y stock -->
                <div class="cuenta-info">
                    <div class="cuenta-price">
                        <span class="price-value">${product.price}</span>
                        <span class="price-label">créditos</span>
                    </div>
                    <div class="cuenta-stock ${hasStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="fas ${hasStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${hasStock ? `${product.stock} disponibles` : 'Agotado'}
                    </div>
                </div>

                <!-- Barra de stock -->
                <div class="cuenta-stock-bar">
                    <div class="cuenta-stock-fill" style="width: ${Math.min((product.stock / 10) * 100, 100)}%; background: ${hasStock ? plataforma.color : '#ff4757'};"></div>
                </div>

                <!-- Botones -->
                <div class="cuenta-actions">
                    <button onclick="comprarProducto(${product.id}, ${product.price})" 
                            class="cuenta-btn-buy ${canBuy ? '' : 'disabled'}" 
                            ${!canBuy ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> 
                        ${!hasStock ? 'Sin stock' : !canBuy ? 'Créditos insuficientes' : 'Comprar ahora'}
                    </button>
                    <button onclick="verDetalles(${product.id})" class="cuenta-btn-detail">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>

                ${!canBuy && hasStock ? `
                    <div class="cuenta-credit-warning">
                        <i class="fas fa-info-circle"></i> Necesitas ${product.price - user.credits} créditos más
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ===== EXPONER =====
    window.loadCuentasHit = loadCuentasHit;

    console.log('✅ cuentas-hit.js cargado (diseño moderno)');
})();