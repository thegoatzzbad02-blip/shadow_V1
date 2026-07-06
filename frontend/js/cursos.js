// ================================================================
// CURSOS · PRÓXIMAMENTE (DISEÑO INFORMATIVO)
// ================================================================

(function () {
    const section = 'cursos';

    // ===== CARGAR CURSOS (SOLO MUESTRA MENSAJE) =====
    async function loadCursos() {
        const container = document.getElementById('products-cursos');
        if (!container) {
            console.warn('⚠️ Contenedor #products-cursos no encontrado');
            return;
        }

        // Mostrar mensaje de "Próximamente" con diseño atractivo
        container.innerHTML = `
            <div class="cursos-proximamente">
                <div class="cursos-proximamente-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h2>📚 Cursos disponibles pronto</h2>
                <p>Estamos preparando contenido educativo de alta calidad para ti.</p>
                <div class="cursos-proximamente-features">
                    <span>🎓 Aprende de expertos</span>
                    <span>📹 Clases en video</span>
                    <span>📄 Material descargable</span>
                    <span>🏆 Certificados</span>
                </div>
                <div class="cursos-proximamente-notificacion">
                    <i class="fas fa-bell"></i>
                    <span>¡Suscríbete para recibir notificaciones cuando estén disponibles!</span>
                </div>
                <div class="cursos-proximamente-timer">
                    <span>⏳ Estamos trabajando en ello</span>
                </div>
            </div>
        `;
    }

    // ===== EXPONER =====
    window.loadCursos = loadCursos;

    console.log('✅ cursos.js cargado (modo "Próximamente")');
})();