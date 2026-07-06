(function () {
    async function loadHistory() {
        const container = document.getElementById('allRequests');
        if (!container) return;

        try {
            const data = await window.apiGet('/user/historial');
            const combined = [
                ...(data.compras || []).map((item) => ({ type: 'compra', ...item })),
                ...(data.solicitudes || []).map((item) => ({ type: 'solicitud', ...item })),
            ].sort((a, b) => new Date(b.purchased_at || b.creado_en || 0) - new Date(a.purchased_at || a.creado_en || 0));

            if (!combined.length) {
                container.innerHTML = '<p class="empty-message">No hay actividad aún.</p>';
                return;
            }

            container.innerHTML = combined.map((item) => {
                if (item.type === 'compra') {
                    return `
                        <div class="request-item">
                            <div><strong>${window.escapeHtml(item.product_name)}</strong></div>
                            <div>Compra realizada · ${window.escapeHtml(item.code || '')}</div>
                            <div class="status-badge completed">Comprado</div>
                        </div>`;
                }
                return `
                    <div class="request-item">
                        <div><strong>${window.escapeHtml(item.plataforma)}</strong></div>
                        <div>${window.escapeHtml(item.email)}</div>
                        <div class="status-badge ${item.estado}">${item.estado === 'pending' ? 'Pendiente' : item.estado === 'completed' ? 'Completada' : 'Cancelada'}</div>
                    </div>`;
            }).join('');
        } catch (error) {
            container.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    document.addEventListener('DOMContentLoaded', loadHistory);
    window.loadHistory = loadHistory;
})();
