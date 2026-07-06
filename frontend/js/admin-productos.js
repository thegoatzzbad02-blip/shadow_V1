(function () {
    function getActiveCategory() {
        const activeSection = document.querySelector('.admin-section.active');
        if (!activeSection) return null;
        const category = activeSection.id.replace('section-', '');
        return ['giftcards', 'cuentas-hit', 'cursos'].includes(category) ? category : null;
    }

    async function loadProductsByCategory(category) {
        const listContainer = document.getElementById(`list-${category}`);
        if (!listContainer) return;

        listContainer.innerHTML = '<p class="loading-message">Cargando productos...</p>';

        try {
            const products = await window.apiGet('/admin/products');
            const filtered = (products || []).filter((product) => product.category === category);
            if (!filtered.length) {
                listContainer.innerHTML = '<p class="empty-message">No hay productos en esta categoría.</p>';
                return;
            }

            listContainer.innerHTML = filtered.map((product) => `
                <div class="product-admin-card">
                    <div class="product-admin-info">
                        <h4>${window.escapeHtml(product.name)}</h4>
                        <p>${window.escapeHtml(product.description || 'Sin descripción')}</p>
                        <div class="product-admin-meta">
                            <span><i class="fas fa-coins"></i> ${window.formatCredits(product.price)} créditos</span>
                            <span><i class="fas fa-boxes"></i> Stock: ${product.stock}</span>
                            <span><i class="fas fa-code"></i> ${Array.isArray(product.codes) ? product.codes.length : 0} códigos</span>
                        </div>
                    </div>
                    <div class="product-admin-actions">
                        <button class="btn-view" onclick="window.viewProduct(${product.id})"><i class="fas fa-eye"></i></button>
                        <button class="btn-edit" onclick="window.editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="window.deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            listContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function saveProduct(data) {
        try {
            await window.apiPost('/admin/products', data);
            window.showSuccess('Producto guardado correctamente');
            const category = data.category;
            if (category) loadProductsByCategory(category);
            const form = document.querySelector(`.product-form[data-category="${category}"]`);
            if (form) {
                form.querySelectorAll('input, textarea').forEach((element) => {
                    element.value = '';
                });
            }
        } catch (error) {
            window.showError(error.message);
        }
    }

    async function viewProduct(id) {
        window.location.href = `detalle-producto.html?id=${id}`;
    }

    async function editProduct(id) {
        try {
            const products = await window.apiGet('/admin/products');
            const product = (products || []).find((item) => item.id === id);
            if (!product) {
                window.showError('No se encontró el producto');
                return;
            }

            const name = prompt('Nombre del producto:', product.name);
            if (name === null) return;
            const price = prompt('Precio (créditos):', product.price);
            if (price === null) return;
            const stock = prompt('Stock:', product.stock);
            if (stock === null) return;
            const description = prompt('Descripción:', product.description || '');
            if (description === null) return;
            const codes = prompt('Códigos (uno por línea):', (product.codes || []).join('\n'));
            if (codes === null) return;

            await window.apiPut(`/admin/products/${id}`, {
                name: name.trim(),
                price: Number(price) || 0,
                stock: Number(stock) || 0,
                category: product.category,
                description: description.trim(),
                codes: codes.split('\n').map((item) => item.trim()).filter(Boolean),
            });
            window.showSuccess('Producto actualizado');
            loadProductsByCategory(product.category);
        } catch (error) {
            window.showError(error.message);
        }
    }

    async function deleteProduct(id) {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
            await window.apiDelete(`/admin/products/${id}`);
            window.showSuccess('Producto eliminado');
            const category = getActiveCategory();
            if (category) loadProductsByCategory(category);
        } catch (error) {
            window.showError(error.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.btn-save-product').forEach((button) => {
            button.addEventListener('click', () => {
                const form = button.closest('.product-form');
                const category = form?.dataset.category;
                const name = form?.querySelector('.product-name-input').value.trim();
                const price = Number(form?.querySelector('.product-price-input').value || 0);
                const stock = Number(form?.querySelector('.product-stock-input').value || 0);
                const description = form?.querySelector('.product-desc-input').value.trim();
                const codesText = form?.querySelector('.product-codes-input').value || '';
                const codes = codesText ? codesText.split('\n').map((item) => item.trim()).filter(Boolean) : [];
                if (!name || !price || !stock) {
                    window.showError('Nombre, precio y stock son obligatorios');
                    return;
                }
                saveProduct({ name, price, stock, category, description, codes });
            });
        });
    });

    window.loadProductsByCategory = loadProductsByCategory;
    window.saveProduct = saveProduct;
    window.viewProduct = viewProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
})();
