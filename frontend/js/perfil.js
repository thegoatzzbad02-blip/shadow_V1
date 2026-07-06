(function () {
    async function loadProfile() {
        const usernameEl = document.getElementById('profileUsername');
        const creditsEl = document.getElementById('profileCredits');
        const sinceEl = document.getElementById('profileSince');
        const emailEl = document.getElementById('profileEmail');
        if (!usernameEl || !creditsEl || !sinceEl || !emailEl) return;

        try {
            const profile = await window.apiGet('/user/profile');
            usernameEl.textContent = profile.username || 'Usuario';
            creditsEl.textContent = window.formatCredits(profile.credits || 0);
            sinceEl.textContent = window.formatDate(profile.created_at || '');
            emailEl.textContent = profile.email || 'Sin correo registrado';

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.credits = profile.credits || 0;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            usernameEl.textContent = 'Usuario';
            creditsEl.textContent = '0';
            sinceEl.textContent = 'Sin fecha';
            emailEl.textContent = 'No disponible';
        }
    }

    function cerrarSesion() {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadProfile();
        const logoutButton = document.querySelector('[onclick="cerrarSesion()"]');
        if (logoutButton) {
            logoutButton.addEventListener('click', cerrarSesion);
        }
    });

    window.cerrarSesion = cerrarSesion;
    window.loadProfile = loadProfile;
})();
