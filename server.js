const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// Aumentamos el límite de JSON para permitir el envío de imágenes grandes en Base64
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(cors());

// Configuración SQL Server (Usando knela/knela2025*)
const config = {
    user: 'knela',
    password: 'knela2025*', 
    server: 'YIO', // Asegúrate de que 'YIO' o 'localhost' sea correcto
    database: 'knela',
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

// 🔹 1. OBTENER TODOS LOS PRODUCTOS (GET /api/productos)
// server.js

// ... (todo el código anterior)

// Obtener productos (RUTA MODIFICADA PARA CONVERTIR IMAGEN A BASE64)
app.get('/api/productos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM producto");
        
        // 🔹 Conversión clave: transforma el Buffer a cadena Base64 para el frontend
        const productosConImagenes = result.recordset.map(producto => {
            let imagenBase64 = null;
            
            // Verifica si existe la imagen y si es un Buffer de datos
            if (producto.imagen && producto.imagen.length > 0) {
                // Aquí asumes que la imagen es JPEG/PNG y creas el prefijo
                imagenBase64 = `data:image/jpeg;base64,${producto.imagen.toString('base64')}`;
            }

            return {
                ...producto,
                imagen: imagenBase64 // Sobrescribe el campo 'imagen' con el Base64
            };
        });

        res.json(productosConImagenes); // Envía el array con las imágenes corregidas

    } catch (err) {
        console.error("Error en GET /api/productos:", err.message);
        res.status(500).send("Error al obtener productos: " + err.message);
    }
});

// ... (resto de las rutas POST, PUT, DELETE)

// 🔹 2. CREAR NUEVO PRODUCTO (POST /api/productos)
app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio, unidades, imagen } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('categoria', sql.VarChar, categoria)
            .input('precio', sql.Int, precio)
            .input('unidades', sql.Int, unidades)
            // Convierte la imagen Base64 a Buffer VarBinary para SQL
            .input('imagen', sql.VarBinary, imagen ? Buffer.from(imagen.split(',')[1], 'base64') : null)
            .query("INSERT INTO producto (nombre, categoria, precio, unidades, imagen) VALUES (@nombre, @categoria, @precio, @unidades, @imagen)");
        res.send("Producto agregado");
    } catch (err) {
        console.error("Error en POST /api/productos:", err.message);
        res.status(500).send("Error al crear producto: " + err.message);
    }
});

// 🔹 3. ACTUALIZAR PRODUCTO (PUT /api/productos/:id)
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio, unidades, imagen } = req.body;
    try {
        let pool = await sql.connect(config);
        
        // El query mantiene la imagen existente si 'imagen' es nula o la actualiza si se envía Base64.
        let query = `UPDATE producto SET 
                        nombre=@nombre, 
                        categoria=@categoria, 
                        precio=@precio, 
                        unidades=@unidades,
                        imagen=${imagen ? '@imagen' : 'imagen'} 
                    WHERE id=@id`;

        let request = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('categoria', sql.VarChar, categoria)
            .input('precio', sql.Int, precio)
            .input('unidades', sql.Int, unidades);
            
        // Solo agrega el parámetro @imagen si se envió una nueva imagen
        if (imagen) {
            request = request.input('imagen', sql.VarBinary, Buffer.from(imagen.split(',')[1], 'base64'));
        }

        await request.query(query);

        res.send("Producto actualizado");
    } catch (err) {
        console.error("Error en PUT /api/productos/:id:", err.message);
        res.status(500).send("Error al actualizar producto: " + err.message);
    }
});


// 🔹 4. ELIMINAR PRODUCTO (DELETE /api/productos/:id)
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request().input('id', sql.Int, id).query("DELETE FROM producto WHERE id=@id");
        res.send("Producto eliminado");
    } catch (err) {
        console.error("Error en DELETE /api/productos/:id:", err.message);
        res.status(500).send("Error al eliminar producto: " + err.message);
    }
});

// 🔹 INICIO DEL SERVIDOR
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));