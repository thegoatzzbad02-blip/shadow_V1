// ================================================================
// CANJEAR CÓDIGO · LÓGICA COMPLETA (MÓDULO)
// ================================================================

(function () {
    let redeemInput, redeemBtn, redeemMessage;

    // ===== FUNCIÓN PRINCIPAL DE CANJE =====
    async function redeemCode() {
        if (!redeemInput || !redeemBtn || !redeemMessage) {
            console.warn('⚠️ Elementos de canje no encontrados');
            return;
        }

        const code = redeemInput.value.trim().toUpperCase();
        if (!code) {
            redeemMessage.textContent = '❌ Ingresa un código válido.';
            redeemMessage.className = 'redeem-message error';
            return;
        }

        // Deshabilitar botón
        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        try {
            // Usar apiPost si existe, si no, fetch directo
            let data;
            const token = localStorage.getItem('token');
            if (typeof window.apiPost === 'function') {
                data = await window.apiPost('/user/redeem', { code });
            } else {
                const response = await fetch('/api/user/redeem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ code })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Error al canjear');
                }
                data = await response.json();
            }

            // Actualizar créditos del usuario
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.credits = (user.credits || 0) + (data.amount || 0);
            localStorage.setItem('user', JSON.stringify(user));

            // Actualizar UI (header y dropdown)
            const dropdownCredits = document.getElementById('dropdownCredits');
            if (dropdownCredits) dropdownCredits.textContent = user.credits;
            const headerCredits = document.getElementById('headerCredits');
            if (headerCredits) headerCredits.textContent = user.credits;

            // Mensaje de éxito
            redeemMessage.textContent = '✅ ' + (data.message || 'Código canjeado exitosamente');
            redeemMessage.className = 'redeem-message success';
            redeemInput.value = '';

            // Mostrar notificación
            if (typeof window.showToast === 'function') {
                window.showToast('✅ Código canjeado: +' + data.amount + ' créditos', 'success');
            } else if (typeof window.showSuccess === 'function') {
                window.showSuccess('Código canjeado: +' + data.amount + ' créditos');
            } else {
                alert('✅ Código canjeado: +' + data.amount + ' créditos');
            }

            // Recargar historial (si existe la función)
            if (typeof window.loadRedeemHistory === 'function') {
                window.loadRedeemHistory();
            }

        } catch (error) {
            console.error('Error al canjear:', error);
            redeemMessage.textContent = '❌ ' + (error.message || 'Error al canjear código');
            redeemMessage.className = 'redeem-message error';
            if (typeof window.showToast === 'function') {
                window.showToast('❌ ' + error.message, 'error');
            } else if (typeof window.showError === 'function') {
                window.showError(error.message);
            }
        } finally {
            redeemBtn.disabled = false;
            redeemBtn.innerHTML = '<i class="fas fa-check-circle"></i> Canjear código';
        }
    }

    // ===== FUNCIÓN DE INICIALIZACIÓN (LLAMADA DESDE USER.JS) =====
    function loadCanjear() {
        console.log('🔄 Inicializando canjear...');

        // Obtener referencias a los elementos
        redeemInput = document.getElementById('redeemCodeInput');
        redeemBtn = document.getElementById('redeemBtn');
        redeemMessage = document.getElementById('redeemMessage');

        if (!redeemInput || !redeemBtn || !redeemMessage) {
            console.warn('⚠️ Elementos de canje no encontrados en el DOM');
            return;
        }

        // Clonar botón para eliminar eventos previos
        const newBtn = redeemBtn.cloneNode(true);
        redeemBtn.parentNode.replaceChild(newBtn, redeemBtn);
        redeemBtn = newBtn;

        // Evento click
        redeemBtn.addEventListener('click', redeemCode);

        // Evento Enter en el input
        redeemInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                redeemCode();
            }
        });

        // Convertir a mayúsculas mientras escribe
        redeemInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });

        // Limpiar mensaje al escribir
        redeemInput.addEventListener('input', function() {
            if (redeemMessage) {
                redeemMessage.textContent = '';
                redeemMessage.className = 'redeem-message';
            }
        });

        console.log('✅ Canjear inicializado correctamente');
    }

    // ===== EXPONER FUNCIONES =====
    window.loadCanjear = loadCanjear;
    window.redeemCode = redeemCode;

    console.log('✅ canjear.js cargado');
})();