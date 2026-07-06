(function () {
    async function loadVouchers() {
        const list = document.getElementById('voucherList');
        if (!list) return;

        list.innerHTML = '<p class="loading-message">Cargando códigos...</p>';
        try {
            const vouchers = await window.apiGet('/admin/vouchers');
            if (!vouchers.length) {
                list.innerHTML = '<p class="empty-message">No hay códigos generados.</p>';
                return;
            }

            list.innerHTML = vouchers.map((voucher) => `
                <div class="admin-list-item">
                    <div>
                        <strong>${window.escapeHtml(voucher.code)}</strong>
                        <div class="muted">Monto: ${window.formatCredits(voucher.amount)} · Expira: ${voucher.expires_at ? window.formatDate(voucher.expires_at) : 'Sin fecha'}</div>
                    </div>
                    <div class="admin-actions">
                        <button class="danger" onclick="window.deleteVoucher(${voucher.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            list.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function generateVoucher() {
        const amount = Number(document.getElementById('voucherAmount').value || 0);
        const expiresDays = Number(document.getElementById('voucherExpiry').value || 0);
        try {
            await window.apiPost('/admin/vouchers', { amount, expires_days: expiresDays });
            document.getElementById('voucherAmount').value = '';
            document.getElementById('voucherExpiry').value = '';
            window.showSuccess('Código generado correctamente');
            loadVouchers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    async function deleteVoucher(id) {
        if (!confirm('¿Eliminar este código?')) return;
        try {
            await window.apiDelete(`/admin/vouchers/${id}`);
            window.showSuccess('Código eliminado');
            loadVouchers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('generateVoucherBtn');
        if (button) button.addEventListener('click', generateVoucher);
    });

    window.loadVouchers = loadVouchers;
    window.generateVoucher = generateVoucher;
    window.deleteVoucher = deleteVoucher;
})();
