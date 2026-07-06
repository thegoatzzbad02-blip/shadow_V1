(function () {
    async function loadDashboard() {
        try {
            const [products, users, vouchers] = await Promise.all([
                window.apiGet('/admin/products'),
                window.apiGet('/admin/users'),
                window.apiGet('/admin/vouchers'),
            ]);

            const totalProducts = document.getElementById('totalProducts');
            const totalUsers = document.getElementById('totalUsers');
            const totalCredits = document.getElementById('totalCredits');
            const totalVouchers = document.getElementById('totalVouchers');

            if (totalProducts) totalProducts.textContent = (products || []).length;
            if (totalUsers) totalUsers.textContent = (users || []).length;
            if (totalCredits) totalCredits.textContent = (users || []).reduce((sum, user) => sum + Number(user.credits || 0), 0);
            if (totalVouchers) totalVouchers.textContent = (vouchers || []).length;
        } catch (error) {
            window.showError(error.message || 'No se pudo cargar el dashboard');
        }
    }

    window.loadDashboard = loadDashboard;
})();
