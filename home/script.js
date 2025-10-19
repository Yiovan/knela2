// Variables globales
let allProducts = [];
let cart = [];
let currentProductModal = null;

// Variables de paginación
let currentPage = 1;
let productsPerPage = 9;
let filteredProducts = [];

// Aplicar tema según hora del día
function applyThemeByTime() {
    const hour = new Date().getHours();
    const body = document.body;
    
    const userTheme = localStorage.getItem('userTheme');
    if (userTheme === 'dark') {
        body.classList.remove('morning-theme', 'afternoon-theme');
        body.classList.add('night-theme');
        updateThemeIcon();
        return;
    }
    
    body.classList.remove('morning-theme', 'afternoon-theme', 'night-theme');
    
    if (hour >= 6 && hour < 12) {
        body.classList.add('morning-theme');
    } else if (hour >= 12 && hour < 19) {
        body.classList.add('afternoon-theme');
    } else {
        body.classList.add('night-theme');
    }
    updateThemeIcon();
}

// Toggle tema manualmente
function toggleTheme() {
    const body = document.body;
    const currentTheme = localStorage.getItem('userTheme');
    
    if (currentTheme === 'dark') {
        // Cambiar a tema automático (según hora)
        localStorage.removeItem('userTheme');
        applyThemeByTime();
    } else {
        // Cambiar a tema oscuro
        localStorage.setItem('userTheme', 'dark');
        body.classList.remove('morning-theme', 'afternoon-theme');
        body.classList.add('night-theme');
        updateThemeIcon();
    }
}

// Actualizar icono del tema
function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    const isDark = document.body.classList.contains('night-theme');
    themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

// Cargar productos desde el servidor
async function loadProducts() {
    try {
        console.log('Intentando cargar productos...');
        const response = await fetch('http://localhost:3000/api/productos');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Productos recibidos:', data);
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const tipoUsuario = currentUser?.tipo || 'alumno';
        
        console.log('🔍 Tipo de usuario logueado:', tipoUsuario);
        
        const productosFiltrados = data.filter(producto => {
            const disponiblePara = producto.disponible_para || 'ambos';
            
            if (disponiblePara === 'ambos') {
                return true;
            }
            
            if (disponiblePara === tipoUsuario) {
                return true;
            }
            
            return false;
        });
        
        console.log(`📦 Total productos: ${data.length} | Filtrados para ${tipoUsuario}: ${productosFiltrados.length}`);
        
        allProducts = productosFiltrados;
        filteredProducts = productosFiltrados;
        currentPage = 1;
        displayProducts(filteredProducts);
        renderPagination();
        
        if (productosFiltrados.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('emptyState').innerHTML = `
                <p>No hay productos disponibles para tu perfil (${tipoUsuario}).</p>
                <p style="font-size: 14px; margin-top: 8px;">Contacta con un administrador para más información.</p>
            `;
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('emptyState').innerHTML = `
            <p style="color: #e74c3c; font-weight: 600;">⚠️ Error al cargar los productos</p>
            <p style="color: #7F8C8D; font-size: 14px;">Verifica que:</p>
            <ul style="text-align: left; display: inline-block; color: #7F8C8D; font-size: 14px;">
                <li>El servidor esté corriendo en http://localhost:3000</li>
                <li>La base de datos SQL Server esté activa</li>
                <li>Existan productos en la tabla "producto"</li>
            </ul>
        `;
    }
}

// Mostrar productos en el grid con paginación
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (!products || products.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        container.innerHTML = '';
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = products.slice(startIndex, endIndex);
    
    container.innerHTML = productsToShow.map(product => {
        const imagenUrl = product.imagen || 'https://via.placeholder.com/280x220?text=Sin+Imagen';
        
        const stockBadge = product.unidades > 0 && product.unidades < 10 
            ? '<span class="product-badge">¡Pocas unidades!</span>' 
            : product.unidades === 0 
            ? '<span class="product-badge" style="background: #e74c3c;">Sin stock</span>' 
            : '';
        
        return `
            <article class="product-card" data-category="${product.categoria || ''}">
                ${stockBadge}
                <img src="${imagenUrl}" alt="${product.nombre}" class="product-image" onerror="this.src='https://via.placeholder.com/280x220?text=Sin+Imagen'">
                <div class="product-info">
                    <div class="product-name">${product.nombre}</div>
                    <div class="product-rating">⭐ ${(Math.random() * 1 + 4).toFixed(1)} • ${Math.floor(Math.random() * 200 + 50)} reseñas</div>
                    <div class="product-price">
                        <span class="current">Gs. ${parseInt(product.precio).toLocaleString('es-PY')}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-detail" onclick="showDetails(${product.id})">Detalles</button>
                        <button class="btn-buy" onclick="addToCart(${product.id})" ${product.unidades === 0 ? 'disabled' : ''}>
                            ${product.unidades === 0 ? 'Sin stock' : 'Comprar'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    if (currentPage > 1) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Filtrar productos
function filterProducts() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const categoryValue = document.getElementById('categoryFilter').value;

    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchValue);
        const matchesCategory = !categoryValue || product.categoria === categoryValue;
        return matchesSearch && matchesCategory;
    });

    currentPage = 1;
    displayProducts(filteredProducts);
    renderPagination();
}

// Filtrar por categoría
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    filterProducts();
    document.getElementById('productsContainer').scrollIntoView({ behavior: 'smooth' });
}

// Renderizar paginación
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!paginationContainer) return;
    
    let paginationHTML = '<div class="pagination-controls">';
    
    paginationHTML += `
        <div class="products-per-page">
            <label for="perPageSelect">Mostrar:</label>
            <select id="perPageSelect" onchange="changeProductsPerPage(this.value)">
                <option value="9" ${productsPerPage === 9 ? 'selected' : ''}>9 productos</option>
                <option value="12" ${productsPerPage === 12 ? 'selected' : ''}>12 productos</option>
                <option value="18" ${productsPerPage === 18 ? 'selected' : ''}>18 productos</option>
                <option value="24" ${productsPerPage === 24 ? 'selected' : ''}>24 productos</option>
                <option value="50" ${productsPerPage === 50 ? 'selected' : ''}>50 productos</option>
            </select>
        </div>
    `;
    
    paginationHTML += '</div>';
    
    if (totalPages > 1) {
        paginationHTML += '<div class="pagination">';
        
        paginationHTML += `
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
        `;
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
        }
        
        paginationHTML += `
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        `;
        
        paginationHTML += '</div>';
    }
    
    const startItem = (currentPage - 1) * productsPerPage + 1;
    const endItem = Math.min(currentPage * productsPerPage, filteredProducts.length);
    paginationHTML += `
        <div class="pagination-info">
            Mostrando ${startItem}-${endItem} de ${filteredProducts.length} productos
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Cambiar de página
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayProducts(filteredProducts);
    renderPagination();
}

// Cambiar cantidad de productos por página
function changeProductsPerPage(value) {
    productsPerPage = parseInt(value);
    currentPage = 1;
    displayProducts(filteredProducts);
    renderPagination();
}

// Mostrar detalles del producto
function showDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    currentProductModal = product;

    document.getElementById('modalImage').src = product.imagen || 'https://via.placeholder.com/600x300?text=Sin+Imagen';
    document.getElementById('modalTitle').textContent = product.nombre;
    document.getElementById('modalCategory').textContent = product.categoria || 'Sin categoría';
    document.getElementById('modalPrice').textContent = `Gs. ${parseInt(product.precio).toLocaleString('es-PY')}`;
    
    const stockElement = document.getElementById('modalStock');
    const unidades = product.unidades || 0;
    
    stockElement.className = 'modal-details-value modal-details-stock';
    
    if (unidades === 0) {
        stockElement.classList.add('out');
        stockElement.innerHTML = '❌ Sin stock';
    } else if (unidades < 10) {
        stockElement.classList.add('low');
        stockElement.innerHTML = `⚠️ ${unidades} unidades disponibles`;
    } else {
        stockElement.classList.add('available');
        stockElement.innerHTML = `✓ ${unidades} unidades disponibles`;
    }

    const addButton = document.getElementById('modalAddToCart');
    if (unidades === 0) {
        addButton.disabled = true;
        addButton.textContent = 'Sin stock';
    } else {
        addButton.disabled = false;
        addButton.textContent = 'Agregar al carrito';
    }

    document.getElementById('modalDetails').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de detalles
function closeDetailsModal() {
    document.getElementById('modalDetails').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentProductModal = null;
}

// Agregar al carrito desde el modal
function addToCartFromModal() {
    if (currentProductModal && currentProductModal.unidades > 0) {
        addToCart(currentProductModal.id);
        closeDetailsModal();
    }
}

// Cerrar modal al hacer clic fuera
function closeDetailsIfOutside(event) {
    if (event.target.id === 'modalDetails') {
        closeDetailsModal();
    }
}

// ===== FUNCIONES DEL CARRITO ARREGLADAS =====

// Toggle del modal del carrito
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    const content = document.getElementById('cart-content');
    
    if (!modal) return;
    
    const isHidden = modal.classList.contains('hidden');
    
    if (isHidden) {
        // Abrir modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // Animación de entrada
        setTimeout(() => {
            if (content) {
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }
        }, 10);
    } else {
        // Cerrar modal
        if (content) {
            content.style.transform = 'scale(0.95)';
            content.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Función alternativa para cerrar el modal
function toggleCartModal() {
    toggleCart();
}

// Agregar al carrito
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.unidades === 0) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Verificar que no exceda el stock
        if (existingItem.quantity < product.unidades) {
            existingItem.quantity++;
        } else {
            showNotification(`Solo hay ${product.unidades} unidades disponibles`);
            return;
        }
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${product.nombre} agregado al carrito`);
}

// Actualizar carrito
function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cartCount');
    const summaryCount = document.getElementById('summary-count');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutButton = document.getElementById('cart-checkout-button');
    const scheduleButton = document.getElementById('cart-schedule-button');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    
    // Actualizar contadores
    if (cartCount) cartCount.textContent = totalItems;
    if (summaryCount) summaryCount.textContent = totalItems;
    if (summaryTotal) summaryTotal.textContent = `G. ${totalPrice.toLocaleString('es-PY')}`;
    
    // Habilitar/deshabilitar botones
    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }
    if (scheduleButton) {
        scheduleButton.disabled = cart.length === 0;
    }
    
    // Mostrar items del carrito
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <p class="text-lg font-semibold">Tu carrito está vacío</p>
                    <p class="text-sm mt-2">¡Agrega productos para comenzar!</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${item.nombre}</h4>
                        <p class="text-sm text-gray-600">G. ${parseInt(item.precio).toLocaleString('es-PY')} × ${item.quantity}</p>
                        <p class="text-sm font-semibold text-gray-800 mt-1">Subtotal: G. ${(item.precio * item.quantity).toLocaleString('es-PY')}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="decreaseQuantity(${index})" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded-lg transition">
                            −
                        </button>
                        <span class="font-semibold text-gray-900 min-w-[30px] text-center">${item.quantity}</span>
                        <button onclick="increaseQuantity(${index})" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded-lg transition">
                            +
                        </button>
                        <button onclick="removeFromCart(${index})" class="ml-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg transition">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Aumentar cantidad
function increaseQuantity(index) {
    const item = cart[index];
    const product = allProducts.find(p => p.id === item.id);
    
    if (item.quantity < product.unidades) {
        item.quantity++;
        updateCart();
    } else {
        showNotification(`Solo hay ${product.unidades} unidades disponibles`);
    }
}

// Disminuir cantidad
function decreaseQuantity(index) {
    const item = cart[index];
    
    if (item.quantity > 1) {
        item.quantity--;
        updateCart();
    } else {
        removeFromCart(index);
    }
}

// Eliminar del carrito
function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1);
    updateCart();
    showNotification(`${removedItem.nombre} eliminado del carrito`);
}

// Procesar orden del carrito
function processCartOrder(isScheduled) {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    let message = '';
    
    if (isScheduled) {
        const deposito = total * 0.5;
        message = `🗓️ PEDIDO PROGRAMADO PARA MAÑANA\n\n`;
        message += `Total de items: ${totalItems}\n`;
        message += `Total: G. ${total.toLocaleString('es-PY')}\n`;
        message += `Depósito requerido (50%): G. ${deposito.toLocaleString('es-PY')}\n`;
        message += `Saldo restante: G. ${(total - deposito).toLocaleString('es-PY')}\n\n`;
        message += `Tu pedido será procesado mañana.`;
    } else {
        message = `✅ PAGAR PEDIDO AHORA\n\n`;
        message += `Total de items: ${totalItems}\n`;
        message += `Total a pagar: G. ${total.toLocaleString('es-PY')}\n\n`;
        message += `Tu pedido será procesado pronto.`;
    }
    
    alert(message);
    cart = [];
    updateCart();
    toggleCart();
}

// Mostrar notificación
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Cerrar modales con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('modalDetails').classList.contains('active')) {
            closeDetailsModal();
        }
        if (document.getElementById('cart-modal') && !document.getElementById('cart-modal').classList.contains('hidden')) {
            toggleCart();
        }
    }
});

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    applyThemeByTime();
    loadProducts();
    updateCart();
    
    setInterval(applyThemeByTime, 3600000);
});

// Añadir estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);