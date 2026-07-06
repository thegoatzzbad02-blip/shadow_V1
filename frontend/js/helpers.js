(function () {
    function getUserFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch (e) {
            return null;
        }
    }

    function formatCredits(value) {
        const number = Number(value || 0);
        return number.toLocaleString('es-ES');
    }

    function formatDate(value) {
        if (!value) return 'Sin fecha';
        try {
            return new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
        } catch (e) {
            return value;
        }
    }

    function getCategoryLabel(category) {
        const labels = {
            giftcards: 'Gift Card',
            'cuentas-hit': 'Cuenta Hit',
            cursos: 'Curso',
            otros: 'Otro',
        };
        return labels[category] || 'Producto';
    }

    function getCategoryIcon(category) {
        const icons = {
            giftcards: 'fa-gift',
            'cuentas-hit': 'fa-film',
            cursos: 'fa-graduation-cap',
            otros: 'fa-box',
        };
        return icons[category] || 'fa-box';
    }

    function getStockBadge(stock) {
        if (stock <= 0) {
            return '<span class="stock-badge out-of-stock">Sin stock</span>';
        }
        if (stock <= 3) {
            return `<span class="stock-badge in-stock">Últimas ${stock} unidades</span>`;
        }
        return `<span class="stock-badge in-stock">En stock (${stock})</span>`;
    }

    function createProductCardMarkup(product, options = {}) {
        const badge = getStockBadge(product.stock);
        const price = formatCredits(product.price);
        const showDetails = options.showDetails !== false;
        const actionLabel = options.actionLabel || 'Comprar';
        const detailsUrl = options.detailsUrl || `detalle-producto.html?id=${product.id}`;
        const route = options.route || 'detalle-producto.html';

        return `
            <article class="product-card-modern">
                <div class="product-card-top">
                    <div class="product-icon-pill"><i class="fas ${getCategoryIcon(product.category)}"></i></div>
                    <span class="product-badge">${getCategoryLabel(product.category)}</span>
                </div>
                <h3>${product.name}</h3>
                <p>${product.description || 'Producto disponible'}</p>
                <div class="product-meta">
                    <span><i class="fas fa-coins"></i> ${price} créditos</span>
                    <span><i class="fas fa-boxes"></i> ${product.stock} disponibles</span>
                </div>
                <div class="product-card-footer">
                    ${badge}
                    <div class="product-card-actions">
                        ${showDetails ? `<a class="btn-secondary" href="${route}?id=${product.id}">Ver detalles</a>` : ''}
                        <button class="btn-buy" type="button" onclick="window.comprarProducto(${product.id}, ${product.price})">${actionLabel}</button>
                    </div>
                </div>
            </article>
        `;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    window.getUserFromStorage = getUserFromStorage;
    window.formatCredits = formatCredits;
    window.formatDate = formatDate;
    window.getCategoryLabel = getCategoryLabel;
    window.getCategoryIcon = getCategoryIcon;
    window.getStockBadge = getStockBadge;
    window.createProductCardMarkup = createProductCardMarkup;
    window.escapeHtml = escapeHtml;
})();
