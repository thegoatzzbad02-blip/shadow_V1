(function () {
    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.right = '16px';
            container.style.bottom = '16px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info', timeout = 2800) {
        const container = ensureContainer();
        const toast = document.createElement('div');
        const colors = {
            success: 'linear-gradient(135deg, #22c55e, #16a34a)',
            error: 'linear-gradient(135deg, #f87171, #dc2626)',
            info: 'linear-gradient(135deg, #38bdf8, #2563eb)',
        };

        toast.textContent = message;
        toast.style.background = colors[type] || colors.info;
        toast.style.color = '#fff';
        toast.style.padding = '12px 16px';
        toast.style.borderRadius = '999px';
        toast.style.boxShadow = '0 12px 30px rgba(0,0,0,0.22)';
        toast.style.fontSize = '0.95rem';
        toast.style.fontWeight = '600';
        toast.style.minWidth = '220px';
        toast.style.maxWidth = '320px';
        toast.style.animation = 'fadeIn 0.25s ease';

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, timeout);
    }

    window.showToast = showToast;
    window.showSuccess = (message, timeout) => showToast(message, 'success', timeout);
    window.showError = (message, timeout) => showToast(message, 'error', timeout);
})();
