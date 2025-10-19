// script.js - Versión conectada a la API de Node.js

let productos = []; 
let editingId = null;
let currentImage = null; // Almacena la imagen en Base64
let currentPage = 1;
const itemsPerPage = 9;

// 🔹 CARGAR PRODUCTOS DESDE LA API (Lee desde SQL Server)
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/productos');
        
        if (response.ok) {
            productos = await response.json(); 
        } else {
            console.error('Error al cargar productos:', await response.text());
            productos = [];
        }
    } catch (error) {
        console.error('Error de conexión:', error.message);
        productos = [];
    }
    
    filterProducts(); 
}

// 🔹 RENDERIZAR PRODUCTOS
function renderProducts(productsToRender) { 
    const container = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');

    if (productsToRender.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';

    container.innerHTML = productsToRender.map(p => `
        <div class="card">
            <div class="thumb">
                <span class="badge">${p.categoria}</span>
                ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}">` : '<div class="camera-icon">📷</div>'}
            </div>
            <div class="content">
                <div class="title">${p.nombre}</div>
                <div class="price">
                    <b>₲${p.precio.toLocaleString()}</b>
                </div>
                <div class="stock">Stock: <span>${p.unidades}</span> unidades</div>
                <div class="actions-row">
                    <button class="btn-sm" onclick="editProduct(${p.id})">
                        <span class="material-symbols-outlined">edit</span> Editar
                    </button>
                    <button class="btn-sm delete" onclick="deleteProduct(${p.id})">
                        <span class="material-symbols-outlined">close</span> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 🔹 FILTRAR PRODUCTOS
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = productos.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || p.categoria === category;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

// 🔹 ABRIR MODAL
function openModal(product = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.querySelector('.btn-submit');
    
    const getProductValue = (prop, defaultValue = '') => product ? product[prop] : defaultValue;
    
    editingId = getProductValue('id');
    modalTitle.textContent = product ? 'Editar Producto' : 'Nuevo Producto';
    submitBtn.textContent = product ? 'Guardar Cambios' : 'Crear Producto';
    
    document.getElementById('nombreInput').value = getProductValue('nombre');
    document.getElementById('categoriaInput').value = getProductValue('categoria', 'dulce');
    document.getElementById('precioInput').value = getProductValue('precio');
    document.getElementById('unidadesInput').value = getProductValue('unidades');
    
    // Manejar checkboxes según el valor guardado
    const disponiblePara = getProductValue('disponible_para', '');
    
    if (disponiblePara === 'ambos') {
        document.getElementById('paraProfesorInput').checked = true;
        document.getElementById('paraAlumnoInput').checked = true;
    } else if (disponiblePara === 'profesor') {
        document.getElementById('paraProfesorInput').checked = true;
        document.getElementById('paraAlumnoInput').checked = false;
    } else if (disponiblePara === 'alumno') {
        document.getElementById('paraProfesorInput').checked = false;
        document.getElementById('paraAlumnoInput').checked = true;
    } else {
        document.getElementById('paraProfesorInput').checked = false;
        document.getElementById('paraAlumnoInput').checked = false;
    }
    
    currentImage = getProductValue('imagen');
    const imagePreview = document.getElementById('imagePreview');
    
    if (currentImage) {
        imagePreview.src = currentImage;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
        imagePreview.src = ''; 
    }
    document.getElementById('imagenInput').value = '';

    modal.classList.add('active');
}

// 🔹 GUARDAR PRODUCTO
async function saveProduct() {
    const nombre = document.getElementById('nombreInput').value.trim();
    const categoria = document.getElementById('categoriaInput').value;
    const precio = parseInt(document.getElementById('precioInput').value);
    const unidades = parseInt(document.getElementById('unidadesInput').value);
    
    // Obtener valores de los checkboxes
    const paraProfesor = document.getElementById('paraProfesorInput').checked;
    const paraAlumno = document.getElementById('paraAlumnoInput').checked;
    
    // Validar que al menos uno esté seleccionado
    if (!paraProfesor && !paraAlumno) {
        alert('⚠️ Debes seleccionar al menos un tipo de usuario (Profesor o Alumno).');
        return;
    }

    if (!nombre || isNaN(precio) || isNaN(unidades) || precio < 0 || unidades < 0) {
        alert('Por favor, completa correctamente todos los campos (precio y unidades deben ser números positivos).');
        return;
    }

    // Si ambos están seleccionados, guardar "ambos"
    let disponiblePara;
    if (paraProfesor && paraAlumno) {
        disponiblePara = 'ambos';
    } else if (paraProfesor) {
        disponiblePara = 'profesor';
    } else {
        disponiblePara = 'alumno';
    }

    const productData = {
        nombre,
        categoria,
        precio,
        unidades,
        imagen: currentImage,
        disponible_para: disponiblePara
    };

    try {
        let response;
        
        if (editingId) {
            response = await fetch(`http://localhost:3000/api/productos/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch('http://localhost:3000/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (response.ok) {
            alert(editingId ? '✅ Producto actualizado exitosamente' : '✅ Producto creado exitosamente');
            await loadProducts(); 
            closeModal();
        } else {
            const errorMessage = await response.text();
            alert('❌ Error al guardar: ' + errorMessage);
        }
    } catch (error) {
        alert('❌ Error de conexión con el servidor: ' + error.message);
    }
}

// 🔹 ELIMINAR PRODUCTO
async function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción es irreversible.')) {
        try {
            const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Producto eliminado exitosamente');
                await loadProducts(); 
            } else {
                const errorMessage = await response.text();
                alert('Error al eliminar: ' + errorMessage);
            }
        } catch (error) {
            alert('Error de conexión con el servidor: ' + error.message);
        }
    }
}

// 🔹 EDITAR PRODUCTO
function editProduct(id) {
    const product = productos.find(p => p.id === id);
    if (product) {
        openModal(product);
    }
}

// 🔹 CERRAR MODAL
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// 🔹 PREVIEW DE IMAGEN
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImage = e.target.result; // Base64 para enviar al servidor
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Listener para cerrar modal haciendo clic fuera
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 🔹 INICIALIZAR: Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', loadProducts);