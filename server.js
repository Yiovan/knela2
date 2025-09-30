const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(cors());

// Configuración SQL Server
const config = {
    user: 'knela',
    password: 'knela2025*', 
    server: 'YIO',
    database: 'knela',
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// 🔹 REGISTRO DE USUARIO
app.post('/api/auth/registro', async (req, res) => {
    const { usuario, email, password } = req.body;
    
    // Validaciones básicas
    if (!usuario || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son requeridos' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }

    try {
        let pool = await sql.connect(config);
        
        // Verificar si el usuario ya existe
        let checkUser = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('email', sql.VarChar, email)
            .query("SELECT * FROM usuarios WHERE usuario=@usuario OR email=@email");

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El usuario o email ya existe' 
            });
        }

        // Insertar nuevo usuario
        await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query("INSERT INTO usuarios (usuario, email, password) VALUES (@usuario, @email, @password)");

        res.json({ 
            success: true, 
            message: 'Usuario registrado exitosamente' 
        });

    } catch (err) {
        console.error("Error en registro:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Error al registrar usuario: " + err.message 
        });
    }
});

// 🔹 LOGIN DE USUARIO
app.post('/api/auth/login', async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        let pool = await sql.connect(config);
        
        // Buscar usuario (puede ser por usuario o email)
        let result = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .query("SELECT * FROM usuarios WHERE (usuario=@usuario OR email=@usuario) AND activo=1");

        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const user = result.recordset[0];

        // Verificar contraseña
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }

        // Login exitoso
        res.json({ 
            success: true, 
            message: 'Login exitoso',
            usuario: {
                id: user.id,
                usuario: user.usuario,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Error en login:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Error al iniciar sesión: " + err.message 
        });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (EXISTENTES)
// ========================================

// 🔹 OBTENER TODOS LOS PRODUCTOS
app.get('/api/productos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM producto");
        
        const productosConImagenes = result.recordset.map(producto => {
            let imagenBase64 = null;
            
            if (producto.imagen && producto.imagen.length > 0) {
                imagenBase64 = `data:image/jpeg;base64,${producto.imagen.toString('base64')}`;
            }

            return {
                ...producto,
                imagen: imagenBase64
            };
        });

        res.json(productosConImagenes);

    } catch (err) {
        console.error("Error en GET /api/productos:", err.message);
        res.status(500).send("Error al obtener productos: " + err.message);
    }
});

// 🔹 CREAR NUEVO PRODUCTO
app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio, unidades, imagen } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('categoria', sql.VarChar, categoria)
            .input('precio', sql.Int, precio)
            .input('unidades', sql.Int, unidades)
            .input('imagen', sql.VarBinary, imagen ? Buffer.from(imagen.split(',')[1], 'base64') : null)
            .query("INSERT INTO producto (nombre, categoria, precio, unidades, imagen) VALUES (@nombre, @categoria, @precio, @unidades, @imagen)");
        res.send("Producto agregado");
    } catch (err) {
        console.error("Error en POST /api/productos:", err.message);
        res.status(500).send("Error al crear producto: " + err.message);
    }
});

// 🔹 ACTUALIZAR PRODUCTO
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio, unidades, imagen } = req.body;
    try {
        let pool = await sql.connect(config);
        
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

// 🔹 ELIMINAR PRODUCTO
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