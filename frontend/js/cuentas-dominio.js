// ================================================================
// CUENTAS A DOMINIO · VERSIÓN CORREGIDA (CON ID CORRECTO)
// ================================================================

console.log('✅ cuentas-dominio.js cargado');

// ===== VARIABLES GLOBALES =====
const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let selectedPlatform = null;
let platforms = [];

// ===== FUNCIÓN PARA ACTUALIZAR EL SALDO EN UI =====
function updateBalanceUI() {
    const balanceEl = document.getElementById('requestBalance');
    if (balanceEl) {
        balanceEl.textContent = `${user.credits || 0} créditos`;
    }
}

// ===== CARGAR PLATAFORMAS DESDE EL BACKEND =====
async function loadPlatforms() {
    // 🔧 CAMBIO: Usar 'platformOptions' en lugar de 'platformGrid'
    const grid = document.getElementById('platformOptions');
    if (!grid) {
        console.warn('⚠️ platformOptions no encontrado');
        return;
    }

    try {
        const response = await fetch('/api/user/plataformas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar plataformas');

        platforms = await response.json();
        console.log('📦 Plataformas recibidas:', platforms);

        if (platforms.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:20px;">No hay plataformas disponibles. Crea una desde el panel admin.</p>';
            return;
        }

        grid.innerHTML = '';
        platforms.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'platform-card';
            btn.dataset.id = p.id;
            btn.dataset.precio = p.precio;
            btn.innerHTML = `
                <i class="${p.icono || 'fas fa-tv'}" style="color: ${p.color || '#3b82f6'};"></i>
                <span>${p.nombre}</span>
                <small>${p.precio} créditos</small>
            `;
            btn.addEventListener('click', function() {
                selectPlatform(p.id);
            });
            grid.appendChild(btn);
        });

        // Seleccionar la primera por defecto
        if (platforms.length > 0) {
            selectPlatform(platforms[0].id);
        }

        updateBalanceUI();

    } catch (error) {
        console.error('Error al cargar plataformas:', error);
        grid.innerHTML = '<p style="color:var(--danger); text-align:center; padding:20px;">Error al cargar plataformas</p>';
    }
}

// ===== SELECCIONAR PLATAFORMA =====
function selectPlatform(id) {
    const platform = platforms.find(p => p.id === id);
    if (!platform) return;

    selectedPlatform = platform;

    // Actualizar UI
    document.querySelectorAll('.platform-card').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.id) === id);
    });

    document.getElementById('serviceSelect').value = id;
    document.getElementById('requestPrice').textContent = `${platform.precio} créditos`;

    // Validar créditos en tiempo real
    const userCredits = user.credits || 0;
    const msg = document.getElementById('requestMessage');
    const btn = document.getElementById('solicitarBtn');

    if (userCredits < platform.precio) {
        msg.textContent = `❌ Créditos insuficientes. Necesitas ${platform.precio} créditos.`;
        msg.style.color = 'var(--danger)';
        if (btn) btn.disabled = true;
    } else {
        msg.textContent = '✅ Créditos suficientes.';
        msg.style.color = 'var(--success)';
        if (btn) btn.disabled = false;
    }
}

// ===== CARGAR SOLICITUDES RECIENTES =====
async function loadRecentRequests() {
    const container = document.getElementById('recentRequests');
    if (!container) return;

    try {
        const response = await fetch('/api/user/mis-solicitudes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar solicitudes');

        const solicitudes = await response.json();
        const recent = solicitudes.slice(0, 3);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="request-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No hay solicitudes recientes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        recent.forEach(s => {
            const div = document.createElement('div');
            div.className = 'request-item';
            const estadoLabels = {
                'pending': '⏳ Pendiente',
                'completed': '✅ Completada',
                'cancelled': '❌ Cancelada'
            };
            div.innerHTML = `
                <span>${s.plataforma}</span>
                <span>${s.email}</span>
                <span class="request-status ${s.estado}">${estadoLabels[s.estado] || s.estado}</span>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar solicitudes recientes:', error);
        container.innerHTML = `<p class="error-message">Error al cargar solicitudes</p>`;
    }
}

// ===== ENVIAR SOLICITUD =====
async function enviarSolicitud(e) {
    if (e) e.preventDefault();
    
    console.log('🔥 Botón clickeado');

    const email = document.getElementById('requestEmail').value.trim();
    const password = document.getElementById('requestPassword').value.trim();
    const msg = document.getElementById('requestMessage');
    const btn = document.getElementById('solicitarBtn');

    // Refrescar usuario desde localStorage
    user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!selectedPlatform) {
        msg.textContent = '❌ Selecciona una plataforma.';
        msg.style.color = 'var(--danger)';
        return;
    }

    if (!email) {
        msg.textContent = '❌ El correo electrónico es obligatorio.';
        msg.style.color = 'var(--danger)';
        return;
    }

    if ((user.credits || 0) < selectedPlatform.precio) {
        msg.textContent = `❌ No tienes créditos suficientes. Necesitas ${selectedPlatform.precio} créditos.`;
        msg.style.color = 'var(--danger)';
        return;
    }

    // Deshabilitar botón
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
        const response = await fetch('/api/user/solicitar-cuenta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                plataforma: selectedPlatform.nombre,
                email: email,
                password: password || 'generado-automaticamente',
                mensaje: ''
            })
        });

        const data = await response.json();
        console.log('📥 Respuesta:', data);

        if (response.ok) {
            msg.textContent = '✅ Solicitud enviada exitosamente. Espera la confirmación.';
            msg.style.color = 'var(--success)';
            document.getElementById('requestEmail').value = '';
            document.getElementById('requestPassword').value = '';

            // Actualizar créditos en localStorage
            if (data.credits_remaining !== undefined) {
                user.credits = data.credits_remaining;
                localStorage.setItem('user', JSON.stringify(user));
                updateBalanceUI();

                // Re-validar créditos
                if (selectedPlatform) {
                    if ((user.credits || 0) < selectedPlatform.precio) {
                        msg.textContent = `❌ Créditos insuficientes. Necesitas ${selectedPlatform.precio} créditos.`;
                        msg.style.color = 'var(--danger)';
                        if (btn) btn.disabled = true;
                    } else {
                        msg.textContent = '✅ Créditos suficientes.';
                        msg.style.color = 'var(--success)';
                        if (btn) btn.disabled = false;
                    }
                }
            }

            // Recargar historial
            loadRecentRequests();

        } else {
            msg.textContent = '❌ ' + (data.message || 'Error al enviar solicitud');
            msg.style.color = 'var(--danger)';
        }
    } catch (error) {
        console.error('Error:', error);
        msg.textContent = '❌ Error de conexión. Intenta de nuevo.';
        msg.style.color = 'var(--danger)';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar cuenta';
        }
    }
}

// ===== CONFIGURAR BOTÓN =====
function configurarBoton() {
    const btn = document.getElementById('solicitarBtn');
    if (btn) {
        // Clonar para eliminar eventos anteriores
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', enviarSolicitud);
        console.log('✅ Botón configurado');
        return newBtn;
    } else {
        console.warn('⚠️ Botón no encontrado');
        return null;
    }
}

// ===== FUNCIÓN DE INICIALIZACIÓN CON REINTENTOS =====
function loadPlataformasSelector() {
    console.log('🚀 loadPlataformasSelector ejecutado');
    
    let intentos = 0;
    const maxIntentos = 20;
    
    function intentarCargar() {
        intentos++;
        console.log(`⏳ Intento ${intentos} de ${maxIntentos}...`);
        
        // 🔧 CAMBIO: Buscar 'platformOptions'
        const grid = document.getElementById('platformOptions');
        const btn = document.getElementById('solicitarBtn');
        
        if (grid) {
            console.log('✅ platformOptions encontrado, cargando...');
            configurarBoton();
            loadPlatforms();
            loadRecentRequests();
            return true;
        }
        
        if (intentos >= maxIntentos) {
            console.error('❌ No se encontró platformOptions después de varios intentos');
            console.warn('💡 Verifica que el HTML contenga: <div id="platformOptions">');
            return false;
        }
        
        setTimeout(intentarCargar, 100);
        return false;
    }
    
    intentarCargar();
}

// ===== EXPONER FUNCIONES PARA USER.JS =====
window.loadPlataformasSelector = loadPlataformasSelector;
window.loadRecentRequests = loadRecentRequests;

// ===== EXPONER OTRAS FUNCIONES PARA DEBUG =====
window.loadPlatforms = loadPlatforms;
window.enviarSolicitud = enviarSolicitud;
window.selectPlatform = selectPlatform;

console.log('✅ cuentas-dominio.js listo (loadPlataformasSelector disponible)');