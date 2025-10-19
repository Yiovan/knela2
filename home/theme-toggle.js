// theme-toggle.js - Cambio de tema claro/oscuro

// Función para cambiar el tema manualmente
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    // Remover todos los temas
    body.classList.remove('morning-theme', 'afternoon-theme', 'night-theme');
    
    // Obtener el tema actual guardado
    let currentTheme = localStorage.getItem('userTheme') || 'light';
    
    // Alternar entre claro y oscuro
    if (currentTheme === 'light') {
        body.classList.add('night-theme');
        themeIcon.textContent = 'light_mode';
        localStorage.setItem('userTheme', 'dark');
    } else {
        // Volver al tema claro (sin clase adicional)
        themeIcon.textContent = 'dark_mode';
        localStorage.setItem('userTheme', 'light');
    }
}

// Cargar el tema guardado al inicio
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('userTheme');
    const themeIcon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('night-theme');
        if (themeIcon) themeIcon.textContent = 'light_mode';
    } else {
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    }
}); 