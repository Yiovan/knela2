let productos = [
            { id: 1, nombre: 'Empanada de Carne', categoria: 'salado', precio: 3500, unidades: 50, imagen: null },
            { id: 2, nombre: 'Café con Leche', categoria: 'bebidas', precio: 2500, unidades: 100, imagen: null },
            { id: 3, nombre: 'Medialunas', categoria: 'desayuno', precio: 1500, unidades: 80, imagen: null },
            { id: 4, nombre: 'Torta de Chocolate', categoria: 'dulce', precio: 15000, unidades: 12, imagen: null },
        ];

        let editingId = null;
        let currentImage = null;

        function renderProducts(productsToRender = productos) {
            const container = document.getElementById('productsContainer');
            const emptyState = document.getElementById('emptyState');

            if (productsToRender.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
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

        function openModal(product = null) {
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modalTitle');
            const submitBtn = document.querySelector('.btn-submit');

            if (product) {
                editingId = product.id;
                modalTitle.textContent = 'Editar Producto';
                submitBtn.textContent = 'Guardar Cambios';
                document.getElementById('nombreInput').value = product.nombre;
                document.getElementById('categoriaInput').value = product.categoria;
                document.getElementById('precioInput').value = product.precio;
                document.getElementById('unidadesInput').value = product.unidades;
                currentImage = product.imagen;
                if (product.imagen) {
                    document.getElementById('imagePreview').src = product.imagen;
                    document.getElementById('imagePreview').style.display = 'block';
                }
            } else {
                editingId = null;
                modalTitle.textContent = 'Nuevo Producto';
                submitBtn.textContent = 'Crear Producto';
                document.getElementById('nombreInput').value = '';
                document.getElementById('categoriaInput').value = 'dulce';
                document.getElementById('precioInput').value = '';
                document.getElementById('unidadesInput').value = '';
                document.getElementById('imagenInput').value = '';
                document.getElementById('imagePreview').style.display = 'none';
                currentImage = null;
            }

            modal.classList.add('active');
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }

        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentImage = e.target.result;
                    document.getElementById('imagePreview').src = e.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }

        function saveProduct() {
            const nombre = document.getElementById('nombreInput').value.trim();
            const categoria = document.getElementById('categoriaInput').value;
            const precio = parseInt(document.getElementById('precioInput').value);
            const unidades = parseInt(document.getElementById('unidadesInput').value);

            if (!nombre || !precio || !unidades) {
                alert('Por favor completa todos los campos requeridos');
                return;
            }

            if (editingId) {
                const index = productos.findIndex(p => p.id === editingId);
                productos[index] = {
                    id: editingId,
                    nombre,
                    categoria,
                    precio,
                    unidades,
                    imagen: currentImage
                };
            } else {
                const newId = Math.max(...productos.map(p => p.id), 0) + 1;
                productos.push({
                    id: newId,
                    nombre,
                    categoria,
                    precio,
                    unidades,
                    imagen: currentImage
                });
            }

            renderProducts();
            closeModal();
        }

        function editProduct(id) {
            const product = productos.find(p => p.id === id);
            if (product) {
                openModal(product);
            }
        }

        function deleteProduct(id) {
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                productos = productos.filter(p => p.id !== id);
                renderProducts();
                filterProducts();
            }
        }

        document.getElementById('modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        renderProducts();
  