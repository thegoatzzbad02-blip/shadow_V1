(function () {
    async function loadUsers() {
        const list = document.getElementById('userList');
        if (!list) return;
        list.innerHTML = '<p class="loading-message">Cargando usuarios...</p>';

        try {
            const users = await window.apiGet('/admin/users');
            if (!users.length) {
                list.innerHTML = '<p class="empty-message">No hay usuarios registrados.</p>';
                return;
            }

            list.innerHTML = users.map((user) => `
                <div class="admin-list-item">
                    <div>
                        <strong>${window.escapeHtml(user.username)}</strong>
                        <div class="muted">Rol: ${window.escapeHtml(user.role || 'user')} · Créditos: ${window.formatCredits(user.credits || 0)}</div>
                    </div>
                    <div class="admin-actions">
                        <button onclick="window.editUser(${user.id})">Editar</button>
                        <button class="danger" onclick="window.deleteUser(${user.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            list.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function createUser() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const credits = Number(document.getElementById('newCredits').value || 0);
        if (!username || !password) {
            window.showError('Usuario y contraseña son obligatorios');
            return;
        }

        try {
            await window.apiPost('/admin/users', { username, password, credits });
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newCredits').value = '0';
            window.showSuccess('Usuario creado correctamente');
            loadUsers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    async function editUser(id) {
        const username = prompt('Nuevo nombre de usuario');
        if (username === null) return;
        const credits = Number(prompt('Nuevos créditos', '0'));
        if (Number.isNaN(credits)) return;

        try {
            await window.apiPut(`/admin/users/${id}`, { username: username.trim(), credits });
            window.showSuccess('Usuario actualizado');
            loadUsers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    async function deleteUser(id) {
        if (!confirm('¿Eliminar este usuario?')) return;
        try {
            await window.apiDelete(`/admin/users/${id}`);
            window.showSuccess('Usuario eliminado');
            loadUsers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('createUserBtn');
        if (button) button.addEventListener('click', createUser);
    });

    window.loadUsers = loadUsers;
    window.createUser = createUser;
    window.editUser = editUser;
    window.deleteUser = deleteUser;
})();
