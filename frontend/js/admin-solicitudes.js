(function () {
    let solicitudes = [];
    let currentFilter = 'all';

    async function loadSolicitudes(filter = currentFilter) {
        currentFilter = filter;
        const list = document.getElementById('solicitudesList');
        if (!list) return;

        list.innerHTML = '<p class="loading-message">Cargando solicitudes...</p>';
        try {
            const data = await window.apiGet('/admin/solicitudes');
            solicitudes = data || [];
            const filtered = filter === 'all' ? solicitudes : solicitudes.filter((item) => item.estado === filter);
            if (!filtered.length) {
                list.innerHTML = '<p class="empty-message">No hay solicitudes.</p>';
                return;
            }
            list.innerHTML = filtered.map((solicitud) => `
                <div class="admin-list-item">
                    <div>
                        <strong>${window.escapeHtml(solicitud.plataforma)} · ${window.escapeHtml(solicitud.username || '')}</strong>
                        <div class="muted">${window.escapeHtml(solicitud.email)} · ${window.escapeHtml(solicitud.password || 'Sin contraseña')}</div>
                        <div class="muted">${window.escapeHtml(solicitud.mensaje || 'Sin mensaje')} · ${window.escapeHtml(window.formatDate ? window.formatDate(solicitud.creado_en) : (solicitud.creado_en || ''))}</div>
                    </div>
                    <div class="admin-actions">
                        <button onclick="window.viewSolicitud(${solicitud.id})">Ver</button>
                        <button onclick="window.changeSolicitudStatus(${solicitud.id}, 'completed')">Aprobar</button>
                        <button class="danger" onclick="window.changeSolicitudStatus(${solicitud.id}, 'cancelled')">Rechazar</button>
                    </div>
                </div>
            `).join('');
            updateStats();
        } catch (error) {
            list.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function updateStats() {
        const total = document.getElementById('totalSolicitudes');
        const pending = document.getElementById('pendingSolicitudes');
        const completed = document.getElementById('completedSolicitudes');
        const stats = {
            total: solicitudes.length,
            pending: solicitudes.filter((item) => item.estado === 'pending').length,
            completed: solicitudes.filter((item) => item.estado === 'completed').length,
            cancelled: solicitudes.filter((item) => item.estado === 'cancelled').length,
        };
        if (total) total.textContent = stats.total;
        if (pending) pending.textContent = stats.pending;
        if (completed) completed.textContent = stats.completed;
    }

    async function changeSolicitudStatus(id, estado) {
        try {
            await window.apiPut(`/admin/solicitudes/${id}`, { estado });
            window.showSuccess('Solicitud actualizada');
            loadSolicitudes(currentFilter);
        } catch (error) {
            window.showError(error.message);
        }
    }

    function viewSolicitud(id) {
        const solicitud = solicitudes.find((item) => item.id === id);
        const modal = document.getElementById('solicitudModal');
        const modalBody = document.getElementById('solicitudModalBody');
        if (!solicitud || !modal || !modalBody) return;

        modalBody.innerHTML = `
            <div class="solicitud-detalle">
                <div class="detalle-row"><span>Usuario</span><strong>${window.escapeHtml(solicitud.username || '')}</strong></div>
                <div class="detalle-row"><span>Plataforma</span><strong>${window.escapeHtml(solicitud.plataforma)}</strong></div>
                <div class="detalle-row"><span>Correo</span><strong>${window.escapeHtml(solicitud.email)}</strong></div>
                <div class="detalle-row"><span>Contraseña</span><strong>${window.escapeHtml(solicitud.password || 'Sin contraseña')}</strong></div>
                <div class="detalle-row"><span>Mensaje</span><strong>${window.escapeHtml(solicitud.mensaje || 'Sin mensaje')}</strong></div>
                <div class="detalle-row"><span>Estado</span><strong>${window.escapeHtml(solicitud.estado || 'pending')}</strong></div>
                <div class="detalle-row"><span>Fecha</span><strong>${window.escapeHtml(window.formatDate ? window.formatDate(solicitud.creado_en) : (solicitud.creado_en || ''))}</strong></div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function closeSolicitudModal() {
        const modal = document.getElementById('solicitudModal');
        if (modal) modal.style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                loadSolicitudes(button.dataset.filter || 'all');
            });
        });
        loadSolicitudes('all');
    });

    window.loadSolicitudes = loadSolicitudes;
    window.changeSolicitudStatus = changeSolicitudStatus;
    window.viewSolicitud = viewSolicitud;
    window.closeSolicitudModal = closeSolicitudModal;
})();
