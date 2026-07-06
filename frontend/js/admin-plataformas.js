(function () {
    let platforms = [];
    let editingPlatformId = null;

    async function loadPlatformsConfig() {
        const container = document.getElementById('platformsConfig');
        if (!container) return;
        try {
            const data = await window.apiGet('/admin/plataformas');
            platforms = data || [];
            if (!platforms.length) {
                container.innerHTML = '<p class="empty-message">No hay plataformas configuradas.</p>';
                return;
            }
            container.innerHTML = platforms.map((platform) => `
                <div class="config-item">
                    <div class="platform-info">
                        <i class="${platform.icono || 'fas fa-tv'}" style="color:${platform.color || '#3b82f6'}"></i>
                        <div>
                            <span class="platform-name">${window.escapeHtml(platform.nombre)}</span>
                            <div class="platform-meta">
                                <span class="platform-price">${platform.precio} cr</span>
                                <span class="platform-status ${platform.activo ? 'active' : 'inactive'}">${platform.activo ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="platform-actions">
                        <button class="btn-edit-platform" onclick="window.editPlatform(${platform.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-platform" onclick="window.deletePlatform(${platform.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function savePlatform() {
        const name = document.getElementById('newPlatformName').value.trim();
        const price = Number(document.getElementById('newPlatformPrice').value || 0);
        const icon = document.getElementById('newPlatformIcon').value.trim() || 'fas fa-tv';
        const color = document.getElementById('newPlatformColor').value.trim() || '#3b82f6';
        const active = document.getElementById('newPlatformActive').checked;
        if (!name || !price) {
            window.showError('Nombre y precio son obligatorios');
            return;
        }
        try {
            const payload = { nombre: name, precio: price, icono: icon, color, activo: active ? 1 : 0 };
            if (editingPlatformId) {
                await window.apiPut(`/admin/plataformas/${editingPlatformId}`, payload);
                window.showSuccess('Plataforma actualizada');
            } else {
                await window.apiPost('/admin/plataformas', payload);
                window.showSuccess('Plataforma guardada');
            }
            closeAddPlatformModal();
            loadPlatformsConfig();
        } catch (error) {
            window.showError(error.message);
        }
    }

    function editPlatform(id) {
        const platform = platforms.find((item) => item.id === id);
        if (!platform) return;
        editingPlatformId = id;
        const modal = document.getElementById('addPlatformModal');
        const modalTitle = document.getElementById('platformModalTitle');
        const saveButton = document.getElementById('savePlatformBtn');
        if (modalTitle) modalTitle.textContent = 'Editar plataforma';
        if (saveButton) saveButton.textContent = 'Actualizar plataforma';
        document.getElementById('newPlatformName').value = platform.nombre || '';
        document.getElementById('newPlatformPrice').value = platform.precio || '';
        document.getElementById('newPlatformIcon').value = platform.icono || 'fas fa-tv';
        document.getElementById('newPlatformColor').value = platform.color || '#3b82f6';
        document.getElementById('newPlatformActive').checked = Boolean(platform.activo);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }

    async function deletePlatform(id) {
        if (!confirm('¿Eliminar esta plataforma?')) return;
        try {
            await window.apiDelete(`/admin/plataformas/${id}`);
            window.showSuccess('Plataforma eliminada');
            loadPlatformsConfig();
        } catch (error) {
            window.showError(error.message);
        }
    }

    function openAddPlatformModal() {
        editingPlatformId = null;
        const modal = document.getElementById('addPlatformModal');
        const modalTitle = document.getElementById('platformModalTitle');
        const saveButton = document.getElementById('savePlatformBtn');
        if (modalTitle) modalTitle.textContent = 'Agregar plataforma';
        if (saveButton) saveButton.textContent = 'Guardar plataforma';
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }

    function closeAddPlatformModal() {
        const modal = document.getElementById('addPlatformModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        editingPlatformId = null;
        document.getElementById('newPlatformName').value = '';
        document.getElementById('newPlatformPrice').value = '';
        document.getElementById('newPlatformIcon').value = '';
        document.getElementById('newPlatformColor').value = '';
        document.getElementById('newPlatformActive').checked = true;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const addButton = document.getElementById('addPlatformBtn');
        const saveButton = document.getElementById('savePlatformBtn');
        if (addButton) addButton.addEventListener('click', openAddPlatformModal);
        if (saveButton) saveButton.addEventListener('click', savePlatform);
    });

    window.loadPlatformsConfig = loadPlatformsConfig;
    window.savePlatform = savePlatform;
    window.editPlatform = editPlatform;
    window.deletePlatform = deletePlatform;
    window.openAddPlatformModal = openAddPlatformModal;
    window.closeAddPlatformModal = closeAddPlatformModal;
})();
