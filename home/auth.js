// auth.js - Sistema de autenticación con base de datos real

// Verificar si el usuario está logueado
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '../login/Login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Obtener usuario desde la base de datos
async function obtenerUsuarioVerificado(userId) {
    try {
        // Llamar al endpoint de tu servidor
        const response = await fetch(`http://localhost:3000/api/usuarios/${userId}`);
        
        if (!response.ok) {
            throw new Error('Usuario no encontrado');
        }
        
        const usuario = await response.json();
        
        // Verificar que el usuario esté verificado
        if (usuario && usuario.verificado) {
            return usuario;
        }
        
        return null;// auth.js - Sistema de autenticación con base de datos real

// Verificar si el usuario está logueado
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Redirigir al login si no hay usuario
        window.location.href = '/login/Login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Obtener usuario desde la base de datos
async function obtenerUsuarioVerificado(userId) {
    try {
        console.log('🔍 Buscando usuario con ID:', userId);
        
        // Llamar al endpoint de tu servidor
        const response = await fetch(`http://localhost:3000/api/usuarios/${userId}`);
        
        if (!response.ok) {
            throw new Error('Usuario no encontrado');
        }
        
        const usuario = await response.json();
        console.log('✅ Usuario obtenido:', usuario);
        
        // Verificar que el usuario esté verificado
        if (usuario && usuario.verificado) {
            return usuario;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        // Si hay error al obtener de la BD, usar el usuario del localStorage
        return checkLogin();
    }
}

// Mostrar información del usuario
async function displayUserInfo() {
    const storedUser = checkLogin();
    
    if (!storedUser) {
        console.log('❌ No hay usuario en localStorage');
        return;
    }
    
    console.log('👤 Usuario en localStorage:', storedUser);
    
    // Primero mostrar el nombre del localStorage mientras carga
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage && storedUser.nombre) {
        welcomeMessage.textContent = `Bienvenido ${storedUser.nombre}`;
    }
    
    // Luego intentar obtener datos frescos de la BD
    try {
        const usuarioVerificado = await obtenerUsuarioVerificado(storedUser.id);
        
        if (usuarioVerificado && welcomeMessage) {
            // Actualizar con datos frescos de la BD
            welcomeMessage.textContent = `Bienvenido ${usuarioVerificado.nombre}`;
            
            // Actualizar localStorage con datos frescos
            localStorage.setItem('currentUser', JSON.stringify(usuarioVerificado));
        }
    } catch (error) {
        console.error('⚠️ Error al actualizar datos del usuario:', error);
        // Si falla, mantener el nombre del localStorage
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('currentUser');
        window.location.href = '/login/Login.html';
    }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando auth.js...');
    displayUserInfo();
});
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
}

// Mostrar información del usuario
async function displayUserInfo() {
    const storedUser = checkLogin();
    if (storedUser) {
        // Verificar usuario en la base de datos
        const usuarioVerificado = await obtenerUsuarioVerificado(storedUser.id);
        
        if (usuarioVerificado) {
            // Actualizar el mensaje de bienvenida con el nombre completo
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bienvenido ${usuarioVerificado.nombre}`;
            }
            
            // Actualizar localStorage con datos frescos
            localStorage.setItem('currentUser', JSON.stringify(usuarioVerificado));
        } else {
            // Usuario no verificado o no existe
            console.error('Usuario no verificado o no existe en la base de datos');
            localStorage.removeItem('currentUser');
            window.location.href = '../login/Login.html';
        }
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('currentUser');
        window.location.href = '../login/Login.html';
    }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    displayUserInfo();
});