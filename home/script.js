// Variables globales
let allProducts = [];
let cart = [];
let currentProductModal = null;

// Aplicar tema según hora del día
function applyThemeByTime() {
    const hour = new Date().getHours();
    const body = document.body;
    
    body.classList.remove('morning-theme', 'afternoon-theme', 'night-theme');
    
    if (hour >= 6 && hour < 12) {
        body.classList.add('morning-theme');
    } else if (hour >= 12 && hour < 19) {
        body.classList.add('afternoon-theme');
    } else {
        body.classList.add('night-theme');
    }
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
        
        allProducts = data;
        displayProducts(allProducts);
        
        if (data.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('emptyState').innerHTML = '<p>No hay productos disponibles. Ve al panel de administración para agregar productos.</p>';
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

// Mostrar productos en el grid
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (!products || products.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        container.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    
    container.innerHTML = products.map(product => {
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
}

// Filtrar productos
function filterProducts() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const categoryValue = document.getElementById('categoryFilter').value;

    const filtered = allProducts.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchValue);
        const matchesCategory = !categoryValue || product.categoria === categoryValue;
        return matchesSearch && matchesCategory;
    });

    displayProducts(filtered);
}

// Filtrar por categoría
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    filterProducts();
    document.getElementById('productsContainer').scrollIntoView({ behavior: 'smooth' });
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

function closeCartIfOutside(event) {
    if (event.target.id === 'cartModal') {
        toggleCart();
    }
}

// Agregar al carrito
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.unidades === 0) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
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
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotalItems = document.getElementById('cartTotalItems');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotalItems.textContent = totalItems;
    cartTotalPrice.textContent = `Gs. ${totalPrice.toLocaleString('es-PY')}`;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <p>Tu carrito está vacío</p>
                <p style="font-size: 14px; margin-top: 8px;">¡Agrega productos para comenzar!</p>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>Gs. ${parseInt(item.precio).toLocaleString('es-PY')} × ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">
                    Eliminar
                </button>
            </div>
        `).join('');
    }
}

// Eliminar del carrito
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    showNotification('Producto eliminado del carrito');
}

// Toggle carrito
function toggleCart() {
    const modal = document.getElementById('cartModal');
    const isActive = modal.classList.contains('active');
    
    if (isActive) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const message = `¡Gracias por tu compra!\n\nTotal de items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}\nTotal a pagar: Gs. ${total.toLocaleString('es-PY')}\n\nTu pedido será procesado pronto.`;
    
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
        if (document.getElementById('cartModal').classList.contains('active')) {
            toggleCart();
        }
    }
});

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    applyThemeByTime();
    loadProducts();
    updateCart();
    
    // Actualizar tema cada hora
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