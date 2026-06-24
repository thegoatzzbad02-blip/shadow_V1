document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirm = document.getElementById('regConfirmPassword').value.trim();
    const msg = document.getElementById('registerMessage');

    if (!username || !email || !password || !confirm) {
        msg.className = 'auth-message error';
        msg.textContent = '❌ Todos los campos son obligatorios.';
        return;
    }

    if (password.length < 6) {
        msg.className = 'auth-message error';
        msg.textContent = '❌ La contraseña debe tener al menos 6 caracteres.';
        return;
    }

    if (password !== confirm) {
        msg.className = 'auth-message error';
        msg.textContent = '❌ Las contraseñas no coinciden.';
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                confirm_password: confirm
            })
        });

        const data = await response.json();

        if (response.ok) {
            msg.className = 'auth-message success';
            msg.textContent = '✅ ' + (data.message || 'Cuenta creada exitosamente. Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            msg.className = 'auth-message error';
            msg.textContent = '❌ ' + (data.message || 'Error al registrar');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        msg.className = 'auth-message error';
        msg.textContent = '❌ Error de conexión con el servidor.';
    }
});