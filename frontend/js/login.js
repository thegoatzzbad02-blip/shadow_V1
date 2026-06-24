document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const msg = document.getElementById('loginMessage');

    if (!username || !password) {
        msg.className = 'auth-message error';
        msg.textContent = '❌ Todos los campos son obligatorios.';
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            msg.className = 'auth-message success';
            msg.textContent = '✅ Inicio de sesión exitoso. Redirigiendo...';

            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                username: data.username,
                role: data.role,
                credits: data.credits
            }));

            // Redirigir según rol
            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            }, 1500);
        } else {
            msg.className = 'auth-message error';
            msg.textContent = '❌ ' + (data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error en login:', error);
        msg.className = 'auth-message error';
        msg.textContent = '❌ Error de conexión con el servidor.';
    }
});